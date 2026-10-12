import { ajouterJours } from './dates'

/** État de répétition espacée d'un mot (sous-ensemble de la progression stockée). */
export interface EtatSrs {
  id: string
  boite: number
  prochaineRevision: string
  reussites: number
  echecs: number
}

/** Délai avant la prochaine révision selon la boîte : raté = lendemain, puis 3, 7 et 21 jours. */
export const DELAIS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 21 }
export const BOITE_MAX = 4

/** Nouvel état d'un mot après une session, réussie ou non. */
export function apresReponse(id: string, etat: EtatSrs | undefined, reussi: boolean, aujourdhui: string): EtatSrs {
  const avant = etat ?? { id, boite: 0, prochaineRevision: aujourdhui, reussites: 0, echecs: 0 }
  const boite = reussi ? Math.min(Math.max(avant.boite + 1, 2), BOITE_MAX) : 1
  return {
    id,
    boite,
    prochaineRevision: ajouterJours(aujourdhui, DELAIS[boite]),
    reussites: avant.reussites + (reussi ? 1 : 0),
    echecs: avant.echecs + (reussi ? 0 : 1),
  }
}

/** Mots dont la révision est due, les plus en retard et les moins sus d'abord. */
export function motsAReviser<T extends EtatSrs>(etats: T[], aujourdhui: string): T[] {
  return etats
    .filter((e) => e.prochaineRevision <= aujourdhui)
    .sort((a, b) => a.prochaineRevision.localeCompare(b.prochaineRevision) || a.boite - b.boite)
}

/** Les n premiers mots jamais vus, dans l'ordre du programme. */
export function nouveauxMots<T extends { id: string }>(tous: T[], dejaVus: Set<string>, n: number): T[] {
  return tous.filter((m) => !dejaVus.has(m.id)).slice(0, n)
}
