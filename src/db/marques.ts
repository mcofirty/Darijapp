import { useLiveQuery } from 'dexie-react-hooks'
import { db, type DarijaDB, type Marque, type MotifSignalement } from './db'

async function modifier(id: string, changement: Partial<Omit<Marque, 'id'>>, base: DarijaDB): Promise<void> {
  const avant = (await base.marques.get(id)) ?? { id, favori: false, signale: null, date: 0 }
  const apres = { ...avant, ...changement, date: Date.now() }
  // Une marque vide ne sert à rien : on la retire.
  if (!apres.favori && !apres.signale) await base.marques.delete(id)
  else await base.marques.put(apres)
}

export function changerFavori(id: string, favori: boolean, base: DarijaDB = db): Promise<void> {
  return modifier(id, { favori }, base)
}

/** `motif` null : le signalement est retiré. */
export function signaler(id: string, motif: MotifSignalement | null, base: DarijaDB = db): Promise<void> {
  return modifier(id, { signale: motif }, base)
}

/** Favoris et signalements de tous les mots, par identifiant, mis à jour en direct. */
export function useMarques(): Map<string, Marque> {
  const marques = useLiveQuery(() => db.marques.toArray(), [])
  return new Map((marques ?? []).map((m) => [m.id, m]))
}
