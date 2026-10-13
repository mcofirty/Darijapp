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

/** Une sauvegarde est conseillée tous les 7 jours (rappel dans le bilan). */
export const JOURS_ENTRE_SAUVEGARDES = 7
/** Jamais sauvegardé : le rappel attend quelques activités, pour ne pas gêner le premier jour. */
export const ACTIVITES_AVANT_PREMIERE_SAUVEGARDE = 3

/** Jours écoulés entre deux horodatages, comptés en jours du calendrier local. */
export function joursDepuis(horodatage: number, maintenant: number): number {
  const jour = (t: number) => {
    const d = new Date(t)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  }
  return Math.round((jour(maintenant) - jour(horodatage)) / 86_400_000)
}

/** Faut-il proposer de sauvegarder ? Après 7 jours sans sauvegarde, ou dès 3 activités si on n'a jamais sauvegardé. */
export function sauvegardeConseillee(derniere: number | null, maintenant: number, nbActivites: number): boolean {
  if (derniere === null) return nbActivites >= ACTIVITES_AVANT_PREMIERE_SAUVEGARDE
  return joursDepuis(derniere, maintenant) >= JOURS_ENTRE_SAUVEGARDES
}

/** « Dernière sauvegarde : il y a 3 jours », « aujourd’hui », « hier », ou « jamais ». */
export function ageSauvegarde(derniere: number | null, maintenant: number): string {
  if (derniere === null) return 'Jamais sauvegardée'
  const jours = joursDepuis(derniere, maintenant)
  if (jours <= 0) return 'Dernière sauvegarde aujourd’hui'
  if (jours === 1) return 'Dernière sauvegarde hier'
  return `Dernière sauvegarde il y a ${jours} jours`
}
