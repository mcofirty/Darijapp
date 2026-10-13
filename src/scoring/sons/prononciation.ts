/**
 * Note de prononciation son par son, à partir des sorties du modèle de reconnaissance des sons (logique pure).
 *
 * Le modèle donne, toutes les 30 ms, une probabilité pour chacun de ses 230 sons (plus le « blanc » du CTC).
 * On regroupe ces sons en classes utiles au darija (ħ, ʕ, q, x, ɣ… et leurs voisins), puis, pour chaque son
 * attendu du mot, on compare la vraisemblance du mot tel qu'il doit être dit à celle du même mot où ce son
 * est remplacé par un autre (ou omis) : c'est la « qualité de prononciation » (GOP) d'un modèle CTC.
 * Un son bien dit l'emporte nettement sur ses remplaçants ; un 7 dit comme un h perd contre la version en h.
 */

/** Une classe de sons : ce qu'on attend, et les sons du modèle qui la réalisent. */
export interface Classe {
  /** Nom (API). */
  nom: string
  /** Graphie de l'appli (7, 3, kh…), pour les messages. */
  latin: string
  /** Sons du modèle regroupés dans la classe. */
  membres: string[]
  voyelle?: boolean
  /** L'un des sons du darija travaillés par l'appli (ع ح ق خ غ). */
  special?: boolean
}

export const CLASSES: Classe[] = [
  { nom: 'a', latin: 'a', membres: ['a', 'æ', 'ɑ', 'ɐ', 'ä', 'aː'], voyelle: true },
  { nom: 'i', latin: 'i', membres: ['i', 'ɪ', 'iː', 'ɨ'], voyelle: true },
  { nom: 'u', latin: 'ou', membres: ['u', 'ʊ', 'o', 'ɔ', 'uː', 'oː'], voyelle: true },
  { nom: 'ə', latin: 'e', membres: ['ə', 'ɘ', 'ɜ', 'ʌ'], voyelle: true },
  { nom: 'e', latin: 'é', membres: ['e', 'ɛ', 'eː'], voyelle: true },
  { nom: 'b', latin: 'b', membres: ['b'] },
  { nom: 'p', latin: 'p', membres: ['p'] },
  { nom: 't', latin: 't', membres: ['t', 'tˤ', 't̪', 'tʰ'] },
  { nom: 'd', latin: 'd', membres: ['d', 'dˤ', 'd̪', 'ðˤ', 'ð'] },
  { nom: 'k', latin: 'k', membres: ['k', 'kʰ'] },
  { nom: 'ɡ', latin: 'g', membres: ['ɡ', 'g'] },
  { nom: 'q', latin: '9', membres: ['q', 'ɢ'], special: true },
  { nom: 'ʔ', latin: 'hamza', membres: ['ʔ'] },
  { nom: 'f', latin: 'f', membres: ['f'] },
  { nom: 'v', latin: 'v', membres: ['v'] },
  { nom: 's', latin: 's', membres: ['s', 'sˤ', 's̪'] },
  { nom: 'z', latin: 'z', membres: ['z', 'zˤ'] },
  { nom: 'ʃ', latin: 'ch', membres: ['ʃ'] },
  { nom: 'ʒ', latin: 'j', membres: ['ʒ', 'd͡ʒ', 'dʒ'] },
  { nom: 'x', latin: 'kh', membres: ['x', 'χ'], special: true },
  { nom: 'ɣ', latin: 'gh', membres: ['ɣ', 'ʁ'], special: true },
  { nom: 'ħ', latin: '7', membres: ['ħ'], special: true },
  { nom: 'ʕ', latin: '3', membres: ['ʕ'], special: true },
  { nom: 'h', latin: 'h', membres: ['h', 'ɦ'] },
  { nom: 'm', latin: 'm', membres: ['m'] },
  { nom: 'n', latin: 'n', membres: ['n'] },
  { nom: 'l', latin: 'l', membres: ['l', 'lˤ', 'ɫ'] },
  { nom: 'r', latin: 'r', membres: ['r', 'ɾ', 'rˤ', 'ʀ'] },
  { nom: 'w', latin: 'w', membres: ['w'] },
  { nom: 'j', latin: 'y', membres: ['j'] },
]

const PAR_NOM = new Map(CLASSES.map((c) => [c.nom, c]))

/** Lettres (et paires de lettres) de la translittération de l'appli, vers les classes. */
const DIGRAMMES: Record<string, string> = { kh: 'x', gh: 'ɣ', ch: 'ʃ', ou: 'u' }
const LETTRES: Record<string, string> = {
  '3': 'ʕ', '7': 'ħ', '9': 'q', '2': 'ʔ',
  a: 'a', â: 'a', à: 'a', e: 'ə', é: 'e', è: 'e', ê: 'e', i: 'i', î: 'i', ï: 'i', o: 'u', ô: 'u', u: 'u', û: 'u', ù: 'u',
  b: 'b', p: 'p', t: 't', d: 'd', k: 'k', g: 'ɡ', q: 'q', f: 'f', v: 'v', s: 's', z: 'z', j: 'ʒ', x: 'x',
  h: 'h', m: 'm', n: 'n', l: 'l', r: 'r', w: 'w', y: 'j', c: 'k', ç: 's',
}

