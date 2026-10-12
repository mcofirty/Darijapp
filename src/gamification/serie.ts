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
 */
export function calculerSerie(joursPratiques: Iterable<string>, aujourdhui: string): Serie {
  const pratiques = new Set(joursPratiques)
  const faitAujourdhui = pratiques.has(aujourdhui)
  if (pratiques.size === 0) return { jours: 0, aujourdhui: false }
  const plusAncien = [...pratiques].sort()[0]

  let jours = 0
  let pardon = Number.NEGATIVE_INFINITY
  let k = faitAujourdhui ? 0 : 1
  for (let date = ajouterJours(aujourdhui, -k); date >= plusAncien; k++, date = ajouterJours(aujourdhui, -k)) {
    if (pratiques.has(date)) {
      jours++
    } else if (k - pardon < 7 || !pratiques.has(ajouterJours(date, -1))) {
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
  aujourdhui: boolean
}

const LETTRES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/** Les 7 derniers jours jusqu'à aujourd'hui, pour le calendrier de la série. */
export function septDerniersJours(joursPratiques: Iterable<string>, aujourdhui: string): JourSemaine[] {
  const pratiques = new Set(joursPratiques)
  return Array.from({ length: 7 }, (_, i) => {
    const date = ajouterJours(aujourdhui, i - 6)
    const [a, m, j] = date.split('-').map(Number)
    return { date, lettre: LETTRES[new Date(a, m - 1, j).getDay()], fait: pratiques.has(date), aujourdhui: i === 6 }
  })
}
