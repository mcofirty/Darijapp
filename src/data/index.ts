import { THEMES } from './themes'
import type { Mot } from './types'

const fichiers = import.meta.glob<Mot[]>('./*.json', { eager: true, import: 'default' })

/** Tous les mots, dans l'ordre des thèmes puis des fichiers. */
export const MOTS: Mot[] = THEMES.flatMap((t) => fichiers[`./${t.id}.json`] ?? [])

export function motsDuTheme(themeId: string): Mot[] {
  return MOTS.filter((m) => m.theme === themeId)
}

export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
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
