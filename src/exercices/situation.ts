/** Ce que la session du jour permet de faire : une situation concrète, mise en avant sur la carte (logique pure). */
import SITUATIONS_JSON from '../data/situations/situations.json'

export interface Situation {
  /** À lire après « Aujourd'hui, » : « commande ton premier thé ». */
  texte: string
}

export const SITUATIONS = SITUATIONS_JSON as Record<string, Situation>

/** Situation de repli : mots ajoutés à la main, thème sans situation. */
export const SITUATION_LIBRE: Situation = { texte: 'parle un peu plus darija' }

/**
 * Situation de la prochaine session : le thème du premier nouveau mot (l'ordre du programme),
 * sinon celui de la première révision ; null quand il n'y a rien à faire (entraînement libre).
 */
export function situationDuPlan(
  plan: { nouveaux: { theme: string }[]; revisions: { theme: string }[] },
  situations: Record<string, Situation> = SITUATIONS,
): Situation | null {
  const mot = plan.nouveaux[0] ?? plan.revisions[0]
  if (!mot) return null
  return situations[mot.theme] ?? SITUATION_LIBRE
}

/** Secondes estimées : un nouveau mot (découverte et exercices) prend plus de temps qu'une révision. */
export const SECONDES_PAR_NOUVEAU = 35
export const SECONDES_PAR_REVISION = 20

/** Durée estimée de la session, en minutes entières (2 au moins). */
export function dureeEstimee(nouveaux: number, revisions: number): number {
  const secondes = nouveaux * SECONDES_PAR_NOUVEAU + revisions * SECONDES_PAR_REVISION
  return Math.max(2, Math.round(secondes / 60))
}
