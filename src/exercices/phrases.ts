import type { Mot } from '../data/types'
import { melanger, type Aleatoire } from './session'

/** « Construis la phrase » : remettre dans l'ordre les mots d'un exemple (logique pure). */

/** Longueur des phrases utilisées, en mots. */
export const MOTS_MIN = 3
export const MOTS_MAX = 6
/** Mots en trop glissés parmi les morceaux. */
export const INTRUS = 2

/** Les mots d'une phrase en latin, sans la ponctuation (« la, ghir tmenmya? » → la / ghir / tmenmya). */
export function decouper(latin: string): string[] {
  return latin
    .split(/\s+/)
    .map((m) => m.replace(/^[«"'(¿¡]+|[»"'),.;:!?…]+$/g, ''))
    .filter((m) => m.length > 0)
}

/** Une phrase se construit si l'exemple a de 3 à 6 mots. */
export function phraseConstructible(mot: Mot): boolean {
  const n = decouper(mot.exemple.latin).length
  return n >= MOTS_MIN && n <= MOTS_MAX
}

/**
 * Morceaux proposés : les mots de l'exemple et `INTRUS` mots pris dans d'autres exemples
 * (du même thème d'abord), absents de la phrase, le tout mélangé dans un ordre différent de la phrase.
 */
export function morceauxDePhrase(mot: Mot, tous: Mot[], alea: Aleatoire = Math.random): string[] {
  const phrase = decouper(mot.exemple.latin)
  const dans = new Set(phrase)
  const intrus: string[] = []
  const sources = [
    ...melanger(tous.filter((m) => m.theme === mot.theme && m.id !== mot.id), alea),
    ...melanger(tous.filter((m) => m.theme !== mot.theme), alea),
  ]
  for (const autre of sources) {
    if (intrus.length === INTRUS) break
    const candidats = decouper(autre.exemple.latin).filter((m) => m.length > 1 && !dans.has(m) && !intrus.includes(m))
    if (candidats.length > 0) intrus.push(candidats[Math.floor(alea() * candidats.length)])
  }
  const tous_ = [...phrase, ...intrus]
  for (let essai = 0; essai < 10; essai++) {
    const m = melanger(tous_, alea)
    if (m.slice(0, phrase.length).join(' ') !== phrase.join(' ')) return m
  }
  // Mélange qui retombe toujours sur l'ordre de la phrase (phrase de mots identiques) : on décale.
  return [...tous_.slice(1), tous_[0]]
}

/** La réponse est juste si les mots choisis redonnent exactement la phrase. */
export function phraseJuste(reponse: string[], mot: Mot): boolean {
  return reponse.join(' ') === decouper(mot.exemple.latin).join(' ')
}

/** Premier son d'un mot ou d'une phrase, pour l'indice de « Dis-le en darija » (« 3afak » → « 3a… »). */
export function indice(latin: string): string {
  const premier = decouper(latin)[0] ?? ''
  const debut = /^[^aeiouéèê]*[aeiouéèê]+/i.exec(premier)?.[0] ?? premier.slice(0, 2)
  return debut.length < premier.length || decouper(latin).length > 1 ? `${debut}…` : debut
}
