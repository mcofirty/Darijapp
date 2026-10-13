import donnees from '../data/jeux/marchandage.json'
import type { Mot } from '../data/types'
import { melanger, type Aleatoire } from './session'

/** Mini-jeux : marchandage au souk et taxi (logique pure). */

// ——— Marchandage ———

export interface PhrasePrix {
  id: string
  montant: number
  latin: string
  arabe: string
  fr: string
  audio: string
}

export interface ArticleSouk {
  id: string
  nom: string
  latin: string
  arabe: string
  prix: [PhrasePrix, PhrasePrix, PhrasePrix]
}

export const ARTICLES_SOUK = donnees.articles as unknown as ArticleSouk[]

/** Mots du programme dits par le joueur (voix Jamal) : la bonne réplique, et des leurres. */
export const REPLIQUES = {
  tropCher: 'souk-067',
  dernierPrix: 'souk-069',
  jeLePrends: 'souk-017',
  leurres: ['souk-073', 'salutations-034', 'salutations-038', 'salutations-007'],
}

export type EtapeMarchandage =
  | { type: 'prix'; phrase: PhrasePrix; options: number[] }
  | { type: 'replique'; consigne: string; bonne: Mot; choix: Mot[] }

/** 4 montants dont le bon : des prix voisins, comme ceux qu'on pourrait confondre à l'oreille. */
export function optionsDePrix(montant: number, alea: Aleatoire = Math.random): number[] {
  const pas = montant >= 500 ? 100 : montant >= 100 ? 50 : 10
  const voisins = [-3, -2, -1, 1, 2, 3].map((k) => montant + k * pas).filter((m) => m > 0)
  return melanger([montant, ...melanger(voisins, alea).slice(0, 3)], alea)
}

/**
 * Une négociation : le marchand annonce un prix (à comprendre), on dit que c'est trop cher, il baisse,
 * on demande son dernier prix, il baisse encore, on accepte.
 */
export function negociation(article: ArticleSouk, tous: Mot[], alea: Aleatoire = Math.random): EtapeMarchandage[] {
  const parId = new Map(tous.map((m) => [m.id, m]))
  const leurres = REPLIQUES.leurres.map((id) => parId.get(id)).filter((m): m is Mot => m !== undefined)
  const replique = (consigne: string, id: string): EtapeMarchandage => {
    const bonne = parId.get(id)!
    return { type: 'replique', consigne, bonne, choix: melanger([bonne, ...melanger(leurres, alea).slice(0, 2)], alea) }
  }
  const [p1, p2, p3] = article.prix
  return [
    { type: 'prix', phrase: p1, options: optionsDePrix(p1.montant, alea) },
    replique('Dis-lui que c’est trop cher', REPLIQUES.tropCher),
    { type: 'prix', phrase: p2, options: optionsDePrix(p2.montant, alea) },
    replique('Demande-lui son dernier prix', REPLIQUES.dernierPrix),
    { type: 'prix', phrase: p3, options: optionsDePrix(p3.montant, alea) },
    replique('Accepte : dis-lui que tu le prends', REPLIQUES.jeLePrends),
  ]
}

/** Remise obtenue, en pourcentage du premier prix. */
export function remise(article: ArticleSouk): number {
  return Math.round((1 - article.prix[2].montant / article.prix[0].montant) * 100)
}

// ——— Taxi ———

export type Consigne = 'nichan' | 'limen' | 'lisser' | 'stop'

/** Mot du programme (voix Jamal) pour chaque consigne du passager. */
export const MOTS_TAXI: Record<Consigne, string[]> = {
  nichan: ['chemin-016', 'chemin-018'],
  limen: ['chemin-014'],
  lisser: ['chemin-015'],
  stop: ['chemin-017'],
}
/** Phrases d'arrivée dans le taxi (« je veux aller à la médina »…). */
export const DESTINATIONS = ['chemin-011', 'chemin-012', 'chemin-013']

export const TAILLE_PLAN = 5

export interface Case {
  x: number
  y: number
}

export interface Course {
  consignes: Consigne[]
  /** Cases traversées, du départ (en bas au milieu) à l'arrivée. */
  chemin: Case[]
}

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]

/** Nouvelle direction (0 nord, 1 est, 2 sud, 3 ouest) après une consigne. */
export function tourner(direction: number, consigne: Consigne): number {
  if (consigne === 'limen') return (direction + 1) % 4
  if (consigne === 'lisser') return (direction + 3) % 4
  return direction
}

/**
 * Une course de `etapes` consignes puis « 7bes hna », sans sortir du plan ni repasser par une case,
 * avec au moins un virage. Le taxi part d'en bas au milieu, vers le nord.
 */
export function nouvelleCourse(alea: Aleatoire = Math.random, etapes = 5): Course {
  for (;;) {
    let pos: Case = { x: Math.floor(TAILLE_PLAN / 2), y: TAILLE_PLAN - 1 }
    let dir = 0
    const chemin = [pos]
    const consignes: Consigne[] = []
    const vu = new Set([`${pos.x},${pos.y}`])
    for (let i = 0; i < etapes; i++) {
      const possibles = (['nichan', 'limen', 'lisser'] as Consigne[]).filter((c) => {
        const d = DIRECTIONS[tourner(dir, c)]
        const x = pos.x + d.dx
        const y = pos.y + d.dy
        return x >= 0 && y >= 0 && x < TAILLE_PLAN && y < TAILLE_PLAN && !vu.has(`${x},${y}`)
      })
      if (possibles.length === 0) break
      const c = possibles[Math.floor(alea() * possibles.length)]
      dir = tourner(dir, c)
      pos = { x: pos.x + DIRECTIONS[dir].dx, y: pos.y + DIRECTIONS[dir].dy }
      vu.add(`${pos.x},${pos.y}`)
      chemin.push(pos)
      consignes.push(c)
    }
    if (consignes.length === etapes && consignes.some((c) => c !== 'nichan')) {
      return { consignes: [...consignes, 'stop'], chemin }
    }
  }
}
