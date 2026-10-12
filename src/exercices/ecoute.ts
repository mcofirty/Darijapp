import type { Mot } from '../data/types'

/** Mode écoute mains libres (logique pure) : ce que l'appli lit, mot après mot. */

export type PasEcoute = { type: 'darija'; lent: boolean } | { type: 'francais' } | { type: 'pause'; ms: number }

export interface OptionsEcoute {
  /** Darija lu une seconde fois, plus lentement, pour bien entendre chaque son. */
  repeter: boolean
  /** Traduction lue en français après le darija. */
  francais: boolean
}

/** Pauses : le temps de répéter à voix haute après le darija, puis de retenir la traduction. */
export const PAUSE_REPETITION = 1800
export const PAUSE_ENTRE_DARIJA = 900
export const PAUSE_ENTRE_MOTS = 1500

/** Darija, pause pour le répéter, darija ralenti, pause, puis français, et une pause avant le mot suivant. */
export function programmeDuMot({ repeter, francais }: OptionsEcoute): PasEcoute[] {
  const pas: PasEcoute[] = [{ type: 'darija', lent: false }, { type: 'pause', ms: PAUSE_REPETITION }]
  if (repeter) pas.push({ type: 'darija', lent: true }, { type: 'pause', ms: PAUSE_ENTRE_DARIJA })
  if (francais) pas.push({ type: 'francais' }, { type: 'pause', ms: PAUSE_ENTRE_MOTS })
  return pas
}

/** Durée approximative d'un mot, pour annoncer la durée de l'écoute (darija ≈ 1,2 s, français ≈ 1,5 s). */
export function dureeApproximative(nbMots: number, options: OptionsEcoute): number {
  const parMot = programmeDuMot(options).reduce(
    (t, p) => t + (p.type === 'pause' ? p.ms : p.type === 'francais' ? 1500 : p.lent ? 1600 : 1200),
    0,
  )
  return nbMots * parMot
}

/** « environ 4 min » : durée arrondie à la minute, au moins 1. */
export function dureeEnMinutes(ms: number): string {
  return `environ ${Math.max(1, Math.round(ms / 60000))} min`
}

/** Liste à écouter : les mots vus, les moins sus d'abord ; `limite` en garde les premiers. */
export function motsVusAEcouter(
  progressions: { id: string; boite: number; echecs: number }[],
  tous: Mot[],
  limite = Infinity,
): Mot[] {
  const parId = new Map(tous.map((m) => [m.id, m]))
  return [...progressions]
    .sort((a, b) => a.boite - b.boite || b.echecs - a.echecs)
    .map((p) => parId.get(p.id))
    .filter((m): m is Mot => m !== undefined)
    .slice(0, limite)
}
