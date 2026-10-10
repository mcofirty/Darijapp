import { useLiveQuery } from 'dexie-react-hooks'
import { PROFIL_DEFAUT, lireProfil, type Profil } from './db'

/** Profil courant, mis à jour en direct ; valeurs par défaut pendant le chargement. */
export function useProfil(): Profil {
  return useLiveQuery(() => lireProfil(), []) ?? PROFIL_DEFAUT
}
