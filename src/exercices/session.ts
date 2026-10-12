import type { MotSon, PaireSons } from '../data/pairesSons'
import { sonsDuMot } from '../data/sons'
import type { Mot } from '../data/types'

/** Moteur d'exercices (logique pure) : compose une session et suit ses résultats. */

export type Etape =
  | { type: 'decouverte'; mot: Mot }
  | { type: 'ecoute'; mot: Mot; choix: Mot[] }
  | { type: 'traduis'; mot: Mot; choix: Mot[] }
  | { type: 'paires'; mots: Mot[] }
  /** Distingue les sons : on entend `cible`, on choisit entre les deux mots de la paire. */
  | { type: 'distingue'; paire: PaireSons; cible: MotSon }

export type Aleatoire = () => number

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

/**
 * Compose une session : chaque nouveau mot est présenté puis exercé, puis les nouveaux mots
 * sont associés par paires ; viennent ensuite une question « Distingue les sons » (si des paires
 * de sons sont fournies), les révisions, dans le désordre, et une série de paires.
 */
export function composerSession(
  nouveaux: Mot[],
  revisions: Mot[],
  tous: Mot[],
  alea: Aleatoire = Math.random,
  pairesSons: PaireSons[] = [],
): Etape[] {
  const etapes: Etape[] = []
  nouveaux.forEach((mot, i) => {
    etapes.push({ type: 'decouverte', mot })
    etapes.push(exercice(mot, i, tous, alea))
  })
  if (nouveaux.length >= 3) etapes.push({ type: 'paires', mots: nouveaux.slice(0, 5) })
  if (pairesSons.length > 0 && nouveaux.length + revisions.length > 0) {
    etapes.push(questionDistingue(choisirPaire(pairesSons, [...nouveaux, ...revisions], alea), alea))
  }

  const melange = melanger(revisions, alea)
  melange.forEach((mot, i) => etapes.push(exercice(mot, i + 1, tous, alea)))
  if (melange.length >= 3) etapes.push({ type: 'paires', mots: melange.slice(0, 5) })
  return etapes
}

/** Une étape ratée revient en fin de session, avec des propositions remélangées. */
export function etapeARefaire(etape: Etape, tous: Mot[], alea: Aleatoire = Math.random): Etape | null {
  if (etape.type === 'ecoute' || etape.type === 'traduis') {
    return { ...etape, choix: propositions(etape.mot, tous, alea) }
  }
  if (etape.type === 'distingue') return questionDistingue(etape.paire, alea)
  return null
}

/** Résultat par mot : un mot est réussi s'il n'a eu aucune erreur pendant la session. */
export class Resultats {
  private erreurs = new Set<string>()
  private vus = new Set<string>()
  bonnes = 0
  mauvaises = 0

  noter(motId: string, juste: boolean): void {
    this.vus.add(motId)
    this.compter(juste)
    if (!juste) this.erreurs.add(motId)
  }

  /** Réponse qui ne concerne aucun mot du programme (Distingue les sons) : compte seulement. */
  compter(juste: boolean): void {
    if (juste) this.bonnes++
    else this.mauvaises++
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
