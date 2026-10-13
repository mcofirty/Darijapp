/**
 * Stockage persistant : sans lui, Safari peut effacer IndexedDB (la progression) quand l'iPhone manque
 * de place, ou après 7 jours sans visite dans Safari. Safari l'accorde à l'appli installée sur l'écran
 * d'accueil ; la demande ne montre aucune fenêtre sur iPhone.
 */

/** Demande que les données de l'appli ne soient jamais effacées par le navigateur ; null si impossible. */
export async function demanderStockagePersistant(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}

/** Le navigateur garde-t-il les données de l'appli ? null s'il ne sait pas le dire. */
export async function stockagePersistant(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null
  try {
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}
