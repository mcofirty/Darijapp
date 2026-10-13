import { NOMS_NIVEAUX, NOMS_PALIERS, PALIERS_PAR_STADE, niveauDepuisXp } from './xp'

/** Croissance de la plante du jardin (logique pure). */

export const STADES = NOMS_NIVEAUX.length
export const PALIERS = NOMS_PALIERS.length

export interface Croissance {
  /** Stade de 1 (Terreau) à 10 (Arbre). */
  stade: number
  /** Nom du stade (« Germe »). */
  nom: string
  /** Niveau, c'est-à-dire palier de 1 à 30 (3 par stade). */
  niveau: number
  /** Palier dans le stade, de 1 à 3. */
  palier: number
  /** Nom du palier (« La crosse »). */
  nomPalier: string
  /** Avancement dans le stade, de 0 à 1 (chaque palier en occupe un tiers) : la plante grandit petit à petit. */
  avancement: number
  /** Avancement dans le palier en cours, de 0 à 1. */
  avancementPalier: number
  /** Palier suivant, ou null une fois l'arbre centenaire atteint. */
  prochain: string | null
  xpRestants: number
}

/** Palier (1 à 3) qui correspond à un avancement dans le stade. */
export function palierDe(avancement: number): number {
  return Math.min(PALIERS_PAR_STADE, Math.floor(Math.max(0, avancement) * PALIERS_PAR_STADE + 1e-9) + 1)
}

export function croissance(xpTotal: number): Croissance {
  const n = niveauDepuisXp(xpTotal)
  const niveau = Math.min(n.niveau, PALIERS)
  const stade = Math.ceil(niveau / PALIERS_PAR_STADE)
  const palier = niveau - (stade - 1) * PALIERS_PAR_STADE
  // Après le dernier palier, l'arbre centenaire a sa pleine taille.
  const adulte = n.niveau > PALIERS
  const dansPalier = adulte ? 1 : n.xp / n.objectif
  return {
    stade,
    nom: NOMS_NIVEAUX[stade - 1],
    niveau,
    palier,
    nomPalier: NOMS_PALIERS[niveau - 1],
    avancement: (palier - 1 + dansPalier) / PALIERS_PAR_STADE,
    avancementPalier: dansPalier,
    prochain: niveau < PALIERS ? NOMS_PALIERS[niveau] : null,
    xpRestants: adulte ? 0 : n.objectif - n.xp,
  }
}

/**
 * Taille de la plante, de 0 (terreau nu) à 1 (arbre adulte) : chaque stade occupe une part égale,
 * et l'avancement du niveau fait grandir la plante vers le stade suivant ; l'arbre atteint
 * sa pleine taille à la fin du dixième niveau.
 */
export function taille({ stade, avancement }: Pick<Croissance, 'stade' | 'avancement'>): number {
  return Math.min(1, (stade - 1 + Math.min(1, Math.max(0, avancement))) / STADES)
}

/** Un morceau de l'animation de croissance : la plante d'un stade et d'un palier, qui passe d'un avancement à un autre. */
export interface EtapeAnimation {
  stade: number
  palier: number
  de: number
  a: number
}

/**
 * Étapes pour animer la plante d'un total d'XP à un autre : elle finit son palier, passe chaque
 * palier intermédiaire en entier, puis pousse dans le nouveau palier jusqu'à l'avancement actuel.
 * Les avancements restent ceux du stade (0 à 1), découpés aux limites des paliers (1/3, 2/3).
 */
export function etapesDeCroissance(xpDepart: number, xpArrivee: number): EtapeAnimation[] {
  if (xpArrivee <= xpDepart) return []
  const d = croissance(xpDepart)
  const f = croissance(xpArrivee)
  const debut = (d.stade - 1) * PALIERS_PAR_STADE + d.avancement * PALIERS_PAR_STADE
  const fin = (f.stade - 1) * PALIERS_PAR_STADE + f.avancement * PALIERS_PAR_STADE
  if (fin <= debut) return []
  const etapes: EtapeAnimation[] = []
  // On avance d'un tiers de stade (un palier) à la fois, sur une échelle continue de 0 à 30.
  for (let k = Math.floor(debut + 1e-9); k < fin - 1e-9; k++) {
    const de = Math.max(debut, k)
    const a = Math.min(fin, k + 1)
    const stade = Math.floor(k / PALIERS_PAR_STADE) + 1
    const base = (stade - 1) * PALIERS_PAR_STADE
    etapes.push({ stade, palier: k - base + 1, de: (de - base) / PALIERS_PAR_STADE, a: (a - base) / PALIERS_PAR_STADE })
  }
  return etapes
}
