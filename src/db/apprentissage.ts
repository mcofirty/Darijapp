import { MOTS } from '../data'
import type { Mot } from '../data/types'
import { xpDeSession } from '../gamification/xp'
import { dateLocale } from '../srs/dates'
import { apresReponse, motsAReviser, nouveauxMots } from '../srs/leitner'
import { db, type DarijaDB, type ProgressionMot } from './db'

export const NOUVEAUX_PAR_SESSION = 5
export const REVISIONS_MAX = 8

const parId = new Map(MOTS.map((m) => [m.id, m]))

export interface PlanSession {
  nouveaux: Mot[]
  revisions: Mot[]
}

/** Mots de la prochaine session : révisions dues (au plus 8) et 5 mots jamais vus. */
export async function planDeSession(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<PlanSession> {
  const progressions = await base.progression.toArray()
  const revisions = motsAReviser(progressions, aujourdhui)
    .slice(0, REVISIONS_MAX)
    .map((p) => parId.get(p.id))
    .filter((m): m is Mot => m !== undefined)
  const vus = new Set(progressions.map((p) => p.id))
  return { nouveaux: nouveauxMots(MOTS, vus, NOUVEAUX_PAR_SESSION), revisions }
}

/** Mots déjà vus, pour une session d'entraînement libre quand il n'y a plus rien de nouveau ni de dû. */
export async function motsDejaVus(base: DarijaDB = db): Promise<Mot[]> {
  const ids = await base.progression.toCollection().primaryKeys()
  return ids.map((id) => parId.get(id)).filter((m): m is Mot => m !== undefined)
}

export interface BilanSession {
  xp: number
  bonnes: number
  mauvaises: number
  nouveaux: number
}

/**
 * Enregistre une session terminée : met à jour la répétition espacée de chaque mot
 * (sauf en entraînement libre) et ajoute la session à l'historique.
 */
export async function enregistrerSession(
  resultats: Map<string, boolean>,
  stats: { bonnes: number; mauvaises: number; nouveaux: number; entrainement: boolean },
  aujourdhui = dateLocale(),
  base: DarijaDB = db,
): Promise<BilanSession> {
  const xp = xpDeSession(stats.bonnes, stats.mauvaises === 0)
  await base.transaction('rw', base.progression, base.sessions, async () => {
    if (!stats.entrainement) {
      for (const [id, reussi] of resultats) {
        const avant = await base.progression.get(id)
        const srs = apresReponse(id, avant, reussi, aujourdhui)
        const progression: ProgressionMot = {
          scores: [],
          favori: false,
          signale: false,
          audioPerso: null,
          ...avant,
          ...srs,
        }
        await base.progression.put(progression)
      }
    }
    await base.sessions.add({ date: aujourdhui, xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: stats.nouveaux })
  })
  return { xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: stats.nouveaux }
}
