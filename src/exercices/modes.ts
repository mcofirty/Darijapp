import type { Etape } from './session'

/** Modes de jeu (logique pure) : sans parler, sans écouter, réglés dans Profil ou coupés un moment. */

export interface Modes {
  /** Exercices de prononciation : Dis-le et Dis-le en darija. */
  parler: boolean
  /** Exercices d'écoute : Écoute et choisis, Distingue les sons, jeux à l'oreille, lecture automatique. */
  ecouter: boolean
}

export const TOUS_LES_MODES: Modes = { parler: true, ecouter: true }

/** Durée d'un « Je ne peux pas parler / écouter maintenant ». */
export const MINUTES_DE_PAUSE = 15

export interface ReglageModes {
  parler: boolean
  ecouter: boolean
  pauseParler: number | null
  pauseEcouter: number | null
}

const enPause = (fin: number | null, maintenant: number) => fin !== null && fin > maintenant

/** Les modes en vigueur : le réglage du Profil, sauf pendant une pause de 15 min. */
export function modesActifs(reglage: ReglageModes, maintenant: number): Modes {
  return {
    parler: reglage.parler && !enPause(reglage.pauseParler, maintenant),
    ecouter: reglage.ecouter && !enPause(reglage.pauseEcouter, maintenant),
  }
}

/** Fin de la pause la plus proche encore en cours (pour revenir aux exercices à l'heure), ou null. */
export function prochaineFinDePause(reglage: ReglageModes, maintenant: number): number | null {
  const fins = [reglage.pauseParler, reglage.pauseEcouter].filter((f): f is number => enPause(f, maintenant))
  return fins.length > 0 ? Math.min(...fins) : null
}

/** Fin d'une pause qui commence maintenant. */
export function finDePause(maintenant: number): number {
  return maintenant + MINUTES_DE_PAUSE * 60_000
}

/**
 * Adapte des étapes aux modes : sans parler, les Dis-le sont retirés ; sans écouter, « Écoute et
 * choisis » devient « Traduis » (mêmes propositions) et « Distingue les sons » est retiré.
 * « Construis la phrase » reste : la traduction affichée suffit.
 */
export function adapterEtapes(etapes: Etape[], modes: Modes): Etape[] {
  return etapes.flatMap((e): Etape[] => {
    if (e.type === 'disle' && !modes.parler) return []
    if (e.type === 'trou' && e.oral && !modes.parler) return [{ ...e, oral: false }]
    if (e.type === 'distingue' && !modes.ecouter) return []
    if (e.type === 'ecoute' && !modes.ecouter) return [{ ...e, type: 'traduis' }]
    return [e]
  })
}
