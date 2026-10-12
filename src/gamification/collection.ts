/** Collection de mots et badges (logique pure). */

/** Bronze : mot vu ; argent : retenu une semaine (boîte 3) ; or : retenu trois semaines (boîte 4). */
export type Maitrise = 'bronze' | 'argent' | 'or'

export const COULEURS_MAITRISE: Record<Maitrise, string> = { bronze: '#c47f3b', argent: '#9ea3a8', or: '#e0a800' }
export const NOMS_MAITRISE: Record<Maitrise, string> = { bronze: 'bronze', argent: 'argent', or: 'or' }

export function maitrise(boite: number): Maitrise {
  return boite >= 4 ? 'or' : boite === 3 ? 'argent' : 'bronze'
}

export function compterCollection(progressions: { boite: number }[]): Record<Maitrise, number> {
  const total: Record<Maitrise, number> = { bronze: 0, argent: 0, or: 0 }
  for (const p of progressions) total[maitrise(p.boite)]++
  return total
}

/** Objectif du programme : 300 mots en 3 mois. */
export const OBJECTIF_MOTS = 300

export interface StatsBadges {
  motsVus: number
  motsOr: number
  meilleureSerie: number
  activites: number
  sansFaute: number
  recordExpress: number
  recordSons: number
}

export interface Badge {
  id: string
  titre: string
  description: string
  obtenu: (s: StatsBadges) => boolean
}

export const BADGES: Badge[] = [
  { id: 'premiers-pas', titre: 'Premiers pas', description: 'Termine ta première activité', obtenu: (s) => s.activites >= 1 },
  { id: 'sans-faute', titre: 'Sans faute', description: 'Réussis une activité sans erreur', obtenu: (s) => s.sansFaute >= 1 },
  { id: 'mots-50', titre: '50 mots', description: 'Découvre 50 mots', obtenu: (s) => s.motsVus >= 50 },
  { id: 'mots-150', titre: '150 mots', description: 'Découvre 150 mots', obtenu: (s) => s.motsVus >= 150 },
  { id: 'mots-300', titre: 'Objectif 300', description: 'Découvre 300 mots', obtenu: (s) => s.motsVus >= OBJECTIF_MOTS },
  { id: 'or-10', titre: '10 mots en or', description: 'Retiens 10 mots trois semaines', obtenu: (s) => s.motsOr >= 10 },
  { id: 'or-50', titre: '50 mots en or', description: 'Retiens 50 mots trois semaines', obtenu: (s) => s.motsOr >= 50 },
  { id: 'serie-3', titre: '3 jours', description: 'Pratique 3 jours d’affilée', obtenu: (s) => s.meilleureSerie >= 3 },
  { id: 'serie-7', titre: '7 jours', description: 'Pratique 7 jours d’affilée', obtenu: (s) => s.meilleureSerie >= 7 },
  { id: 'serie-30', titre: '30 jours', description: 'Pratique 30 jours d’affilée', obtenu: (s) => s.meilleureSerie >= 30 },
  { id: 'eclair', titre: 'Éclair', description: '15 bonnes réponses au Quiz express', obtenu: (s) => s.recordExpress >= 15 },
  { id: 'oreille', titre: 'Oreille fine', description: '20 points à la Chasse aux sons', obtenu: (s) => s.recordSons >= 20 },
]
