import type { MotSon, PaireSons } from '../data/pairesSons'
import { sonsDuMot } from '../data/sons'
import type { Mot } from '../data/types'
import { morceauxDePhrase, phraseConstructible } from './phrases'
import { questionTrou, trouPossible } from './trou'

/** Moteur d'exercices (logique pure) : compose une session et suit ses résultats. */

export type Etape =
  | { type: 'decouverte'; mot: Mot }
  | { type: 'ecoute'; mot: Mot; choix: Mot[] }
  | { type: 'traduis'; mot: Mot; choix: Mot[] }
  | { type: 'paires'; mots: Mot[] }
  /** Distingue les sons : on entend `cible`, on choisit entre les deux mots de la paire. */
  | { type: 'distingue'; paire: PaireSons; cible: MotSon }
  /**
   * Dis-le : on prononce le mot, le score compare à la voix de référence. `inverse` : « Dis-le en
   * darija », seul le français est montré (mot déjà bien connu).
   */
  | { type: 'disle'; mot: Mot; inverse?: boolean; phrase?: boolean }
  /** Construis la phrase : on remet dans l'ordre les mots de l'exemple du mot (avec des intrus). */
  | { type: 'phrase'; mot: Mot; morceaux: string[] }
  /** Phrase à trou : l'exemple du mot sans le mot, à choisir parmi 4 (écrit) ou à dire (oral). */
  | { type: 'trou'; mot: Mot; morceaux: string[]; trou: number; choix: string[]; oral: boolean }

export type Aleatoire = () => number

/** Mots à prononcer (Dis-le) par session. */
export const DIRE_PAR_SESSION = 2

