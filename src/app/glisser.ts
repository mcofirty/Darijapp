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
  return 1 + 0.1 * Math.max(0, 1 - Math.abs(distance))
}

/**
 * Sens d'un balayage horizontal de page : 1 = onglet suivant, -1 = précédent, 0 = rien.
 * Le geste doit être net, surtout horizontal et assez rapide.
 */
export function sensDuBalayage(dx: number, dy: number, duree: number): -1 | 0 | 1 {
  if (Math.abs(dx) < 60 || Math.abs(dx) < 1.5 * Math.abs(dy) || duree > 700) return 0
  return dx < 0 ? 1 : -1
}

/**
 * Ce que fait un balayage : vers la droite, le retour d'une page ouverte (sinon l'onglet précédent) ;
 * vers la gauche, l'onglet suivant, mais pas depuis une page ouverte (on n'y perd pas sa place).
 */
export function actionDuBalayage(sens: -1 | 0 | 1, retourDisponible: boolean): 'retour' | 'precedent' | 'suivant' | 'rien' {
  if (sens === 0) return 'rien'
  if (sens === -1) return retourDisponible ? 'retour' : 'precedent'
  return retourDisponible ? 'rien' : 'suivant'
}

/**
 * Début d'un retour glissé : après 10 px de mouvement, le geste est un glissement si c'est surtout
 * horizontal et vers la droite, sinon ce n'est pas pour nous (défilement, balayage vers la gauche).
 */
export function departGlisse(dx: number, dy: number): 'attente' | 'glisse' | 'non' {
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return 'attente'
  return dx > 0 && Math.abs(dx) > 1.5 * Math.abs(dy) ? 'glisse' : 'non'
}

/** Le retour est validé au relâchement : page tirée de plus d'un tiers de l'écran, ou geste vif. */
export function retourValide(dx: number, largeur: number, duree: number): boolean {
  return dx > largeur * 0.35 || (dx > 50 && dx / Math.max(duree, 1) > 0.5)
}

/** Début d'un glissement entre onglets : surtout horizontal, dans un sens ou dans l'autre. */
export function departGlisseOnglet(dx: number, dy: number): 'attente' | 'glisse' | 'non' {
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return 'attente'
  return Math.abs(dx) > 1.5 * Math.abs(dy) ? 'glisse' : 'non'
}

/** Onglet voisin vers lequel on tire (1 = suivant, en tirant vers la gauche), ou null s'il n'y en a pas. */
export function ongletVise(dx: number, index: number, nombre: number): number | null {
  const vers = index + (dx < 0 ? 1 : -1)
  return dx !== 0 && vers >= 0 && vers < nombre ? vers : null
}

/** Décalage de la page sous le doigt : suit le doigt, mais résiste (élastique) au bout des onglets. */
export function decalageOnglet(dx: number, index: number, nombre: number): number {
  return ongletVise(dx, index, nombre) === null ? dx * 0.3 : dx
}

/** Position de la lentille pendant le glissement d'une page d'onglet, bornée aux onglets existants. */
export function lentillePendantGlisse(decalage: number, index: number, largeur: number, nombre: number): number {
  return Math.min(Math.max(index - decalage / largeur, 0), nombre - 1)
}
