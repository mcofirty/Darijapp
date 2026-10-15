import { ajouterJours } from '../srs/dates'

export interface Serie {
  /** Nombre de jours pratiqués dans la série en cours. */
  jours: number
  /** Une session a été faite aujourd'hui : la série est « sécurisée ». */
  aujourdhui: boolean
}

/**
 * Série de jours pratiqués. Aujourd'hui non pratiqué ne casse rien (la journée n'est pas finie).
 * Une journée manquée est pardonnée si aucune autre ne l'a été dans les 7 jours qui suivent ;
 * deux jours manqués d'affilée, ou deux en moins d'une semaine, cassent la série.
 * Les jours `couverts` (gel de série, série réparée) ne cassent rien et ne comptent pas.
 */
export function calculerSerie(joursPratiques: Iterable<string>, aujourdhui: string, couverts: Iterable<string> = []): Serie {
  const pratiques = new Set(joursPratiques)
  const gele = new Set(couverts)
  const faitAujourdhui = pratiques.has(aujourdhui)
  if (pratiques.size === 0) return { jours: 0, aujourdhui: false }
  const plusAncien = [...pratiques].sort()[0]

  let jours = 0
  let pardon = Number.NEGATIVE_INFINITY
  let k = faitAujourdhui ? 0 : 1
  for (let date = ajouterJours(aujourdhui, -k); date >= plusAncien; k++, date = ajouterJours(aujourdhui, -k)) {
    if (pratiques.has(date)) {
      jours++
    } else if (gele.has(date)) {
      continue
    } else if (k - pardon < 7 || !(pratiques.has(ajouterJours(date, -1)) || gele.has(ajouterJours(date, -1)))) {
      break
    } else {
      pardon = k
    }
  }
  return { jours, aujourdhui: faitAujourdhui }
}

/** Plus longue suite de jours consécutifs pratiqués (pour les badges : un record ne se perd pas). */
export function meilleureSerie(joursPratiques: Iterable<string>): number {
  const pratiques = new Set(joursPratiques)
  let meilleure = 0
  for (const jour of pratiques) {
    if (pratiques.has(ajouterJours(jour, -1))) continue
    let n = 1
    while (pratiques.has(ajouterJours(jour, n))) n++
    meilleure = Math.max(meilleure, n)
  }
  return meilleure
}

export interface JourSemaine {
  date: string
  /** Initiale du jour : L, M, M, J, V, S, D. */
  lettre: string
  fait: boolean
  /** Jour manqué couvert par un gel ou une réparation. */
  gele: boolean
  aujourdhui: boolean
}

const LETTRES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/** Les 7 derniers jours jusqu'à aujourd'hui, pour le calendrier de la série. */
export function septDerniersJours(joursPratiques: Iterable<string>, aujourdhui: string, couverts: Iterable<string> = []): JourSemaine[] {
  const pratiques = new Set(joursPratiques)
  const geles = new Set(couverts)
  return Array.from({ length: 7 }, (_, i) => {
    const date = ajouterJours(aujourdhui, i - 6)
    const [a, m, j] = date.split('-').map(Number)
    return { date, lettre: LETTRES[new Date(a, m - 1, j).getDay()], fait: pratiques.has(date), gele: geles.has(date), aujourdhui: i === 6 }
  })
}

/** Gel de série (souk) : prix, et nombre qu'on peut avoir d'avance. Réparation d'une série cassée : prix. */
export const PRIX_GEL = 100
export const GELS_MAX = 2
export const PRIX_REPARATION = 150
/** Une série se répare si l'oubli date d'hier (2 jours au plus). */
export const REPARATION_JOURS_MAX = 2

/** Jours manqués juste avant aujourd'hui (le plus récent d'abord), jusqu'au dernier jour pratiqué ou couvert. */
export function trouManque(joursPratiques: Iterable<string>, aujourdhui: string, couverts: Iterable<string> = []): string[] {
  const pratiques = new Set(joursPratiques)
  const gele = new Set(couverts)
  if (pratiques.size === 0) return []
  const plusAncien = [...pratiques].sort()[0]
  const trou: string[] = []
  for (let date = ajouterJours(aujourdhui, -1); date > plusAncien; date = ajouterJours(date, -1)) {
    if (pratiques.has(date) || gele.has(date)) return trou
    trou.push(date)
  }
  return []
}

/** Série qu'on aurait si les jours du trou étaient couverts. */
function serieSiCouverts(pratiques: string[], aujourdhui: string, couverts: string[], trou: string[]): number {
  return calculerSerie(pratiques, aujourdhui, [...couverts, ...trou]).jours
}

/**
 * Gels à utiliser maintenant : les jours manqués juste avant aujourd'hui, si la série en dépend
 * (le pardon automatique ne suffit pas) et qu'il y a assez de gels d'avance. Sinon, aucun.
 */
export function joursAGeler(joursPratiques: Iterable<string>, aujourdhui: string, couverts: Iterable<string>, stock: number): string[] {
  const pratiques = [...joursPratiques]
  const deja = [...couverts]
  const trou = trouManque(pratiques, aujourdhui, deja)
  if (trou.length === 0 || trou.length > stock) return []
  const avant = calculerSerie(pratiques, aujourdhui, deja).jours
  return serieSiCouverts(pratiques, aujourdhui, deja, trou) > avant ? trou : []
}

/** Série cassée par un oubli récent qu'on peut réparer : les jours à couvrir et la série retrouvée. */
export function reparationPossible(
  joursPratiques: Iterable<string>,
  aujourdhui: string,
  couverts: Iterable<string>,
): { jours: string[]; serie: number } | null {
  const pratiques = [...joursPratiques]
  const deja = [...couverts]
  const trou = trouManque(pratiques, aujourdhui, deja)
  if (trou.length === 0 || trou.length > REPARATION_JOURS_MAX) return null
  const avant = calculerSerie(pratiques, aujourdhui, deja).jours
  const apres = serieSiCouverts(pratiques, aujourdhui, deja, trou)
  return apres > avant ? { jours: trou, serie: apres } : null
}

/** Allure de la flamme de série : elle grandit avec la série (seuils de 3, 7, 30 et 100 jours). */
export type PalierFlamme = 'eteinte' | 'braise' | 'flamme' | 'brasier' | 'soleil' | 'legende'

export const SEUILS_FLAMME: { palier: PalierFlamme; jours: number; nom: string }[] = [
  { palier: 'braise', jours: 1, nom: 'Braise' },
  { palier: 'flamme', jours: 3, nom: 'Flamme' },
  { palier: 'brasier', jours: 7, nom: 'Brasier' },
  { palier: 'soleil', jours: 30, nom: 'Soleil' },
  { palier: 'legende', jours: 100, nom: 'Flamme légendaire' },
]

export function palierFlamme(jours: number): PalierFlamme {
  let palier: PalierFlamme = 'eteinte'
  for (const s of SEUILS_FLAMME) if (jours >= s.jours) palier = s.palier
  return palier
}

/**
 * Palier de flamme atteint par la première activité du jour, à fêter dans le bilan (sauf la braise
 * du tout premier jour) ; null sinon.
 */
export function nouveauPalierFlamme(jours: number, premiereDuJour: boolean): (typeof SEUILS_FLAMME)[number] | null {
  if (!premiereDuJour) return null
  const s = SEUILS_FLAMME.find((x) => x.jours === jours)
  return s && s.jours > 1 ? s : null
}
