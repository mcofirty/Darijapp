import type { Mot } from '../data/types'
import { decouper } from './phrases'

/**
 * Glossaire pour l'indice au toucher : chaque mot d'un seul tenant du programme (latin en minuscules)
 * et sa traduction ; le premier rencontré l'emporte (les mots ajoutés passent avant le programme).
 * Logique pure.
 */
export function glossaire(mots: Mot[]): Map<string, string> {
  const g = new Map<string, string>()
  for (const m of mots) {
    const cle = m.latin.trim().toLowerCase()
    if (!/\s/.test(cle) && !g.has(cle)) g.set(cle, m.fr)
  }
  return g
}

/** Les mots d'une phrase, chacun avec sa traduction s'il est dans le glossaire. */
export function motsTouchables(latin: string, g: Map<string, string>): { mot: string; fr: string | null }[] {
  return latin
    .split(/\s+/)
    .filter(Boolean)
    .map((brut) => {
      const [nu] = decouper(brut)
      return { mot: brut, fr: nu ? (g.get(nu.toLowerCase()) ?? null) : null }
    })
}