/**
 * Sons attendus d'un mot ou d'une phrase écrits en latin (« 9elb » → q ə l b). Les lettres doublées
 * (gémination, article assimilé) comptent pour un son ; espaces et ponctuation sont ignorés.
 */
export function sonsAttendus(latin: string): string[] {
  const texte = latin.toLowerCase()
  const sons: string[] = []
  for (let i = 0; i < texte.length; ) {
    const paire = texte.slice(i, i + 2)
    const son = DIGRAMMES[paire] ?? LETTRES[texte[i]]
    i += DIGRAMMES[paire] ? 2 : 1
    if (son && sons[sons.length - 1] !== son) sons.push(son)
  }
  return sons
}

/** Sorties du modèle restreintes aux classes : log-probabilités par trame, colonne 0 = blanc. */
export interface Sorties {
  trames: number
  /** Noms des classes présentes dans le modèle, dans l'ordre des colonnes 1… */
  classes: string[]
  /** log p(classe | trame), trame par trame (trames × (classes + 1)). */
  logp: Float64Array
}

const logsomme = (a: number, b: number) => (a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b))))

/**
 * Regroupe les logits du modèle (trames × sons, `sons` = noms des sons dans l'ordre, le 0 étant le blanc)
 * en classes : softmax sur le blanc et les seuls sons des classes, puis somme des probabilités de chaque classe.
 */
export function regrouper(logits: Float32Array, trames: number, sons: string[]): Sorties {
  const P = sons.length
  const indice = new Map(sons.map((s, i) => [s, i]))
  const classes = CLASSES.map((c) => ({ nom: c.nom, ids: c.membres.map((m) => indice.get(m)).filter((i): i is number => i !== undefined) })).filter(
    (c) => c.ids.length > 0,
  )
  const C = classes.length + 1
  const logp = new Float64Array(trames * C)
  for (let t = 0; t < trames; t++) {
    const ligne = logits.subarray(t * P, (t + 1) * P)
    let max = ligne[0]
    for (const c of classes) for (const i of c.ids) max = Math.max(max, ligne[i])
    let total = Math.exp(ligne[0] - max)
    const sommes = classes.map((c) => c.ids.reduce((s, i) => s + Math.exp(ligne[i] - max), 0))
    for (const s of sommes) total += s
    logp[t * C] = ligne[0] - max - Math.log(total)
    sommes.forEach((s, k) => (logp[t * C + k + 1] = Math.log(s / total)))
  }
  return { trames, classes: classes.map((c) => c.nom), logp }
}

/** log P(séquence | sorties) par l'algorithme avant du CTC (séquence d'indices de colonnes, 1…). */
export function vraisemblance(s: Sorties, sequence: number[]): number {
  const C = s.classes.length + 1
  const L = 2 * sequence.length + 1
  // Étiquettes étendues : blanc, son, blanc, son, …, blanc.
  const etiquette = (k: number) => (k % 2 === 0 ? 0 : sequence[(k - 1) / 2])
  let avant = new Float64Array(L).fill(-Infinity)
  avant[0] = s.logp[0]
  if (L > 1) avant[1] = s.logp[etiquette(1)]
  for (let t = 1; t < s.trames; t++) {
    const suivant = new Float64Array(L).fill(-Infinity)
    const base = t * C
    for (let k = 0; k < L; k++) {
      let a = avant[k]
      if (k >= 1) a = logsomme(a, avant[k - 1])
      if (k >= 2 && k % 2 === 1 && etiquette(k) !== etiquette(k - 2)) a = logsomme(a, avant[k - 2])
      if (a !== -Infinity) suivant[k] = a + s.logp[base + etiquette(k)]
    }
    avant = suivant
  }
  return L > 1 ? logsomme(avant[L - 1], avant[L - 2]) : avant[0]
}

/** Évaluation d'un son attendu. */
export interface DetailSon {
  /** Classe attendue. */
  son: string
  latin: string
  /** Probabilité (0 à 1) que ce son ait été dit, plutôt qu'un autre ou rien. */
  probabilite: number
  /** Ce qui l'emporte le plus parmi les remplaçants : graphie d'un autre son, ou null s'il semble omis. */
  confondu: string | null
  special: boolean
  voyelle: boolean
  /**
   * Ce que le modèle croit entendre à cette place : probabilité du son attendu, de chaque remplaçant
   * (par sa graphie) et de l'omission (« ∅ »). Sert à comparer avec la voix de référence.
   */
  repartition: Record<string, number>
}

