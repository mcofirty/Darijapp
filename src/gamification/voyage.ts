import type { Mot } from '../data/types'

/** Le Parcours : un voyage au Maroc en 10 étapes, qui couvrent les 31 thèmes (logique pure). */

export interface Etape {
  id: string
  ville: string
  /** Ce qu'on y apprend, en quelques mots. */
  sujet: string
  themes: string[]
}

export const ETAPES: Etape[] = [
  { id: 'tanger', ville: 'Tanger', sujet: 'Les bases : saluer, demander', themes: ['salutations', 'expressions', 'questions'] },
  { id: 'tetouan', ville: 'Tétouan', sujet: 'Se présenter, la famille, les émotions', themes: ['famille', 'rencontres', 'emotions'] },
  { id: 'chefchaouen', ville: 'Chefchaouen', sujet: 'Couleurs, corps et vêtements', themes: ['couleurs', 'corps', 'vetements'] },
  { id: 'fes', ville: 'Fès', sujet: 'Chiffres, jours et grammaire', themes: ['chiffres', 'jours', 'grammaire'] },
  { id: 'meknes', ville: 'Meknès', sujet: 'La maison et la cuisine', themes: ['maison', 'cuisine'] },
  { id: 'rabat', ville: 'Rabat', sujet: 'La ville, le travail, le numérique', themes: ['ville', 'travail', 'organisation', 'numerique'] },
  { id: 'casablanca', ville: 'Casablanca', sujet: 'Se déplacer et se soigner', themes: ['transports', 'chemin', 'adverbes', 'sante'] },
  { id: 'marrakech', ville: 'Marrakech', sujet: 'Le souk, le restaurant, la nourriture', themes: ['souk', 'restaurant', 'nourriture'] },
  { id: 'essaouira', ville: 'Essaouira', sujet: 'Nature et loisirs', themes: ['nature', 'loisirs'] },
  { id: 'merzouga', ville: 'Merzouga', sujet: 'Verbes, descriptions et conversation', themes: ['verbes', 'adjectifs', 'conversation', 'tournures'] },
]

/** Part des mots d'une étape à bien retenir (boîte 2 ou plus) pour obtenir son tampon. */
export const SEUIL_TAMPON = 0.8
/** XP d'un trésor, entre deux étapes. */
export const XP_TRESOR = 100

export interface EtatEtape {
  etape: Etape
  total: number
  vus: number
  /** Mots réussis à leur dernière révision (boîte 2 ou plus). */
  retenus: number
  /** Tampon : 80 % des mots retenus, ou épreuve de l'étape réussie. */
  tampon: boolean
  /** Tampon doré : épreuve légendaire réussie. */
  legendaire: boolean
}

export function motsDeLEtape(etape: Etape, tous: Mot[]): Mot[] {
  return etape.themes.flatMap((t) => tous.filter((m) => m.theme === t))
}

export function etatsDuVoyage(
  tous: Mot[],
  progressions: { id: string; boite: number }[],
  validees: Iterable<string> = [],
  legendaires: Iterable<string> = [],
): EtatEtape[] {
  const ok = new Set(validees)
  const or = new Set(legendaires)
  const boites = new Map(progressions.map((p) => [p.id, p.boite]))
  return ETAPES.map((etape) => {
    const mots = motsDeLEtape(etape, tous)
    const vus = mots.filter((m) => boites.has(m.id)).length
    const retenus = mots.filter((m) => (boites.get(m.id) ?? 0) >= 2).length
    const tampon = ok.has(etape.id) || (mots.length > 0 && retenus >= Math.ceil(mots.length * SEUIL_TAMPON))
    return { etape, total: mots.length, vus, retenus, tampon, legendaire: tampon && or.has(etape.id) }
  })
}

/** Prochaine étape conseillée : la première sans tampon (toutes restent ouvertes). */
export function prochaineEtape(etats: EtatEtape[]): number {
  const i = etats.findIndex((e) => !e.tampon)
  return i === -1 ? etats.length - 1 : i
}

/** Trésor n° i, entre l'étape i et l'étape i + 1 : il s'ouvre quand l'étape i a son tampon. */
export function cleTresor(i: number): string {
  return `tresor-${ETAPES[i].id}`
}

export function tresorOuvrable(i: number, etats: EtatEtape[], dejaOuverts: Set<string>): boolean {
  return i < ETAPES.length - 1 && etats[i].tampon && !dejaOuverts.has(cleTresor(i))
}

/**
 * Leçon d'étape : les 5 premiers mots jamais vus de l'étape et ses révisions dues (au plus 8).
 * Sans rien de neuf ni de dû, un entraînement libre sur 8 mots vus de l'étape.
 */
export function planDeLecon(
  etape: Etape,
  tous: Mot[],
  progressions: { id: string; prochaineRevision: string }[],
  aujourdhui: string,
): { nouveaux: Mot[]; revisions: Mot[]; entrainement: Mot[] } {
  const mots = motsDeLEtape(etape, tous)
  const prog = new Map(progressions.map((p) => [p.id, p]))
  const nouveaux = mots.filter((m) => !prog.has(m.id)).slice(0, 5)
  const revisions = mots.filter((m) => (prog.get(m.id)?.prochaineRevision ?? '9999') <= aujourdhui).slice(0, 8)
  const entrainement = nouveaux.length + revisions.length === 0 ? mots.filter((m) => prog.has(m.id)) : []
  return { nouveaux, revisions, entrainement }
}
