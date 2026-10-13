/** Format du fichier de sauvegarde de la progression (logique pure). */

export const FORMAT_SAUVEGARDE = 'darijaapp-sauvegarde'
export const VERSION_SAUVEGARDE = 1

/** Tables copiées dans le fichier : toute la progression, rien d'autre. */
export const TABLES_SAUVEGARDEES = ['progression', 'profil', 'motsPerso', 'sessions', 'marques', 'journal', 'bonus', 'achats'] as const
export type TableSauvegardee = (typeof TABLES_SAUVEGARDEES)[number]

export interface Sauvegarde {
  format: typeof FORMAT_SAUVEGARDE
  version: number
  /** Horodatage ISO de l'export. */
  date: string
  tables: Record<TableSauvegardee, Record<string, unknown>[]>
}

/** Nom de fichier lisible : « darijaapp-2026-10-13.json ». */
export function nomDuFichier(date: string): string {
  return `darijaapp-${date}.json`
}

/** Vérifie un fichier importé ; renvoie la sauvegarde, ou un message d'erreur à afficher. */
export function lireSauvegarde(texte: string): Sauvegarde | string {
  let json: unknown
  try {
    json = JSON.parse(texte)
  } catch {
    return 'Ce fichier n’est pas une sauvegarde Darijaapp.'
  }
  const s = json as Partial<Sauvegarde>
  if (!s || typeof s !== 'object' || s.format !== FORMAT_SAUVEGARDE) return 'Ce fichier n’est pas une sauvegarde Darijaapp.'
  if (typeof s.version !== 'number' || s.version > VERSION_SAUVEGARDE)
    return 'Cette sauvegarde vient d’une version plus récente de l’appli : mets l’appli à jour.'
  if (!s.tables || typeof s.tables !== 'object') return 'Sauvegarde incomplète.'
  for (const t of TABLES_SAUVEGARDEES) {
    const lignes = (s.tables as Record<string, unknown>)[t]
    if (lignes !== undefined && !Array.isArray(lignes)) return `Sauvegarde abîmée (table ${t}).`
  }
  // Les tables absentes (sauvegarde ancienne) deviennent vides.
  const tables = Object.fromEntries(
    TABLES_SAUVEGARDEES.map((t) => [t, ((s.tables as Record<string, unknown>)[t] as Record<string, unknown>[] | undefined) ?? []]),
  ) as Sauvegarde['tables']
  return { format: FORMAT_SAUVEGARDE, version: s.version, date: String(s.date ?? ''), tables }
}

/** Résumé montré avant de remplacer la progression : « 120 mots vus, 34 activités ». */
export function resumeSauvegarde(s: Sauvegarde): string {
  const mots = s.tables.progression.length
  const activites = s.tables.sessions.length
  return `${mots} mot${mots > 1 ? 's' : ''} vu${mots > 1 ? 's' : ''}, ${activites} activité${activites > 1 ? 's' : ''}`
}
