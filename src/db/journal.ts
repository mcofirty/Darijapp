import { XP_COFFRE } from '../gamification/quetes'
import { dateLocale } from '../srs/dates'
import { db, type DarijaDB, type Journal } from './db'

const vide = (date: string): Journal => ({ date, ecoutes: 0, coffre: false })

/** Un mot de plus entendu en mode écoute aujourd'hui. */
export async function noterEcoute(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<void> {
  await base.transaction('rw', base.journal, async () => {
    const j = (await base.journal.get(aujourdhui)) ?? vide(aujourdhui)
    await base.journal.put({ ...j, ecoutes: j.ecoutes + 1 })
  })
}

export async function lireJournal(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<Journal> {
  return (await base.journal.get(aujourdhui)) ?? vide(aujourdhui)
}

/**
 * Ouvre la théière-coffre du jour : +60 XP, une seule fois par jour.
 * Renvoie les XP gagnés (0 si elle était déjà ouverte).
 */
export async function ouvrirCoffre(aujourdhui = dateLocale(), base: DarijaDB = db): Promise<number> {
  return base.transaction('rw', base.journal, base.bonus, async () => {
    const j = (await base.journal.get(aujourdhui)) ?? vide(aujourdhui)
    if (j.coffre) return 0
    await base.journal.put({ ...j, coffre: true })
    await base.bonus.add({ date: aujourdhui, xp: XP_COFFRE, raison: 'coffre' })
    return XP_COFFRE
  })
}
