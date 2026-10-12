import { MOTS } from '../../data'
import { motsDejaVus, planDeSession } from '../../db/apprentissage'
import { composerSession, melanger, type Etape } from '../../exercices/session'

export interface SessionPrete {
  etapes: Etape[]
  nouveaux: number
  entrainement: boolean
}

/** Prépare la prochaine session ; s'il n'y a rien de nouveau ni de dû, propose un entraînement libre. */
export async function preparerSession(): Promise<SessionPrete> {
  const plan = await planDeSession()
  if (plan.nouveaux.length + plan.revisions.length > 0) {
    return {
      etapes: composerSession(plan.nouveaux, plan.revisions, MOTS),
      nouveaux: plan.nouveaux.length,
      entrainement: false,
    }
  }
  const vus = melanger(await motsDejaVus()).slice(0, 8)
  return { etapes: composerSession([], vus, MOTS), nouveaux: 0, entrainement: true }
}
