import { NOMS_NIVEAUX, niveauDepuisXp } from './xp'

/** Croissance de la plante du jardin (logique pure). */

export const STADES = NOMS_NIVEAUX.length

export interface Croissance {
  /** Stade de 1 (Terreau) à 10 (Arbre). */
  stade: number
  nom: string
  /** Avancement dans le niveau en cours, de 0 à 1 : la plante grandit petit à petit, pas seulement d'un coup. */
  avancement: number
  /** Stade suivant, ou null une fois l'arbre atteint. */
  prochain: string | null
  xpRestants: number
}

export function croissance(xpTotal: number): Croissance {
  const n = niveauDepuisXp(xpTotal)
  const stade = Math.min(n.niveau, STADES)
  // Après le dernier niveau de la plante, l'arbre a sa pleine taille.
  const adulte = n.niveau > STADES
  return {
    stade,
    nom: NOMS_NIVEAUX[stade - 1],
    avancement: adulte ? 1 : n.xp / n.objectif,
    prochain: stade < STADES ? NOMS_NIVEAUX[stade] : null,
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

/** Un morceau de l'animation de croissance : la plante d'un stade, qui passe d'un avancement à un autre. */
export interface EtapeAnimation {
  stade: number
  de: number
  a: number
}

/**
 * Étapes pour animer la plante d'un total d'XP à un autre : elle finit son stade, passe chaque
 * stade intermédiaire en entier, puis pousse dans le nouveau stade jusqu'à l'avancement actuel.
 */
export function etapesDeCroissance(xpDepart: number, xpArrivee: number): EtapeAnimation[] {
  if (xpArrivee <= xpDepart) return []
  const d = croissance(xpDepart)
  const f = croissance(xpArrivee)
  if (f.stade === d.stade) return f.avancement > d.avancement ? [{ stade: d.stade, de: d.avancement, a: f.avancement }] : []
  const etapes: EtapeAnimation[] = []
  if (d.avancement < 1) etapes.push({ stade: d.stade, de: d.avancement, a: 1 })
  for (let s = d.stade + 1; s < f.stade; s++) etapes.push({ stade: s, de: 0, a: 1 })
  etapes.push({ stade: f.stade, de: 0, a: f.avancement })
  return etapes
}
