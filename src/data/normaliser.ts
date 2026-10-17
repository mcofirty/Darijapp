/** Texte comparable : minuscules, sans accents ni espaces au bord. */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
