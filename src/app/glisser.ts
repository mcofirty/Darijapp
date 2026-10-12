/** Logique pure de la barre d'onglets et du balayage de page (sans React). */

/** Position continue (0 = premier onglet) sous le doigt, bornée aux onglets existants. */
export function positionSousLeDoigt(x: number, gauche: number, largeur: number, nombre: number): number {
  const largeurOnglet = largeur / nombre
  const position = (x - gauche) / largeurOnglet - 0.5
  return Math.min(Math.max(position, 0), nombre - 1)
}

/** Onglet le plus proche d'une position continue. */
export function ongletLePlusProche(position: number, nombre: number): number {
  return Math.min(Math.max(Math.round(position), 0), nombre - 1)
}

/** Étirement horizontal de la lentille selon la vitesse (onglets par milliseconde). */
export function etirement(vitesse: number): number {
  return 1 + Math.min(Math.abs(vitesse) * 40, 0.35)
}

/** Grossissement d'une icône selon sa distance à la lentille. */
export function grossissement(distance: number): number {
  return 1 + 0.15 * Math.max(0, 1 - Math.abs(distance))
}

/**
 * Sens d'un balayage horizontal de page : 1 = onglet suivant, -1 = précédent, 0 = rien.
 * Le geste doit être net, surtout horizontal et assez rapide.
 */
export function sensDuBalayage(dx: number, dy: number, duree: number): -1 | 0 | 1 {
  if (Math.abs(dx) < 60 || Math.abs(dx) < 1.5 * Math.abs(dy) || duree > 700) return 0
  return dx < 0 ? 1 : -1
}
