import type { PaireSons } from '../data/pairesSons'
import type { Mot } from '../data/types'
import type { EtatSrs } from '../srs/leitner'
import { choisirPaire, melanger, propositions, questionDistingue, type Aleatoire, type Etape } from './session'

/** Quiz de l'onglet Quiz et Quiz express (logique pure). */

export const QUESTIONS_PAR_QUIZ = 5
export const DUREE_EXPRESS = 60
/** Mots de la question « Associe les paires » d'un quiz. */
const MOTS_PAR_PAIRES = 4

/**
 * Mots à interroger, les moins sus d'abord : boîte la plus basse, puis le plus d'échecs,
 * puis la révision la plus en retard. S'il en manque, on complète avec le programme, dans l'ordre.
 */
export function motsPourQuiz(progressions: EtatSrs[], tous: Mot[], n: number): Mot[] {
  const parId = new Map(tous.map((m) => [m.id, m]))
  const vus = [...progressions]
    .sort((a, b) => a.boite - b.boite || b.echecs - a.echecs || a.prochaineRevision.localeCompare(b.prochaineRevision))
    .map((p) => parId.get(p.id))
    .filter((m): m is Mot => m !== undefined)
  const pris = new Set(vus.map((m) => m.id))
  return [...vus, ...tous.filter((m) => !pris.has(m.id))].slice(0, n)
}

/**
 * 5 questions qui mêlent les exercices : Écoute et choisis, Traduis, Distingue les sons (si des paires
 * de sons sont fournies), Dis-le (si `dire`) et Associe les paires.
 * `candidats` : les mots à interroger, du plus urgent au moins urgent (voir motsPourQuiz).
 */
export function composerQuiz(
  candidats: Mot[],
  tous: Mot[],
  alea: Aleatoire = Math.random,
  pairesSons: PaireSons[] = [],
  dire = false,
): Etape[] {
  const nbDire = dire ? 1 : 0
  const nbSimples = QUESTIONS_PAR_QUIZ - 1 - (pairesSons.length > 0 ? 1 : 0) - nbDire
  const mots = candidats.slice(0, nbSimples + nbDire + MOTS_PAR_PAIRES)
  const simples = melanger(mots.slice(0, nbSimples), alea)
  const aDire = mots.slice(nbSimples, nbSimples + nbDire)
  const pourPaires = mots.slice(nbSimples + nbDire)
  const etapes: Etape[] = simples.map((mot, i) => ({
    type: i % 2 === 0 ? 'ecoute' : 'traduis',
    mot,
    choix: propositions(mot, tous, alea),
  }))
  if (pairesSons.length > 0) {
    etapes.splice(1 + Math.floor(alea() * etapes.length), 0, questionDistingue(choisirPaire(pairesSons, mots, alea), alea))
  }
  for (const mot of aDire) etapes.splice(1 + Math.floor(alea() * etapes.length), 0, { type: 'disle', mot })
  if (pourPaires.length >= 3) {
    // Les paires prennent une place au hasard, jamais en premier.
    const place = 1 + Math.floor(alea() * etapes.length)
    etapes.splice(place, 0, { type: 'paires', mots: pourPaires })
  }
  return etapes
}

/** Une question du Quiz express : un mot au hasard parmi les candidats, en écoute ou en traduction. */
export function questionExpress(candidats: Mot[], tous: Mot[], precedent: string | null, alea: Aleatoire = Math.random): Etape {
  const possibles = candidats.length > 1 ? candidats.filter((m) => m.id !== precedent) : candidats
  const mot = possibles[Math.floor(alea() * possibles.length)]
  return { type: alea() < 0.5 ? 'ecoute' : 'traduis', mot, choix: propositions(mot, tous, alea) }
}

/** À partir de la 5e bonne réponse d'affilée (combo de la Chasse aux sons), chaque bonne réponse vaut 2 points. */
export const COMBO_BONUS = 5

export function pointsDeReponse(combo: number): number {
  return combo >= COMBO_BONUS ? 2 : 1
}

/** Le meilleur score d'un jeu contre la montre, et s'il vient d'être battu. */
export function apresExpress(score: number, record: number): { record: number; nouveauRecord: boolean } {
  return score > record ? { record: score, nouveauRecord: true } : { record, nouveauRecord: false }
}
