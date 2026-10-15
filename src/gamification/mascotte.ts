import phrases from '../data/jeux/mascotte.json'

/**
 * Bellarej (la cigogne, « بلارج ») : la mascotte qui réagit aux réponses, encourage et félicite.
 * Logique pure : son humeur et sa phrase en darija.
 */

export type Humeur = 'bravo' | 'rate' | 'fete' | 'encourage' | 'salut'

export interface PhraseMascotte {
  latin: string
  arabe: string
  fr: string
}

export const PHRASES_MASCOTTE = phrases as Record<Humeur, PhraseMascotte[]>

/** Une phrase de la mascotte pour cette humeur. */
export function phraseMascotte(humeur: Humeur, alea: () => number = Math.random): PhraseMascotte {
  const liste = PHRASES_MASCOTTE[humeur]
  return liste[Math.min(liste.length - 1, Math.floor(alea() * liste.length))]
}

/** Humeur du bilan : fête dès 80 % de réussite, sinon encouragement. */
export function humeurDuBilan(taux: number | undefined): Humeur {
  return taux === undefined || taux >= 0.8 ? 'fete' : 'encourage'
}
