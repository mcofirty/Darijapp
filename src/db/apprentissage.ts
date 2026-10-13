import type { Mot } from '../data/types'
import { xpDeSession } from '../gamification/xp'
import { dateLocale } from '../srs/dates'
import { apresReponse, motsAReviser, nouveauxMots } from '../srs/leitner'
import { db, type DarijaDB, type ProgressionMot, type TypeActivite } from './db'
import { tousLesMots } from './motsPerso'

export const NOUVEAUX_PAR_SESSION = 5
export const REVISIONS_MAX = 8

export interface PlanSession {
  nouveaux: Mot[]
  revisions: Mot[]
}

/** Mots de la prochaine session : révisions dues (au plus 8) et 5 mots jamais vus. */
export async function planDeSession(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<PlanSession> {
  const progressions = await base.progression.toArray()
  const mots = await tousLesMots(base)
  const parId = new Map(mots.map((m) => [m.id, m]))
  const revisions = motsAReviser(progressions, aujourdhui)
    .slice(0, REVISIONS_MAX)
    .map((p) => parId.get(p.id))
    .filter((m): m is Mot => m !== undefined)
  const vus = new Set(progressions.map((p) => p.id))
  return { nouveaux: nouveauxMots(mots, vus, NOUVEAUX_PAR_SESSION), revisions }
}

/** Mots déjà vus, pour une session d'entraînement libre quand il n'y a plus rien de nouveau ni de dû. */
export async function motsDejaVus(base: DarijaDB = db): Promise<Mot[]> {
  const ids = await base.progression.toCollection().primaryKeys()
  const parId = new Map((await tousLesMots(base)).map((m) => [m.id, m]))
  return ids.map((id) => parId.get(id)).filter((m): m is Mot => m !== undefined)
}

export interface BilanSession {
  xp: number
  bonnes: number
  mauvaises: number
  nouveaux: number
}

/** Scores de prononciation gardés par mot (les plus récents). */
export const SCORES_GARDES = 20

/**
 * Enregistre une session terminée : met à jour la répétition espacée de chaque mot
 * (sauf en entraînement libre), ajoute les scores de prononciation et la session à l'historique.
 */
export async function enregistrerSession(
  resultats: Map<string, boolean>,
  stats: { bonnes: number; mauvaises: number; nouveaux: number; entrainement: boolean; scores?: Map<string, number[]> },
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
    for (const [id, scores] of stats.scores ?? []) {
      const avant = await base.progression.get(id)
      if (avant) await base.progression.update(id, { scores: [...avant.scores, ...scores].slice(-SCORES_GARDES) })
    }
    await base.sessions.add({ date: aujourdhui, xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: stats.nouveaux, type: 'session' })
  })
  return { xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: stats.nouveaux }
}

/**
 * Enregistre un quiz ou un Quiz express terminé : XP et série comme une session,
 * sans toucher à la répétition espacée (un quiz contrôle, il ne remplace pas les révisions).
 */
export async function enregistrerActivite(
  type: Exclude<TypeActivite, 'session'>,
  stats: { bonnes: number; mauvaises: number },
  aujourdhui = dateLocale(),
  base: DarijaDB = db,
): Promise<BilanSession> {
  const xp = xpDeSession(stats.bonnes, stats.mauvaises === 0 && stats.bonnes > 0)
  await base.sessions.add({ date: aujourdhui, xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: 0, type })
  return { xp, bonnes: stats.bonnes, mauvaises: stats.mauvaises, nouveaux: 0 }
}
