import { FORMAT_SAUVEGARDE, TABLES_SAUVEGARDEES, VERSION_SAUVEGARDE, type Sauvegarde } from '../sauvegarde/sauvegarde'
import { db, type DarijaDB } from './db'

/** Copie de toute la progression (les enregistrements de voix, qui ne passent pas en JSON, sont laissés de côté). */
export async function exporter(base: DarijaDB = db): Promise<Sauvegarde> {
  const tables = {} as Sauvegarde['tables']
  for (const t of TABLES_SAUVEGARDEES) {
    const lignes = (await base.table(t).toArray()) as Record<string, unknown>[]
    tables[t] = t === 'progression' ? lignes.map((l) => ({ ...l, audioPerso: null })) : lignes
  }
  return { format: FORMAT_SAUVEGARDE, version: VERSION_SAUVEGARDE, date: new Date().toISOString(), tables }
}

/** Remplace toute la progression par celle de la sauvegarde, en une seule transaction (tout ou rien). */
export async function importer(sauvegarde: Sauvegarde, base: DarijaDB = db): Promise<void> {
  const tables = TABLES_SAUVEGARDEES.map((t) => base.table(t))
  await base.transaction('rw', tables, async () => {
    for (const t of TABLES_SAUVEGARDEES) {
      await base.table(t).clear()
      await base.table(t).bulkPut(sauvegarde.tables[t])
    }
  })
}
