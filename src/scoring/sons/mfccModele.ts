import { fft } from '../mfcc'

/**
 * MFCC du modèle de reconnaissance des sons (Allosaurus), recopiés de son code Python
 * (`allosaurus/pm/feature.py`, `preprocess.py`, `utils.py`) pour donner au réseau exactement ce qu'il a appris :
 * trames de 25 ms toutes les 10 ms, fenêtre de Povey, préaccentuation 0,97, banc mel (1127 · ln), DCT orthonormée,
 * relèvement de 22, énergie en premier coefficient, normalisation sur la phrase, puis 3 trames voisines
 * collées et une trame sur 3 gardée (pas de 30 ms). Logique pure.
 */

/** Réglages lus dans `pm_config.json` du modèle. */
export interface ReglagesMfcc {
  sample_rate: number
  cep_size: number
  bank_size: number
  low_freq: number
  high_freq: number
  use_energy: boolean
  cmvn: string
  feature_window: number
}

const PREACCENTUATION = 0.97
const RELEVEMENT = 22

const mel = (f: number) => 1127 * Math.log(1 + f / 700)

/** Banc de filtres de `get_filterbanks` (bornes strictes, dernière case exclue, comme en Python). */
function banc(n: number, bas: number, haut: number, frequence: number, TAILLE_FFT: number): Float64Array[] {
  const melBas = mel(bas)
  const pasMel = (mel(haut) - melBas) / (n + 1)
  const filtres: Float64Array[] = []
  for (let j = 0; j < n; j++) {
    const gauche = melBas + j * pasMel
    const centre = melBas + (j + 1) * pasMel
    const droite = melBas + (j + 2) * pasMel
    const f = new Float64Array(TAILLE_FFT / 2 + 1)
    for (let i = 0; i < TAILLE_FFT / 2; i++) {
      const m = mel((i * frequence) / TAILLE_FFT)
      if (m > gauche && m < droite) f[i] = m < centre ? (m - gauche) / (centre - gauche) : (droite - m) / (droite - centre)
    }
    filtres.push(f)
  }
  return filtres
}

/** Fenêtre de Povey (Kaldi) : Hann élevée à la puissance 0,85. */
const povey = (n: number) => Float64Array.from({ length: n }, (_, i) => (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))) ** 0.85)

/**
 * MFCC d'un signal à la fréquence du modèle (`sample_rate`, 8 kHz), à l'échelle d'entiers 16 bits (±32768),
 * comme le lit Allosaurus. Rend une trame toutes les 30 ms, de `3 × cep_size` valeurs.
 */
export function mfccModele(signal: Float32Array, r: ReglagesMfcc): Float32Array[] {
  const TRAME = Math.round(0.025 * r.sample_rate)
  const PAS = Math.round(0.01 * r.sample_rate)
  const TAILLE_FFT = 2 ** Math.ceil(Math.log2(TRAME))
  const POVEY = povey(TRAME)
  const haut = r.high_freq > 0 ? r.high_freq : r.sample_rate / 2 + r.high_freq
  const filtres = banc(r.bank_size, r.low_freq, haut, r.sample_rate, TAILLE_FFT)
  const nTrames = signal.length <= TRAME ? 1 : 1 + Math.floor((signal.length - TRAME) / PAS)
  const re = new Float64Array(TAILLE_FFT)
  const im = new Float64Array(TAILLE_FFT)
  const brut = new Float64Array(TRAME)
  const logBanc = new Float64Array(r.bank_size)
  const trames: Float64Array[] = []
  for (let t = 0; t < nTrames; t++) {
    // Composante continue retirée (en float32 comme le code d'origine), énergie brute, puis préaccentuation.
    let moyenne = 0
    for (let i = 0; i < TRAME; i++) moyenne += Math.fround(signal[t * PAS + i] ?? 0)
    moyenne /= TRAME
    let energie = 0
    for (let i = 0; i < TRAME; i++) {
      brut[i] = Math.fround((signal[t * PAS + i] ?? 0) - moyenne)
      energie += brut[i] * brut[i]
    }
    re.fill(0)
    im.fill(0)
    re[0] = Math.fround((1 - PREACCENTUATION) * brut[0]) * POVEY[0]
    for (let i = 1; i < TRAME; i++) re[i] = Math.fround(brut[i] - PREACCENTUATION * brut[i - 1]) * POVEY[i]
    fft(re, im)
    for (let m = 0; m < r.bank_size; m++) {
      let e = 0
      const f = filtres[m]
      for (let k = 0; k <= TAILLE_FFT / 2; k++) if (f[k]) e += f[k] * (re[k] * re[k] + im[k] * im[k])
      logBanc[m] = Math.log(e === 0 ? Number.EPSILON : e)
    }
    // DCT de type II orthonormée, puis relèvement des coefficients.
    const c = new Float64Array(r.cep_size)
    for (let k = 0; k < r.cep_size; k++) {
      let s = 0
      for (let n = 0; n < r.bank_size; n++) s += logBanc[n] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * r.bank_size))
      c[k] = s * Math.sqrt((k === 0 ? 1 : 2) / r.bank_size) * (1 + (RELEVEMENT / 2) * Math.sin((Math.PI * k) / RELEVEMENT))
    }
    if (r.use_energy) c[0] = Math.log(energie === 0 ? Number.EPSILON : energie)
    trames.push(c.map(Math.fround))
  }

  // Normalisation sur toute la phrase (moyenne 0, écart type 1 par coefficient).
  if (r.cmvn === 'speaker') {
    for (let k = 0; k < r.cep_size; k++) {
      let s = 0
      let s2 = 0
      for (const c of trames) {
        s += c[k]
        s2 += c[k] * c[k]
      }
      const moy = s / trames.length
      const ecart = Math.sqrt(Math.max(s2 / trames.length - moy * moy, 1e-12))
      for (const c of trames) c[k] = (c[k] - moy) / ecart
    }
  }

  if (r.feature_window !== 3) return trames.map((c) => Float32Array.from(c))
  // Trame précédente, trame, trame suivante (en boucle aux bords, comme np.roll), une sur trois.
  const n = trames.length
  const sortie: Float32Array[] = []
  for (let t = 0; t < n; t += 3) {
    const v = new Float32Array(3 * r.cep_size)
    v.set(trames[(t - 1 + n) % n], 0)
    v.set(trames[t], r.cep_size)
    v.set(trames[(t + 1) % n], 2 * r.cep_size)
    sortie.push(v)
  }
  return sortie
}
