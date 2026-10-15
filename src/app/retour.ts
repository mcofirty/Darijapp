/**
 * Pile des boutons « retour » des pages ouvertes (logique pure) : chaque page avec un bouton retour s'y inscrit
 * en s'affichant et s'en retire en se fermant. Le balayage vers la droite appelle le retour de la page du dessus,
 * comme le bouton en haut à gauche.
 */

type Lire = () => (() => void) | undefined

const pile: Lire[] = []

/** Inscrit un retour ; rend la fonction qui le retire. `lire` donne l'action actuelle (elle change à chaque affichage). */
export function enregistrerRetour(lire: Lire): () => void {
  pile.push(lire)
  return () => {
    const i = pile.lastIndexOf(lire)
    if (i >= 0) pile.splice(i, 1)
  }
}

/** Une page ouverte a-t-elle un bouton retour ? */
export function retourDisponible(): boolean {
  return pile.some((lire) => lire() !== undefined)
}

/** Fait le retour de la page du dessus ; faux s'il n'y en a pas. */
export function faireRetour(): boolean {
  for (let i = pile.length - 1; i >= 0; i--) {
    const action = pile[i]()
    if (action) {
      action()
      return true
    }
  }
  return false
}
