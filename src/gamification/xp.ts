/** Points d'expérience et niveaux. */

export const XP_PAR_BONNE_REPONSE = 1
export const XP_SESSION_TERMINEE = 10
export const XP_SANS_FAUTE = 5

export function xpDeSession(bonnes: number, sansFaute: boolean): number {
  return bonnes * XP_PAR_BONNE_REPONSE + XP_SESSION_TERMINEE + (sansFaute ? XP_SANS_FAUTE : 0)
}

/**
 * XP à gagner pour finir un niveau (un palier de la plante) : 60 au niveau 1, puis 10 de plus
 * à chaque niveau. Les premiers paliers arrivent vite (2 sessions), puis s'espacent ; l'arbre
 * centenaire (niveau 30) demande 6 150 XP, de l'ordre des 3 mois du programme.
 */
export function xpDuNiveau(niveau: number): number {
  return 60 + 10 * (niveau - 1)
}

/** Les 10 stades de la plante. */
export const NOMS_NIVEAUX = ['Terreau', 'Graine', 'Germe', 'Pousse', 'Tige', 'Feuilles', 'Bouton', 'Fleur', 'Fruit', 'Arbre']

/** Paliers par stade : chaque stade se découpe en 3 niveaux, chacun avec son changement visible. */
export const PALIERS_PAR_STADE = 3

/** Les 30 paliers (niveaux), 3 par stade ; au-delà, on reste « Arbre centenaire » avec un numéro. */
export const NOMS_PALIERS = [
  'Terre sèche', 'Terre arrosée', 'Terre prête',
  'Graine semée', 'Graine enfouie', 'La graine s’ouvre',
  'Ça perce !', 'La crosse', 'Germe debout',
  'Premières feuilles', 'Petite pousse', 'Pousse et coccinelle',
  'Jeune tige', 'Tige et tuteur', 'Tige solide',
  'Feuillage', 'Rameaux', 'Feuilles et papillon',
  'Premier bouton', 'Boutons', 'Bouton qui s’ouvre',
  'Première fleur', 'Floraison', 'Fleurs et abeille',
  'Fruits verts', 'Fruits qui mûrissent', 'Récolte',
  'Jeune arbre', 'Arbre', 'Arbre centenaire',
]

export function nomDuNiveau(niveau: number): string {
  return NOMS_PALIERS[Math.min(niveau, NOMS_PALIERS.length) - 1]
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
