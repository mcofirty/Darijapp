import { useLiveQuery } from 'dexie-react-hooks'
import { GELS_MAX, PRIX_GEL, PRIX_REPARATION, joursAGeler, reparationPossible } from '../gamification/serie'
import { dateLocale } from '../srs/dates'
import { db, lireProfil, modifierProfil, type DarijaDB, type Profil } from './db'
import { lirePorteMonnaie } from './souk'

/**
 * Gel de série et réparation. Les gels s'achètent au souk (table `achats`, ids `gel-…`) ; un gel est utilisé
 * tout seul quand des jours manqués casseraient la série (`joursGeles` du profil). Une série cassée par un
 * oubli récent se répare au prix fort (achat `reparation-…`, jours dans `joursRepares`).
 */

/** Jours couverts (gelés ou réparés) : ils ne cassent pas la série. */
export const couverts = (p: Pick<Profil, 'joursGeles' | 'joursRepares'>) => [...p.joursGeles, ...p.joursRepares]

/** Gels achetés pas encore utilisés. */
export async function stockGels(base: DarijaDB = db): Promise<number> {
  const [achats, profil] = await Promise.all([base.achats.toArray(), lireProfil(base)])
  return achats.filter((a) => a.id.startsWith('gel-')).length - profil.joursGeles.length
}

/** Utilise les gels nécessaires pour sauver la série (à l'ouverture de l'appli). */
export async function appliquerGels(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<string[]> {
  const [sessions, profil, stock] = await Promise.all([base.sessions.toArray(), lireProfil(base), stockGels(base)])
  const jours = joursAGeler(
    sessions.map((s) => s.date),
    aujourdhui,
    couverts(profil),
    stock,
  )
  if (jours.length) await modifierProfil({ joursGeles: [...profil.joursGeles, ...jours] }, base)
  return jours
}

/** Achète un gel ; renvoie un message d'erreur si c'est impossible. */
export async function acheterGel(base: DarijaDB = db): Promise<string | null> {
  if ((await stockGels(base)) >= GELS_MAX) return `Tu as déjà ${GELS_MAX} gels d’avance.`
  const { solde } = await lirePorteMonnaie(base)
  if (solde < PRIX_GEL) return `Il te manque ${PRIX_GEL - solde} DH.`
  await base.achats.add({ id: `gel-${Date.now()}`, date: dateLocale(), prix: PRIX_GEL })
  return null
}

/** Répare la série cassée par un oubli récent ; renvoie un message d'erreur si c'est impossible. */
export async function reparerSerie(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<string | null> {
  const [sessions, profil, { solde }] = await Promise.all([base.sessions.toArray(), lireProfil(base), lirePorteMonnaie(base)])
  const r = reparationPossible(
    sessions.map((s) => s.date),
    aujourdhui,
    couverts(profil),
  )
  if (!r) return 'Il n’y a pas de série à réparer.'
  if (solde < PRIX_REPARATION) return `Il te manque ${PRIX_REPARATION - solde} DH.`
  await base.achats.add({ id: `reparation-${Date.now()}`, date: aujourdhui, prix: PRIX_REPARATION })
  await modifierProfil({ joursRepares: [...profil.joursRepares, ...r.jours] }, base)
  return null
}

export interface EtatSerie {
  gels: number
  /** Série cassée qu'on peut réparer aujourd'hui, avec la série retrouvée. */
  reparation: { jours: string[]; serie: number } | null
}

export function useEtatSerie(): EtatSerie {
  return (
    useLiveQuery(async () => {
      const [sessions, profil, gels] = await Promise.all([db.sessions.toArray(), lireProfil(), stockGels()])
      return {
        gels,
        reparation: reparationPossible(
          sessions.map((s) => s.date),
          dateLocale(),
          couverts(profil),
        ),
      }
    }, []) ?? { gels: 0, reparation: null }
  )
}
