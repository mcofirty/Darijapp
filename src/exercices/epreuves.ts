import { SONS, type Son } from '../data/sons'
import type { Mot } from '../data/types'
import { motsDeLEtape, type Etape as EtapeVoyage } from '../gamification/voyage'
import { phraseConstructible } from './phrases'
import { melanger, propositions, questionPhrase, type Aleatoire, type Etape } from './session'
import { questionTrou, trouPossible } from './trou'

/** Épreuves du Parcours et test de niveau (logique pure). */

/** Épreuve d'une étape : 10 questions sur ses mots ; 8 bonnes réponses valident l'étape (tampon). */
export const QUESTIONS_EPREUVE = 10
export const REUSSITE_EPREUVE = 8
/** Épreuve légendaire : 12 questions plus dures, sans indice ni ralenti ; 10 bonnes pour le tampon doré. */
export const QUESTIONS_LEGENDAIRE = 12
export const REUSSITE_LEGENDAIRE = 10

/** Épreuve d'une étape : Écoute et choisis et Traduis en alternance, sur 10 mots de l'étape tirés au hasard. */
export function composerEpreuve(etape: EtapeVoyage, tous: Mot[], alea: Aleatoire = Math.random): Etape[] {
  const mots = melanger(motsDeLEtape(etape, tous), alea).slice(0, QUESTIONS_EPREUVE)
  return mots.map((mot, i) => ({ type: i % 2 === 0 ? 'ecoute' : 'traduis', mot, choix: propositions(mot, tous, alea) }))
}

/**
 * Épreuve légendaire : Traduis (français → darija), phrases à trou, phrases à construire et Dis-le en darija,
 * sur 12 mots de l'étape.
 */
export function composerLegendaire(etape: EtapeVoyage, tous: Mot[], alea: Aleatoire = Math.random): Etape[] {
  const mots = melanger(motsDeLEtape(etape, tous), alea).slice(0, QUESTIONS_LEGENDAIRE)
  return mots.map((mot, i): Etape => {
    if (i % 4 === 1 && trouPossible(mot)) return questionTrou(mot, tous, alea)
    if (i % 4 === 2 && phraseConstructible(mot)) return questionPhrase(mot, tous, alea)
    if (i % 4 === 3) return { type: 'disle', mot, inverse: true }
    return { type: 'traduis', mot, choix: propositions(mot, tous, alea) }
  })
}

export interface Guide {
  /** Mots et expressions clés : les premiers de chaque thème de l'étape. */
  cles: Mot[]
  /** Le son du darija le plus présent dans les mots de l'étape, et un mot de l'étape pour l'entendre. */
  son: Son | null
  exemple: Mot | null
}

const SONS_OBJECTIF = ['3', '7', '9', 'kh', 'gh']

/** Guide de l'étape : phrases clés et conseil de prononciation. */
export function guideDeLEtape(etape: EtapeVoyage, tous: Mot[]): Guide {
  const cles = etape.themes.flatMap((t) => tous.filter((m) => m.theme === t).slice(0, 3))
  const mots = motsDeLEtape(etape, tous)
  // Les 5 sons de l'objectif (ع ح ق خ غ), pas ch ni les autres.
  const comptes = SONS.filter((s) => SONS_OBJECTIF.includes(s.latin))
    .map((s) => ({ s, n: mots.filter((m) => m.latin.includes(s.latin)).length }))
    .sort((a, b) => b.n - a.n)
  const son = comptes[0]?.n ? comptes[0].s : null
  const exemple = son ? (mots.find((m) => m.latin.includes(son.latin) && !/\s/.test(m.latin)) ?? mots.find((m) => m.latin.includes(son.latin)) ?? null) : null
  return { cles, son, exemple }
}

/** Test de niveau : le programme coupé en blocs, du début à la fin. */
export const TAILLE_BLOC = 60
export const QUESTIONS_PAR_BLOC = 3
export const BLOCS_MAX = 10

export function blocsDuProgramme(programme: Mot[]): Mot[][] {
  const blocs: Mot[][] = []
  for (let i = 0; i < programme.length && blocs.length < BLOCS_MAX; i += TAILLE_BLOC) blocs.push(programme.slice(i, i + TAILLE_BLOC))
  return blocs
}

/** Questions d'un bloc : 3 Traduis sur des mots du bloc, leurres pris dans le bloc. */
export function questionsDuBloc(bloc: Mot[], alea: Aleatoire = Math.random): Etape[] {
  return melanger(bloc, alea)
    .slice(0, QUESTIONS_PAR_BLOC)
    .map((mot) => ({ type: 'traduis', mot, choix: propositions(mot, bloc, alea) }))
}

/** Un bloc est su avec au moins 2 bonnes réponses sur 3 ; le test s'arrête au premier bloc raté. */
export const blocSu = (justes: number) => justes >= QUESTIONS_PAR_BLOC - 1

/**
 * Révisions des mots sautés : boîte 2, étalées sur les 14 jours qui viennent (pas toutes le même jour),
 * pour que les révisions les confirment peu à peu.
 */
export function progressionsSautees(mots: Mot[], aujourdhui: string, ajouterJours: (d: string, n: number) => string) {
  return mots.map((m, i) => ({
    id: m.id,
    boite: 2,
    prochaineRevision: ajouterJours(aujourdhui, 1 + (i % 14)),
    reussites: 1,
    echecs: 0,
    scores: [] as number[],
    favori: false,
    signale: false,
    audioPerso: null,
  }))
}
