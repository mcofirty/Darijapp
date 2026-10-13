import { dtw } from './dtw'
import { PAUSE_MOT, mfcc, niveauMax, rogner } from './mfcc'

/**
 * Score de prononciation (logique pure) : compare l'essai à la voix de référence (MP3 de Jamal)
 * par MFCC et DTW, et le traduit en note sur 100.
 */

/** Étirements de fréquence essayés sur l'essai (voix plus grave ou plus aiguë que la référence). */
const ETIREMENTS = [0.82, 0.88, 0.94, 1, 1.06, 1.12, 1.18]

/**
 * Distance → score, par segments. Réglé sur les MP3 de Jamal (voir calibrage.test.ts) :
 * le même mot ralenti, plus aigu ou plus grave reste sous 1,05 (et sous 1,2 enregistré par le
 * micro de Chrome) ; deux mots d'une paire (9elb / kelb) restent au-dessus de 1,9 ; deux mots
 * quelconques sont vers 2,7.
 */
const BAREME: [distance: number, score: number][] = [
  [0.8, 100],
  [1.3, 80],
  [1.85, 60],
  [2.9, 0],
]

/** Distance typique d'un mot bien dit par une autre voix, après réglage sur la voix de l'utilisateur. */
export const DISTANCE_DE_REGLAGE = 1
/** Décalage maximal du réglage : au-delà, le score ne distinguerait plus rien. */
const DECALAGE_MAX = 1.6
/** En dessous de ce niveau (dB), l'enregistrement est considéré muet. */
const NIVEAU_MIN = -50
/** Moins de 0,15 s de son : rien de dit. */
const TRAMES_MIN = 30

export function scoreDeDistance(distance: number, decalage = 0): number {
  const d = distance - decalage
  if (d <= BAREME[0][0]) return 100
  for (let i = 1; i < BAREME.length; i++) {
    const [d1, s1] = BAREME[i]
    if (d <= d1) {
      const [d0, s0] = BAREME[i - 1]
      return Math.round(s0 + ((d - d0) / (d1 - d0)) * (s1 - s0))
    }
  }
  return 0
}

export interface Appreciation {
  libelle: 'Excellent' | 'Presque' | 'À retravailler'
  etoiles: 1 | 2 | 3
  reussi: boolean
}

/** 80 et plus : Excellent (3 étoiles) ; 60 à 79 : Presque (2) ; moins de 60 : À retravailler (1). */
export function appreciation(score: number): Appreciation {
  if (score >= 80) return { libelle: 'Excellent', etoiles: 3, reussi: true }
  if (score >= 60) return { libelle: 'Presque', etoiles: 2, reussi: true }
  return { libelle: 'À retravailler', etoiles: 1, reussi: false }
}

/** Empreinte d'un enregistrement de référence, calculée une fois par mot. */
export type Empreinte = Float64Array[]

/** `pause` : PAUSE_PHRASE pour une phrase, dont les mots sont séparés par de courts silences. */
export function empreinte(signal16k: Float32Array, pause = PAUSE_MOT): Empreinte {
  return mfcc(rogner(signal16k, undefined, pause))
}

/**
 * Distance entre la référence et l'essai (signaux à 16 kHz), la plus petite sur les étirements
 * de fréquence ; `null` si l'essai est muet ou trop court.
 */
export function distanceEssai(reference: Empreinte, essai16k: Float32Array, pause = PAUSE_MOT): number | null {
  if (niveauMax(essai16k) < NIVEAU_MIN) return null
  const utile = rogner(essai16k, undefined, pause)
  let meilleure = Infinity
  for (const e of ETIREMENTS) {
    const trames = mfcc(utile, e)
    if (trames.length < TRAMES_MIN) return null
    meilleure = Math.min(meilleure, dtw(reference, trames).moyenne)
  }
  return meilleure
}

/**
 * Décalage propre à la voix de l'utilisateur, d'après les distances de mots qu'il a bien dits
 * (réglage du Profil, corrections « Le score se trompe ») : la médiane ramenée à DISTANCE_DE_REGLAGE.
 */
export function decalageVoix(distances: number[]): number {
  if (distances.length === 0) return 0
  const tries = [...distances].sort((a, b) => a - b)
  const milieu = tries.length >> 1
  const mediane = tries.length % 2 ? tries[milieu] : (tries[milieu - 1] + tries[milieu]) / 2
  return Math.min(DECALAGE_MAX, Math.max(0, mediane - DISTANCE_DE_REGLAGE))
}

/** Nombre de distances gardées pour le réglage : les plus récentes. */
export const REGLAGES_GARDES = 12

export function ajouterReglage(distances: number[], nouvelles: number[]): number[] {
  return [...distances, ...nouvelles].slice(-REGLAGES_GARDES)
}
