import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { modesActifs, prochaineFinDePause, type Modes } from '../exercices/modes'
import { PROFIL_DEFAUT, lireProfil, type Profil } from './db'

/** Profil courant, mis à jour en direct ; valeurs par défaut pendant le chargement. */
export function useProfil(): Profil {
  return useLiveQuery(() => lireProfil(), []) ?? PROFIL_DEFAUT
}

/**
 * Modes en vigueur (sans parler, sans écouter), null tant que le profil n'est pas lu.
 * À la fin d'une pause de 15 min, le composant est redessiné avec les modes rendus.
 */
export function useModes(): Modes | null {
  const profil = useLiveQuery(() => lireProfil(), [])
  const [, redessiner] = useState(0)
  const maintenant = Date.now()
  const fin = profil ? prochaineFinDePause(profil, maintenant) : null
  useEffect(() => {
    if (fin === null) return
    const id = window.setTimeout(() => redessiner((n) => n + 1), fin - Date.now() + 50)
    return () => window.clearTimeout(id)
  }, [fin])
  return profil ? modesActifs(profil, maintenant) : null
}
