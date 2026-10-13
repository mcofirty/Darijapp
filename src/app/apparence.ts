import type { Apparence } from '../db/db'

/** Copie locale du réglage, lue avant le premier affichage pour éviter un flash de couleurs. */
export const CLE_APPARENCE = 'darija-apparence'

const COULEURS_BARRE = { clair: '#f2f2f7', sombre: '#000000' }

/** Couleur achetée au souk, copiée aussi pour être appliquée avant le premier affichage. */
export const CLE_COULEUR = 'darija-couleur'

export function appliquerCouleur(couleur: string): void {
  document.documentElement.dataset.couleur = couleur
  try {
    localStorage.setItem(CLE_COULEUR, couleur)
  } catch {
    // Stockage indisponible : la couleur reste dans IndexedDB.
  }
}

/** Applique l'apparence à la page : attribut data-theme et couleur de la barre d'état. */
export function appliquerApparence(apparence: Apparence): void {
  document.documentElement.dataset.theme = apparence
  const sombre =
    apparence === 'sombre' || (apparence === 'systeme' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sombre ? COULEURS_BARRE.sombre : COULEURS_BARRE.clair)
  try {
    localStorage.setItem(CLE_APPARENCE, apparence)
  } catch {
    // Stockage indisponible (navigation privée) : le réglage reste dans IndexedDB.
  }
}
