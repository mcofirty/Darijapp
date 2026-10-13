/**
 * Coefficients MFCC d'un signal mono : ce que l'oreille retient d'un son, trame par trame.
 * Logique pure, sans dépendance au navigateur (le décodage et le rééchantillonnage se font avant).
 */

/** Fréquence d'échantillonnage attendue, en Hz : on rééchantillonne tout à 16 kHz avant l'analyse. */
export const FREQUENCE = 16000
const TRAME = 400 // 25 ms
const PAS = 80 // 5 ms
const TAILLE_FFT = 512
const FILTRES = 26
const COEFFICIENTS = 13
const FREQ_MIN = 80
const FREQ_MAX = 7600

/** Zéros du sinus cardinal gardés de chaque côté : plus il y en a, plus le filtre est raide. */
const LOBES = 8

/**
 * Rééchantillonne à 16 kHz par un filtre en sinus cardinal fenêtré (Hann), coupé à 90 % de la
 * nouvelle fréquence de Nyquist. Fait ici plutôt que par le navigateur : Chrome replie les aigus
 * (5 dB de trop au-dessus de 5 kHz), et le même calcul sert aux tests et à l'appli.
 */
export function reechantillonner(signal: Float32Array, depuis: number, vers = FREQUENCE): Float32Array {
  if (depuis === vers) return signal
  const ratio = depuis / vers
  // Coupure en cycles par échantillon d'entrée.
  const coupure = (0.9 * Math.min(depuis, vers)) / 2 / depuis
  const demiLargeur = Math.ceil(LOBES / (2 * coupure))
  const longueur = Math.floor(signal.length / ratio)
  const sortie = new Float32Array(longueur)
  for (let i = 0; i < longueur; i++) {
    const x = i * ratio
    const centre = Math.floor(x)
    let somme = 0
    let poids = 0
    for (let j = Math.max(0, centre - demiLargeur + 1); j <= Math.min(signal.length - 1, centre + demiLargeur); j++) {
      const d = x - j
      const arg = 2 * coupure * d
      const sinc = arg === 0 ? 1 : Math.sin(Math.PI * arg) / (Math.PI * arg)
      const fenetre = 0.5 + 0.5 * Math.cos((Math.PI * d) / demiLargeur)
      const w = sinc * fenetre
      somme += signal[j] * w
      poids += w
    }
    sortie[i] = poids ? somme / poids : 0
  }
  return sortie
}

/** Énergie (dB) de chaque trame. */
function energies(signal: Float32Array): number[] {
  const n = Math.max(0, Math.floor((signal.length - TRAME) / PAS) + 1)
  const e: number[] = []
  for (let t = 0; t < n; t++) {
    let s = 0
    for (let i = 0; i < TRAME; i++) s += signal[t * PAS + i] ** 2
    e.push(10 * Math.log10(s / TRAME + 1e-10))
  }
  return e
}

/** Pause la plus longue (s) à l'intérieur d'un mot, et entre les mots d'une phrase dite par un débutant. */
export const PAUSE_MOT = 0.35
export const PAUSE_PHRASE = 0.8

/**
 * Garde la parole et retire le silence autour : les trames à moins de `seuil` dB du maximum,
 * regroupées quand moins de `pause` s les sépare (0,35 s : les pauses d'un mot sont plus courtes ;
 * 0,8 s pour une phrase, dont les mots sont séparés) ; on garde le groupe le plus fort, plus une
 * petite marge (`marge`, en s). Un bruit isolé (toucher l'écran, déclic) avant ou après le mot est ainsi laissé de côté.
 */
export function rogner(signal: Float32Array, seuil = 35, pause = PAUSE_MOT, marge = 0.03): Float32Array {
  const e = energies(signal)
  if (e.length === 0) return signal
  const max = Math.max(...e)
  const ecartMax = Math.round((pause * FREQUENCE) / PAS)
  const groupes: { debut: number; fin: number; poids: number }[] = []
  e.forEach((v, t) => {
    if (v <= max - seuil) return
    const dernier = groupes.at(-1)
    const poids = 10 ** (v / 10)
    if (dernier && t - dernier.fin <= ecartMax) {
      dernier.fin = t
      dernier.poids += poids
    } else groupes.push({ debut: t, fin: t, poids })
  })
  const { debut, fin } = groupes.reduce((a, g) => (g.poids > a.poids ? g : a))
  const m = Math.round((marge * FREQUENCE) / PAS)
  const a = Math.max(0, debut - m) * PAS
  const b = Math.min(signal.length, (fin + m) * PAS + TRAME)
  return signal.subarray(a, b)
}

