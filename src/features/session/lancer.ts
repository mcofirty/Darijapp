import { PAIRES_SONS } from '../../data/pairesSons'
import { motsConnus, motsDejaVus, planDeSession } from '../../db/apprentissage'
import { tousLesMots } from '../../db/motsPerso'
import { DIRE_PAR_SESSION, composerSession, melanger, type Etape } from '../../exercices/session'

export interface SessionPrete {
  etapes: Etape[]
  nouveaux: number
  entrainement: boolean
}

/** Prépare la prochaine session ; s'il n'y a rien de nouveau ni de dû, propose un entraînement libre. */
export async function preparerSession(): Promise<SessionPrete> {
  const plan = await planDeSession()
  const MOTS = await tousLesMots()
  const options = { phrase: true, connus: await motsConnus() }
  if (plan.nouveaux.length + plan.revisions.length > 0) {
    return {
      etapes: composerSession(plan.nouveaux, plan.revisions, MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION, options),
      nouveaux: plan.nouveaux.length,
      entrainement: false,
    }
  }
  const vus = melanger(await motsDejaVus()).slice(0, 8)
  return { etapes: composerSession([], vus, MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION, options), nouveaux: 0, entrainement: true }
}
