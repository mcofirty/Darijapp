import type { Mot } from '../data/types'
import { decouper } from './phrases'
import { melanger, type Aleatoire, type Etape } from './session'

/** Phrase à trou : l'exemple d'un mot, le mot retiré, à retrouver (logique pure). */

const minuscule = (s: string) => s.toLowerCase()

/** Le mot est d'un seul tenant et figure une fois, tel quel, dans son exemple (3 à 10 mots). */
export function trouPossible(mot: Mot): boolean {
  if (/\s/.test(mot.latin.trim())) return false
  const morceaux = decouper(mot.exemple?.latin ?? '').map(minuscule)
  return morceaux.length >= 3 && morceaux.length <= 10 && morceaux.filter((m) => m === minuscule(mot.latin)).length === 1
}

/** La phrase avec un trait à la place du mot. */
export function phraseAvecTrou(morceaux: string[], trou: number): string {
  return morceaux.map((m, i) => (i === trou ? '_____' : m)).join(' ')
}

/**
 * Une phrase à trou : à l'écrit, le mot et 3 leurres d'un seul mot, absents de la phrase (du même thème d'abord) ;
 * à l'oral, le mot est à dire.
 */
export function questionTrou(mot: Mot, tous: Mot[], alea: Aleatoire = Math.random, oral = false): Etape {
  const morceaux = decouper(mot.exemple.latin)
  const trou = morceaux.findIndex((m) => minuscule(m) === minuscule(mot.latin))
  const dans = new Set(morceaux.map(minuscule))
  // Leurres d'un seul mot, sans ponctuation (« kidayra? » trahirait la réponse).
  const nu = (m: Mot) => decouper(m.latin)[0] ?? ''
  const simple = (m: Mot) => decouper(m.latin).length === 1 && !dans.has(minuscule(nu(m))) && m.id !== mot.id
  const leurres: string[] = []
  for (const m of [...melanger(tous.filter((m) => m.theme === mot.theme && simple(m)), alea), ...melanger(tous.filter(simple), alea)]) {
    if (leurres.length === 3) break
    if (!leurres.some((l) => minuscule(l) === minuscule(nu(m)))) leurres.push(nu(m))
  }
  return { type: 'trou', mot, morceaux, trou, choix: melanger([morceaux[trou], ...leurres], alea), oral }
}
