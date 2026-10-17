import { THEMES } from './themes'
import type { Mot } from './types'
import { normaliser } from './normaliser'
import { motsProches } from './recherche'

export { normaliser }

const fichiers = import.meta.glob<Mot[]>('./*.json', { eager: true, import: 'default' })

/** Tous les mots, dans l'ordre des thèmes puis des fichiers. */
export const MOTS: Mot[] = THEMES.flatMap((t) => fichiers[`./${t.id}.json`] ?? [])

export function motsDuTheme(themeId: string): Mot[] {
  return MOTS.filter((m) => m.theme === themeId)
}

/** Recherche dans le latin, le français et l'arabe. */
export function chercherMots(mots: Mot[], requete: string): Mot[] {
  const q = normaliser(requete)
  if (!q) return mots
  return mots.filter(
    (m) =>
      normaliser(m.latin).includes(q) || normaliser(m.fr).includes(q) || m.arabe.includes(requete.trim()),
  )
}

/** Recherche avec propositions : les mots qui contiennent la recherche, puis ceux qui lui ressemblent. */
export function chercherAvecProches(mots: Mot[], requete: string): { exacts: Mot[]; proches: Mot[] } {
  const exacts = chercherMots(mots, requete)
  if (!normaliser(requete)) return { exacts, proches: [] }
  return { exacts, proches: motsProches(mots, requete, new Set(exacts.map((m) => m.id))) }
}
