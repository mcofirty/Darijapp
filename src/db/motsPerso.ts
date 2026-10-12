import { useLiveQuery } from 'dexie-react-hooks'
import { MOTS } from '../data'
import { assemblerMots, motValide, type ChampsMot } from '../data/motsPerso'
import type { Mot } from '../data/types'
import { db, type DarijaDB, type MotPerso } from './db'

function nettoyer({ latin, arabe, fr }: ChampsMot): ChampsMot {
  return { latin: latin.trim().replace(/\s+/g, ' '), arabe: arabe.trim().replace(/\s+/g, ' '), fr: fr.trim() }
}

export async function lireMotsPerso(base: DarijaDB = db): Promise<MotPerso[]> {
  return (await base.motsPerso.orderBy('creeLe').toArray()).reverse()
}

export async function ajouterMot(champs: ChampsMot, base: DarijaDB = db): Promise<MotPerso> {
  if (!motValide(champs)) throw new Error('Mot invalide')
  const mot: MotPerso = { id: `perso-${crypto.randomUUID()}`, ...nettoyer(champs), creeLe: Date.now() }
  await base.motsPerso.add(mot)
  return mot
}

/** Ajoute un mot reçu par lien, sauf s'il est déjà dans « Mes mots » (même latin et même arabe). */
export async function ajouterSiAbsent(champs: ChampsMot, base: DarijaDB = db): Promise<{ mot: MotPerso; nouveau: boolean }> {
  const net = nettoyer(champs)
  const existant = (await base.motsPerso.toArray()).find((m) => m.latin.toLowerCase() === net.latin.toLowerCase() && m.arabe === net.arabe)
  if (existant) return { mot: existant, nouveau: false }
  return { mot: await ajouterMot(champs, base), nouveau: true }
}

export async function modifierMot(id: string, champs: ChampsMot, base: DarijaDB = db): Promise<void> {
  if (!motValide(champs)) throw new Error('Mot invalide')
  await base.motsPerso.update(id, nettoyer(champs))
}

/** Supprime le mot et sa progression (répétition espacée). */
export async function supprimerMot(id: string, base: DarijaDB = db): Promise<void> {
  await base.transaction('rw', base.motsPerso, base.progression, async () => {
    await base.motsPerso.delete(id)
    await base.progression.delete(id)
  })
}

/** Tous les mots utilisables dans les sessions : les mots ajoutés, puis ceux du programme. */
export async function tousLesMots(base: DarijaDB = db): Promise<Mot[]> {
  return assemblerMots(await base.motsPerso.toArray(), MOTS)
}

/** Idem, en direct pour les écrans (programme seul pendant le chargement). */
export function useMots(): Mot[] {
  return useLiveQuery(() => tousLesMots(), []) ?? MOTS
}
