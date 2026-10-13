import { SONS } from '../data/sons'
import { ajouterJours } from '../srs/dates'

/** Bilan de la semaine passée, montré le lundi (logique pure). */

/** Lundi de la semaine d'une date « AAAA-MM-JJ ». */
export function lundiDe(date: string): string {
  const [a, m, j] = date.split('-').map(Number)
  const jour = new Date(a, m - 1, j).getDay()
  return ajouterJours(date, -((jour + 6) % 7))
}

export interface BilanSemaine {
  /** Lundi de la semaine résumée. */
  lundi: string
  xp: number
  activites: number
  nouveaux: number
  joursActifs: number
  /** Jour qui a rapporté le plus d'XP. */
  meilleurJour: { date: string; xp: number } | null
  /** Sons du darija les plus présents dans les mots ratés (boîte 1), 2 au plus. */
  sons: string[]
}

/** Résumé de la semaine qui précède celle d'`aujourdhui`, ou null si elle est vide. */
export function bilanDeLaSemaine(
  sessions: { date: string; xp: number; nouveaux: number }[],
  bonus: { date: string; xp: number }[],
  rates: { latin: string }[],
  aujourdhui: string,
): BilanSemaine | null {
  const lundi = ajouterJours(lundiDe(aujourdhui), -7)
  const fin = ajouterJours(lundi, 7)
  const dedans = <T extends { date: string }>(l: T[]) => l.filter((x) => x.date >= lundi && x.date < fin)
  const s = dedans(sessions)
  if (s.length === 0) return null
  const parJour = new Map<string, number>()
  for (const x of [...s, ...dedans(bonus)]) parJour.set(x.date, (parJour.get(x.date) ?? 0) + x.xp)
  const meilleur = [...parJour].sort((a, b) => b[1] - a[1])[0]
  const compte = new Map<string, number>()
  for (const r of rates) for (const son of SONS) if (r.latin.includes(son.latin)) compte.set(son.latin, (compte.get(son.latin) ?? 0) + 1)
  return {
    lundi,
    xp: [...parJour.values()].reduce((t, x) => t + x, 0),
    activites: s.length,
    nouveaux: s.reduce((t, x) => t + x.nouveaux, 0),
    joursActifs: new Set(s.map((x) => x.date)).size,
    meilleurJour: meilleur ? { date: meilleur[0], xp: meilleur[1] } : null,
    sons: [...compte].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([l]) => l),
  }
}