/** Niveau du son le plus fort, en dB (0 = pleine échelle) : sert à repérer un enregistrement muet. */
export function niveauMax(signal: Float32Array): number {
  const e = energies(signal)
  return e.length ? Math.max(...e) : -100
}

/** FFT en place (radix 2), parties réelle et imaginaire séparées. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

const mel = (f: number) => 2595 * Math.log10(1 + f / 700)
const hertz = (m: number) => 700 * (10 ** (m / 2595) - 1)

/**
 * Banc de filtres triangulaires sur l'échelle mel. `etirement` décale les filtres en fréquence :
 * une voix plus aiguë (conduit vocal plus court) a les mêmes formants, un peu plus haut.
 */
function banc(etirement: number): Float64Array[] {
  const points = Array.from({ length: FILTRES + 2 }, (_, i) => hertz(mel(FREQ_MIN) + ((mel(FREQ_MAX) - mel(FREQ_MIN)) * i) / (FILTRES + 1)))
  const cases = points.map((f) => Math.min(TAILLE_FFT / 2, (f * etirement * TAILLE_FFT) / FREQUENCE))
  return Array.from({ length: FILTRES }, (_, m) => {
    const filtre = new Float64Array(TAILLE_FFT / 2 + 1)
    const [g, c, d] = [cases[m], cases[m + 1], cases[m + 2]]
    for (let k = 0; k < filtre.length; k++) {
      if (k > g && k <= c) filtre[k] = (k - g) / (c - g)
      else if (k > c && k < d) filtre[k] = (d - k) / (d - c)
    }
    return filtre
  })
}
const BANCS = new Map<number, Float64Array[]>()

const FENETRE = Float64Array.from({ length: TRAME }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (TRAME - 1)))

/**
 * MFCC du signal (16 kHz) : une ligne par trame de 25 ms, tous les 5 ms, 12 coefficients
 * (le premier, l'énergie, est écarté : il dépend du volume, pas de ce qui est dit).
 * Chaque coefficient est centré et réduit sur l'enregistrement, ce qui gomme le micro et la voix.
 */
export function mfcc(signal: Float32Array, etirement = 1): Float64Array[] {
  let filtres = BANCS.get(etirement)
  if (!filtres) BANCS.set(etirement, (filtres = banc(etirement)))
  // Pré-accentuation : renforce les aigus, où se jouent les consonnes.
  const s = new Float64Array(signal.length)
  for (let i = 0; i < signal.length; i++) s[i] = signal[i] - 0.97 * (signal[i - 1] ?? 0)
  const n = Math.max(0, Math.floor((s.length - TRAME) / PAS) + 1)
  const re = new Float64Array(TAILLE_FFT)
  const im = new Float64Array(TAILLE_FFT)
  const energiesMel: Float64Array[] = []
  let max = 0
  for (let t = 0; t < n; t++) {
    re.fill(0)
    im.fill(0)
    for (let i = 0; i < TRAME; i++) re[i] = s[t * PAS + i] * FENETRE[i]
    fft(re, im)
    const e = new Float64Array(FILTRES)
    for (let m = 0; m < FILTRES; m++) {
      const filtre = filtres[m]
      for (let k = 0; k <= TAILLE_FFT / 2; k++) if (filtre[k]) e[m] += filtre[k] * (re[k] * re[k] + im[k] * im[k])
      max = Math.max(max, e[m])
    }
    energiesMel.push(e)
  }
  // Plancher à 50 dB sous le maximum : les passages presque muets (souffle, bruit du décodage)
  // ne pèsent plus rien, au lieu de donner des coefficients au hasard.
  const plancher = max * 1e-5 + 1e-12
  const trames = energiesMel.map((e) => {
    const logMel = e.map((v) => Math.log(v + plancher))
    const c = new Float64Array(COEFFICIENTS - 1)
    for (let j = 1; j < COEFFICIENTS; j++) {
      let v = 0
      for (let m = 0; m < FILTRES; m++) v += logMel[m] * Math.cos((Math.PI * j * (m + 0.5)) / FILTRES)
      c[j - 1] = v
    }
    return c
  })
  normaliser(trames)
  return trames
}

/** Centre et réduit chaque coefficient sur toutes les trames. */
function normaliser(trames: Float64Array[]): void {
  if (trames.length === 0) return
  const d = trames[0].length
  for (let j = 0; j < d; j++) {
    let moyenne = 0
    for (const t of trames) moyenne += t[j]
    moyenne /= trames.length
    let variance = 0
    for (const t of trames) variance += (t[j] - moyenne) ** 2
    const ecart = Math.sqrt(variance / trames.length) || 1
    for (const t of trames) t[j] = (t[j] - moyenne) / ecart
  }
}