export interface Evaluation {
  /** Note de 0 à 100. */
  score: number
  details: DetailSon[]
}

/** Poids des sons dans la note : les sons du darija comptent triple, les voyelles (souvent avalées en darija) peu. */
const POIDS_SPECIAL = 3
const POIDS_CONSONNE = 1
const POIDS_VOYELLE = 0.25

/** Évalue la prononciation des sons attendus (noms de classes, voir `sonsAttendus`). */
export function evaluer(s: Sorties, attendus: string[]): Evaluation {
  const colonne = new Map(s.classes.map((c, i) => [c, i + 1]))
  const presents = attendus.filter((a) => colonne.has(a))
  const sequence = presents.map((a) => colonne.get(a)!)
  const reference = vraisemblance(s, sequence)
  const details: DetailSon[] = presents.map((son, i) => {
    let total = reference
    let meilleur = -Infinity
    let confondu: string | null = null
    const vraisemblances: Record<string, number> = { [PAR_NOM.get(son)!.latin]: reference }
    // Le même mot avec ce son remplacé par chacun des autres, ou omis.
    for (let q = 1; q <= s.classes.length; q++) {
      if (q === sequence[i]) continue
      const v = vraisemblance(s, [...sequence.slice(0, i), q, ...sequence.slice(i + 1)])
      const nom = PAR_NOM.get(s.classes[q - 1])!.latin
      vraisemblances[nom] = v
      total = logsomme(total, v)
      if (v > meilleur) {
        meilleur = v
        confondu = nom
      }
    }
    const sans = vraisemblance(s, [...sequence.slice(0, i), ...sequence.slice(i + 1)])
    vraisemblances['∅'] = sans
    total = logsomme(total, sans)
    if (sans > meilleur) confondu = null
    const repartition: Record<string, number> = {}
    for (const [k, v] of Object.entries(vraisemblances)) repartition[k] = Math.exp(v - total)
    const c = PAR_NOM.get(son)!
    return { son, latin: c.latin, probabilite: Math.exp(reference - total), confondu, special: !!c.special, voyelle: !!c.voyelle, repartition }
  })
  let somme = 0
  let poids = 0
  for (const d of details) {
    const w = d.special ? POIDS_SPECIAL : d.voyelle ? POIDS_VOYELLE : POIDS_CONSONNE
    somme += w * d.probabilite
    poids += w
  }
  return { score: poids ? Math.round((100 * somme) / poids) : 0, details }
}

/** Ressemblance (0 à 1) de deux répartitions : coefficient de Bhattacharyya. */
export function ressemblance(a: Record<string, number>, b: Record<string, number>): number {
  let s = 0
  for (const [k, p] of Object.entries(a)) s += Math.sqrt(p * (b[k] ?? 0))
  return Math.min(1, s)
}

/**
 * Barème du score par sons, réglé sur Jamal et 4 autres voix arabes d'Azure (calibrageSons.test.ts) :
 * la moyenne pondérée des ressemblances va de 0 (à 0,55) à 100 (à 0,95).
 */
export const BAREME_SONS = { zero: 0.55, cent: 0.95 }

/** Ressemblance sous laquelle un son est montré comme raté, et un son du darija expliqué. */
export const SEUIL_SON = 0.7

/** Un son du darija (ع ح ق خ غ) mal dit : expliqué après l'essai. */
export const sonRate = (d: DetailSon) => d.special && d.probabilite < SEUIL_SON

/**
 * Compare l'essai à la voix de référence, son par son : pour chaque son attendu, ce que le modèle croit
 * entendre doit être pareil dans les deux voix (ressemblance des répartitions). Un son que le modèle entend
 * mal chez Jamal (souvent ع et ح) n'est donc pas compté faux pour autant ; il l'est si l'essai fait pencher
 * le modèle ailleurs (un h, rien…). Un son nettement reconnu dans l'essai, plus que chez Jamal, compte comme
 * bien dit. Note : moyenne pondérée (sons du darija ×3, voyelles ×0,25), ramenée sur 100 par `BAREME_SONS`.
 */
export function comparer(reference: Evaluation, essai: Evaluation): Evaluation {
  const details = essai.details.map((d, i) => {
    const r = reference.details[i]
    if (!r) return d
    const attendu = Math.min(1, d.probabilite / Math.max(r.probabilite, 0.3))
    return { ...d, probabilite: Math.max(ressemblance(r.repartition, d.repartition), attendu) }
  })
  let somme = 0
  let poids = 0
  for (const d of details) {
    const w = d.special ? POIDS_SPECIAL : d.voyelle ? POIDS_VOYELLE : POIDS_CONSONNE
    somme += w * d.probabilite
    poids += w
  }
  const moyenne = poids ? somme / poids : 0
  const score = Math.round(100 * Math.min(1, Math.max(0, (moyenne - BAREME_SONS.zero) / (BAREME_SONS.cent - BAREME_SONS.zero))))
  return { score, details }
}
