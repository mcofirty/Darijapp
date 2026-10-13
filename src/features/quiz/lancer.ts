import { db } from '../../db/db'
import { tousLesMots } from '../../db/motsPerso'
import { PAIRES_SONS } from '../../data/pairesSons'
import { adapterEtapes, type Modes } from '../../exercices/modes'
import { composerQuiz, motsPourQuiz, questionExpress } from '../../exercices/quiz'
import { choisirPaire, questionDistingue, type Etape } from '../../exercices/session'

/** Mots du Quiz express : les mots déjà vus s'il y en a assez, sinon le début du programme. */
const MIN_EXPRESS = 8
const MOTS_EXPRESS = 40

/** Sans parler ni écouter, les Dis-le et Distingue les sons laissent leur place à des Traduis : toujours 5 questions. */
export async function preparerQuiz(modes: Modes): Promise<Etape[]> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  const etapes = composerQuiz(motsPourQuiz(progressions, mots, 8), mots, Math.random, modes.ecouter ? PAIRES_SONS : [], modes.parler)
  return adapterEtapes(etapes, modes)
}

/** Générateur de questions du Quiz express, sur les mots les moins sus ; sans écouter, que des Traduis. */
export async function preparerExpress(modes: Modes): Promise<(precedente: Etape | null) => Etape> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  const n = Math.max(MIN_EXPRESS, Math.min(progressions.length, MOTS_EXPRESS))
  const candidats = motsPourQuiz(progressions, mots, n)
  return (precedente) => {
    const q = questionExpress(candidats, mots, precedente?.type === 'ecoute' || precedente?.type === 'traduis' ? precedente.mot.id : null)
    return adapterEtapes([q], modes)[0]
  }
}

/** Générateur de questions de la Chasse aux sons : toutes les paires, sans répéter la précédente. */
export function questionSons(precedente: Etape | null): Etape {
  const derniere = precedente?.type === 'distingue' ? precedente.paire : undefined
  return questionDistingue(choisirPaire(PAIRES_SONS, [], Math.random, derniere))
}
