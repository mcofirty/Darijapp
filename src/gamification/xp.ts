/** Points d'expérience et niveaux. */

export const XP_PAR_BONNE_REPONSE = 1
export const XP_SESSION_TERMINEE = 10
export const XP_SANS_FAUTE = 5

export function xpDeSession(bonnes: number, sansFaute: boolean): number {
  return bonnes * XP_PAR_BONNE_REPONSE + XP_SESSION_TERMINEE + (sansFaute ? XP_SANS_FAUTE : 0)
}

/** XP à gagner pour finir un niveau : 120 au niveau 1, 140 au niveau 2, puis 20 de plus à chaque niveau. */
export function xpDuNiveau(niveau: number): number {
  return 120 + 20 * (niveau - 1)
}

/** Étapes de la plante ; au-delà, on reste « Arbre » avec un numéro. */
export const NOMS_NIVEAUX = ['Terreau', 'Graine', 'Germe', 'Pousse', 'Tige', 'Feuilles', 'Bouton', 'Fleur', 'Fruit', 'Arbre']

export function nomDuNiveau(niveau: number): string {
  return NOMS_NIVEAUX[Math.min(niveau, NOMS_NIVEAUX.length) - 1]
}

export interface Niveau {
  niveau: number
  nom: string
  /** XP gagnés dans le niveau en cours. */
  xp: number
  /** XP nécessaires pour finir le niveau en cours. */
  objectif: number
}

export function niveauDepuisXp(total: number): Niveau {
  let niveau = 1
  let reste = total
  while (reste >= xpDuNiveau(niveau)) {
    reste -= xpDuNiveau(niveau)
    niveau++
  }
  return { niveau, nom: nomDuNiveau(niveau), xp: reste, objectif: xpDuNiveau(niveau) }
}
