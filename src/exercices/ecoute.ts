import type { Mot } from '../data/types'

/** Mode écoute mains libres (logique pure) : ce que l'appli lit, mot après mot. */

export type PasEcoute =
  | { type: 'darija'; lent: boolean }
  | { type: 'francais' }
  | { type: 'pause'; ms: number }
  /** Phrase d'exemple du mot, en darija, puis sa traduction. */
  | { type: 'exemple' }
  | { type: 'exempleFr' }

export interface OptionsEcoute {
  /** Darija lu une seconde fois, plus lentement, pour bien entendre chaque son. */
  repeter: boolean
  /** Traduction lue en français après le darija. */
  francais: boolean
  /** Phrase d'exemple lue deux fois après le mot, avec le temps de la répéter à voix haute. */
  phrases?: boolean
}

/** Pauses : le temps de répéter à voix haute après le darija, puis de retenir la traduction. */
export const PAUSE_REPETITION = 1800
export const PAUSE_ENTRE_DARIJA = 900
export const PAUSE_ENTRE_MOTS = 1500

/**
 * Temps laissé pour répéter une phrase à voix haute : de quoi la redire au rythme de Jamal (environ
 * 80 ms par lettre du latin), plus une marge pour la retrouver.
 */
export function pauseDePhrase(latin: string): number {
  return 1200 + latin.length * 100
}

/**
 * Darija, pause pour le répéter, darija ralenti, pause, puis français, et une pause avant le mot suivant.
 * Avec les phrases (`exemple` : latin de l'exemple du mot, s'il en a un), la phrase vient ensuite deux
 * fois, chacune suivie du temps de la répéter, puis sa traduction si le français est lu.
 */
export function programmeDuMot({ repeter, francais, phrases }: OptionsEcoute, exemple = ''): PasEcoute[] {
  const pas: PasEcoute[] = [{ type: 'darija', lent: false }, { type: 'pause', ms: PAUSE_REPETITION }]
  if (repeter) pas.push({ type: 'darija', lent: true }, { type: 'pause', ms: PAUSE_ENTRE_DARIJA })
  if (francais) pas.push({ type: 'francais' }, { type: 'pause', ms: PAUSE_ENTRE_MOTS })
  if (phrases && exemple.trim()) {
    const repeterPhrase = { type: 'pause', ms: pauseDePhrase(exemple) } as const
    pas.push({ type: 'exemple' }, repeterPhrase, { type: 'exemple' }, repeterPhrase)
    if (francais) pas.push({ type: 'exempleFr' }, { type: 'pause', ms: PAUSE_ENTRE_MOTS })
  }
  return pas
}

/** Durée approximative d'un mot, pour annoncer la durée de l'écoute (darija ≈ 1,2 s, français ≈ 1,5 s). */
export function dureeApproximative(nbMots: number, options: OptionsEcoute): number {
  // Phrase type d'environ 25 lettres pour l'estimation.
  const parMot = programmeDuMot(options, 'x'.repeat(25)).reduce(
    (t, p) =>
      t +
      (p.type === 'pause' ? p.ms : p.type === 'francais' ? 1500 : p.type === 'exemple' ? 2500 : p.type === 'exempleFr' ? 2500 : p.lent ? 1600 : 1200),
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
