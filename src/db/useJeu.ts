import { useLiveQuery } from 'dexie-react-hooks'
import { BADGES, compterCollection, maitrise, type Badge, type Maitrise } from '../gamification/collection'
import { avancement, quetesDuJour, statsDuJour, type Avancement } from '../gamification/quetes'
import { meilleureSerie, septDerniersJours, type JourSemaine } from '../gamification/serie'
import { dateLocale } from '../srs/dates'
import { db, lireProfil } from './db'
import { lireJournal } from './journal'

export interface Jeu {
  quetes: Avancement[]
  coffreOuvert: boolean
  semaine: JourSemaine[]
  collection: Record<Maitrise, number>
  badges: { badge: Badge; obtenu: boolean }[]
}

const VIDE: Jeu = { quetes: [], coffreOuvert: false, semaine: [], collection: { bronze: 0, argent: 0, or: 0 }, badges: [] }

/** Quêtes du jour, théière, semaine, collection et badges, mis à jour en direct. */
export function useJeu(): Jeu {
  return (
    useLiveQuery(async () => {
      const aujourdhui = dateLocale()
      const [sessions, journal, progressions, profil] = await Promise.all([
        db.sessions.toArray(),
        lireJournal(aujourdhui),
        db.progression.toArray(),
        lireProfil(),
      ])
      const dates = sessions.map((s) => s.date)
      const stats = statsDuJour(
        sessions.filter((s) => s.date === aujourdhui),
        journal.ecoutes,
      )
      const collection = compterCollection(progressions)
      const statsBadges = {
        motsVus: progressions.length,
        motsOr: collection.or,
        meilleureSerie: meilleureSerie(dates),
        activites: sessions.length,
        sansFaute: sessions.filter((s) => s.mauvaises === 0 && s.bonnes > 0).length,
        recordExpress: profil.recordExpress,
        recordSons: profil.recordSons,
      }
      return {
        quetes: quetesDuJour(aujourdhui).map((q) => avancement(q, stats)),
        coffreOuvert: journal.coffre,
        semaine: septDerniersJours(dates, aujourdhui),
        collection,
        badges: BADGES.map((badge) => ({ badge, obtenu: badge.obtenu(statsBadges) })),
      }
    }, []) ?? VIDE
  )
}

/** Niveau de maîtrise de chaque mot vu (bronze, argent, or), par identifiant. */
export function useMaitrises(): Map<string, Maitrise> {
  const progressions = useLiveQuery(() => db.progression.toArray(), [])
  return new Map((progressions ?? []).map((p) => [p.id, maitrise(p.boite)]))
}