export function melanger<T>(liste: T[], alea: Aleatoire = Math.random): T[] {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

/** 4 propositions dont la bonne ; les leurres viennent de préférence du même thème. */
export function propositions(mot: Mot, tous: Mot[], alea: Aleatoire = Math.random): Mot[] {
  const valides = tous.filter((m) => m.id !== mot.id && m.fr !== mot.fr && m.latin !== mot.latin)
  const memeTheme = melanger(valides.filter((m) => m.theme === mot.theme), alea)
  const autres = melanger(valides.filter((m) => m.theme !== mot.theme), alea)
  const leurres: Mot[] = []
  for (const m of [...memeTheme, ...autres]) {
    if (leurres.length === 3) break
    if (!leurres.some((l) => l.fr === m.fr || l.latin === m.latin)) leurres.push(m)
  }
  return melanger([mot, ...leurres], alea)
}

function exercice(mot: Mot, i: number, tous: Mot[], alea: Aleatoire): Etape {
  const type = i % 2 === 0 ? 'ecoute' : 'traduis'
  return { type, mot, choix: propositions(mot, tous, alea) }
}

/** Une question « Distingue les sons » : un des deux mots de la paire, au hasard. */
export function questionDistingue(paire: PaireSons, alea: Aleatoire = Math.random): Etape {
  return { type: 'distingue', paire, cible: alea() < 0.5 ? paire.a : paire.b }
}

/**
 * Paire à faire entendre, de préférence sur un son présent dans les mots donnés (ceux de la session),
 * en évitant la paire précédente quand c'est possible.
 */
export function choisirPaire(paires: PaireSons[], mots: Mot[], alea: Aleatoire = Math.random, precedente?: PaireSons): PaireSons {
  const sons = new Set(mots.flatMap((m) => sonsDuMot(m.latin).map((s) => s.latin)))
  const autres = paires.length > 1 ? paires.filter((p) => p !== precedente) : paires
  const utiles = autres.filter((p) => p.sons.some((s) => sons.has(s)))
  const choix = utiles.length > 0 ? utiles : autres
  return choix[Math.floor(alea() * choix.length)]
}

export interface OptionsSession {
  /** Ajoute une question « Construis la phrase » (sur une révision, sinon un nouveau mot). */
  phrase?: boolean
  /** Mots bien connus (boîte 2 ou plus) : une révision parmi eux est à dire depuis le français. */
  connus?: Set<string>
  /**
   * Le premier nouveau mot est à redire de mémoire depuis le français en fin de session (« Dis-le en
   * darija ») : le retrouver quelques minutes après l'avoir appris l'ancre mieux que de le relire.
   */
  rappel?: boolean
  /** Ajoute une phrase à trou (sur une révision, sinon un nouveau mot), une fois sur deux à l'oral. */
  trou?: boolean
}

/** Une question « Construis la phrase » sur l'exemple du mot. */
export function questionPhrase(mot: Mot, tous: Mot[], alea: Aleatoire = Math.random): Etape {
  return { type: 'phrase', mot, morceaux: morceauxDePhrase(mot, tous, alea) }
}

/**
 * Compose une session : chaque nouveau mot est présenté puis exercé, puis les nouveaux mots
 * sont associés par paires et les `nbDire` premiers sont à prononcer (Dis-le) ; viennent ensuite
 * une question « Distingue les sons » (si des paires de sons sont fournies), les révisions,
 * dans le désordre, une phrase à construire et un « Dis-le en darija » sur une révision connue et sur
 * le premier nouveau mot (selon les options), et une série de paires. Sans nouveau mot, on prononce
 * des révisions.
 */
export function composerSession(
  nouveaux: Mot[],
  revisions: Mot[],
  tous: Mot[],
  alea: Aleatoire = Math.random,
  pairesSons: PaireSons[] = [],
  nbDire = 0,
  options: OptionsSession = {},
): Etape[] {
  const etapes: Etape[] = []
  nouveaux.forEach((mot, i) => {
    etapes.push({ type: 'decouverte', mot })
    etapes.push(exercice(mot, i, tous, alea))
  })
  if (nouveaux.length >= 3) etapes.push({ type: 'paires', mots: nouveaux.slice(0, 5) })
  nouveaux.slice(0, nbDire).forEach((mot) => etapes.push({ type: 'disle', mot }))
  if (pairesSons.length > 0 && nouveaux.length + revisions.length > 0) {
    etapes.push(questionDistingue(choisirPaire(pairesSons, [...nouveaux, ...revisions], alea), alea))
  }

  const melange = melanger(revisions, alea)
  melange.forEach((mot, i) => etapes.push(exercice(mot, i + 1, tous, alea)))
  const dits = nouveaux.length === 0 ? melange.slice(0, nbDire) : []
  dits.forEach((mot) => etapes.push({ type: 'disle', mot }))
  if (options.phrase) {
    const pourPhrase = melange.find(phraseConstructible) ?? nouveaux.find(phraseConstructible)
    if (pourPhrase) etapes.push(questionPhrase(pourPhrase, tous, alea))
  }
  if (options.trou) {
    const pourTrou = melange.find((m) => trouPossible(m) && !etapes.some((e) => e.type === 'phrase' && e.mot === m)) ?? nouveaux.find(trouPossible)
    if (pourTrou) etapes.push(questionTrou(pourTrou, tous, alea, alea() < 0.5))
  }
  const inverse = melange.find((m) => options.connus?.has(m.id) && !dits.includes(m))
  if (inverse) etapes.push({ type: 'disle', mot: inverse, inverse: true })
  if (options.rappel && nouveaux.length > 0) etapes.push({ type: 'disle', mot: nouveaux[0], inverse: true })
  if (melange.length >= 3) etapes.push({ type: 'paires', mots: melange.slice(0, 5) })
  return etapes
}

/** Une étape ratée revient en fin de session, avec des propositions remélangées. */
export function etapeARefaire(etape: Etape, tous: Mot[], alea: Aleatoire = Math.random): Etape | null {
  if (etape.type === 'ecoute' || etape.type === 'traduis') {
    return { ...etape, choix: propositions(etape.mot, tous, alea) }
  }
  if (etape.type === 'distingue') return questionDistingue(etape.paire, alea)
  if (etape.type === 'phrase') return questionPhrase(etape.mot, tous, alea)
  if (etape.type === 'trou' && !etape.oral) return questionTrou(etape.mot, tous, alea)
  return null
}

/** Résultat par mot : un mot est réussi s'il n'a eu aucune erreur pendant la session. */
export class Resultats {
  private erreurs = new Set<string>()
  private vus = new Set<string>()
  /** Scores de prononciation (Dis-le) par mot. */
  readonly scores = new Map<string, number[]>()
  bonnes = 0
  mauvaises = 0

  noter(motId: string, juste: boolean): void {
    this.vus.add(motId)
    this.compter(juste)
    if (!juste) this.erreurs.add(motId)
  }

  noterScore(motId: string, score: number): void {
    this.scores.set(motId, [...(this.scores.get(motId) ?? []), score])
  }

  /** Réponse qui ne concerne aucun mot du programme (Distingue les sons) : compte seulement. */
  compter(juste: boolean): void {
    if (juste) this.bonnes++
    else this.mauvaises++
  }

  /**
   * Expressions retrouvées : mots déjà connus avant la session (ni découverts aujourd'hui) répondus sans
   * aucune erreur. C'est un acquis vérifié par une révision, pas une première bonne réponse.
   */
  retrouvees(nouveaux: Set<string>): number {
    return [...this.vus].filter((id) => !nouveaux.has(id) && !this.erreurs.has(id)).length
  }

  parMot(): Map<string, boolean> {
    return new Map([...this.vus].map((id) => [id, !this.erreurs.has(id)]))
  }

  get sansFaute(): boolean {
    return this.mauvaises === 0
  }

  get taux(): number {
    const total = this.bonnes + this.mauvaises
    return total === 0 ? 1 : this.bonnes / total
  }
}
