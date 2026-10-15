import donnees from '../data/parler/histoires.json'
import { melanger } from './session'

/** Histoires courtes (logique pure) : on lit et on écoute un récit, coupé de questions de compréhension. */

export interface LigneHistoire {
  id: string
  /** Qui parle : « Narrateur » ou le nom du personnage. */
  qui: string
  /** Illustration de la ligne (emoji). */
  image: string
  latin: string
  arabe: string
  fr: string
  audio: string
}

export interface QuestionHistoire {
  /** Index de la ligne après laquelle la question est posée. */
  apres: number
  question: string
  /** 4 réponses en français, la bonne à l'index `bonne`. */
  choix: string[]
  bonne: number
}

export interface Histoire {
  id: string
  titre: string
  resume: string
  illustration: string
  couleur: string
  lignes: LigneHistoire[]
  questions: QuestionHistoire[]
}

export const HISTOIRES = donnees.histoires as Histoire[]
export const NARRATEUR = 'Narrateur'

export type Morceau = { type: 'ligne'; index: number } | { type: 'question'; question: QuestionHistoire }

/** L'histoire dans l'ordre de lecture : chaque question vient juste après sa ligne. */
export function deroule(histoire: Histoire): Morceau[] {
  return histoire.lignes.flatMap((_, index): Morceau[] => [
    { type: 'ligne', index },
    ...histoire.questions.filter((q) => q.apres === index).map((question) => ({ type: 'question' as const, question })),
  ])
}

/** Les réponses d'une question dans un ordre tiré au hasard, avec la place de la bonne. */
export function reponsesMelangees(question: QuestionHistoire, alea: () => number = Math.random): { choix: string[]; bonne: number } {
  const choix = melanger(question.choix, alea)
  return { choix, bonne: choix.indexOf(question.choix[question.bonne]) }
}
