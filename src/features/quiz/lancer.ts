import { db } from '../../db/db'
import { tousLesMots } from '../../db/motsPerso'
import { PAIRES_SONS } from '../../data/pairesSons'
import { composerQuiz, motsPourQuiz, questionExpress } from '../../exercices/quiz'
import { choisirPaire, questionDistingue, type Etape } from '../../exercices/session'

/** Mots du Quiz express : les mots déjà vus s'il y en a assez, sinon le début du programme. */
const MIN_EXPRESS = 8
const MOTS_EXPRESS = 40

export async function preparerQuiz(): Promise<Etape[]> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  return composerQuiz(motsPourQuiz(progressions, mots, 8), mots, Math.random, PAIRES_SONS, true)
}

/** Générateur de questions du Quiz express, sur les mots les moins sus. */
export async function preparerExpress(): Promise<(precedente: Etape | null) => Etape> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  const n = Math.max(MIN_EXPRESS, Math.min(progressions.length, MOTS_EXPRESS))
  const candidats = motsPourQuiz(progressions, mots, n)
  return (precedente) =>
    questionExpress(candidats, mots, precedente?.type === 'ecoute' || precedente?.type === 'traduis' ? precedente.mot.id : null)
}

/** Générateur de questions de la Chasse aux sons : toutes les paires, sans répéter la précédente. */
export function questionSons(precedente: Etape | null): Etape {
  const derniere = precedente?.type === 'distingue' ? precedente.paire : undefined
  return questionDistingue(choisirPaire(PAIRES_SONS, [], Math.random, derniere))
}
