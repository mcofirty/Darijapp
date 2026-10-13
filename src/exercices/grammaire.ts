import donnees from '../data/parler/grammaire.json'
import type { Mot } from '../data/types'
import { TOUS_LES_MODES, type Modes } from './modes'
import { phraseConstructible } from './phrases'
import { melanger, propositions, questionPhrase, type Aleatoire, type Etape } from './session'

/** Mini-leçons de grammaire orale (logique pure) : une fiche, puis 5 questions sur ses formes. */

export interface FormeGrammaire {
  id: string
  latin: string
  arabe: string
  fr: string
  audio: string
}

export interface LeconGrammaire {
  id: string
  titre: string
  sousTitre: string
  /** La règle, en quelques phrases courtes. */
  regle: string[]
  formes: FormeGrammaire[]
}

export const LECONS_GRAMMAIRE = donnees.lecons as LeconGrammaire[]

export const QUESTIONS_PAR_LECON = 5

/**
 * Une forme devient un mot (thème propre à la leçon, pour que les leurres en viennent ; elle est son
 * propre exemple, pour « Construis la phrase »). Ces mots restent hors de la répétition espacée.
 */
export function formeEnMot(forme: FormeGrammaire, lecon: LeconGrammaire): Mot {
  return {
    id: forme.id,
    latin: forme.latin,
    arabe: forme.arabe,
    fr: forme.fr,
    theme: `grammaire-${lecon.id}`,
    niveau: 1,
    prononciation: '',
    audio: forme.audio,
    exemple: { latin: forme.latin, arabe: forme.arabe, fr: forme.fr, audio: forme.audio },
  }
}

/**
 * 5 questions sur des formes différentes : Traduis, Écoute et choisis, Construis la phrase
 * (s'il y a une forme de 3 à 6 mots, sinon Traduis), Écoute et choisis, et Dis-le d'une phrase,
 * les leurres pris dans la leçon (dari / darek / daro…). Sans parler, la phrase à dire devient un
 * Traduis ; sans écouter, les Écoute et choisis deviennent des Traduis : toujours 5 questions.
 */
export function composerLecon(lecon: LeconGrammaire, alea: Aleatoire = Math.random, modes: Modes = TOUS_LES_MODES): Etape[] {
  const mots = lecon.formes.map((f) => formeEnMot(f, lecon))
  const restants = melanger(mots, alea)
  const prendre = (filtre: (m: Mot) => boolean = () => true): Mot | undefined => {
    const i = restants.findIndex(filtre)
    return i < 0 ? undefined : restants.splice(i, 1)[0]
  }
  // La phrase à dire et celle à construire sont choisies d'abord, parmi les plus longues.
  const aDire = prendre((m) => m.latin.includes(' ')) ?? prendre()!
  const aConstruire = prendre(phraseConstructible)
  const choix = (type: 'ecoute' | 'traduis', mot: Mot): Etape => ({ type, mot, choix: propositions(mot, mots, alea) })
  const ecoute = modes.ecouter ? 'ecoute' : 'traduis'
  const etapes: Etape[] = [choix('traduis', prendre()!), choix(ecoute, prendre()!)]
  etapes.push(aConstruire ? questionPhrase(aConstruire, mots, alea) : choix('traduis', prendre()!))
  etapes.push(choix(ecoute, prendre()!))
  etapes.push(modes.parler ? { type: 'disle', mot: aDire, phrase: aDire.latin.includes(' ') } : choix('traduis', aDire))
  return etapes
}
