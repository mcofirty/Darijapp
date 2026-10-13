import { useLiveQuery } from 'dexie-react-hooks'
import { calculerSerie, type Serie } from '../gamification/serie'
import { niveauDepuisXp, type Niveau } from '../gamification/xp'
import { dateLocale } from '../srs/dates'
import { db, lireProfil } from './db'
import { couverts } from './serie'

export interface Resume {
  xpTotal: number
  xpAujourdhui: number
  niveau: Niveau
  serie: Serie
  sessionsAujourdhui: number
  motsVus: Set<string>
}

const VIDE: Resume = {
  xpTotal: 0,
  xpAujourdhui: 0,
  niveau: niveauDepuisXp(0),
  serie: { jours: 0, aujourdhui: false },
  sessionsAujourdhui: 0,
  motsVus: new Set(),
}

/** XP, niveau, série et mots vus, mis à jour en direct. */
export function useResume(): Resume {
  return (
    useLiveQuery(async () => {
      const aujourdhui = dateLocale()
      const [sessions, ids, bonus, profil] = await Promise.all([
        db.sessions.toArray(),
        db.progression.toCollection().primaryKeys(),
        db.bonus.toArray(),
        lireProfil(),
      ])
      // XP des activités et des bonus (théière-coffre, trésors).
      const gains = [...sessions, ...bonus]
      const xpTotal = gains.reduce((t, s) => t + s.xp, 0)
      const duJour = sessions.filter((s) => s.date === aujourdhui)
      return {
        xpTotal,
        xpAujourdhui: gains.filter((g) => g.date === aujourdhui).reduce((t, s) => t + s.xp, 0),
        niveau: niveauDepuisXp(xpTotal),
        serie: calculerSerie(sessions.map((s) => s.date), aujourdhui, couverts(profil)),
        sessionsAujourdhui: duJour.length,
        motsVus: new Set(ids),
      }
    }, []) ?? VIDE
  )
}
