import { db } from '../../db/db'
import { tousLesMots } from '../../db/motsPerso'
import { composerQuiz, motsPourQuiz } from '../../exercices/quiz'
import type { Etape } from '../../exercices/session'
import type { Mot } from '../../data/types'

/** Mots du Quiz express : les mots déjà vus s'il y en a assez, sinon le début du programme. */
const MIN_EXPRESS = 8
const MOTS_EXPRESS = 40

export async function preparerQuiz(): Promise<Etape[]> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  return composerQuiz(motsPourQuiz(progressions, mots, 8), mots)
}

export async function preparerExpress(): Promise<{ candidats: Mot[]; tous: Mot[] }> {
  const [progressions, mots] = await Promise.all([db.progression.toArray(), tousLesMots()])
  const n = Math.max(MIN_EXPRESS, Math.min(progressions.length, MOTS_EXPRESS))
  return { candidats: motsPourQuiz(progressions, mots, n), tous: mots }
}
