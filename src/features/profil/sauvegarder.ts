import { donnerFichier } from '../../app/fichiers'
import { modifierProfil } from '../../db/db'
import { exporter } from '../../db/sauvegarde'
import { nomDuFichier } from '../../sauvegarde/sauvegarde'
import { dateLocale } from '../../srs/dates'

/** Exporte la progression (feuille de partage : Enregistrer dans Fichiers) et note la date pour le rappel. */
export async function sauvegarderProgression(): Promise<boolean> {
  const sauvegarde = await exporter()
  const donne = await donnerFichier(nomDuFichier(dateLocale()), 'application/json', JSON.stringify(sauvegarde))
  if (donne) await modifierProfil({ derniereSauvegarde: Date.now() })
  return donne
}
