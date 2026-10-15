import type { MotifSignalement } from '../db/db'
import type { Mot } from '../data/types'
import type { EtatSrs } from '../srs/leitner'

/** Listes de mots tirées de la progression et des marques (logique pure). */

/**
 * Mots difficiles : déjà ratés et pas encore bien installés (boîte 1 ou 2),
 * les plus ratés d'abord, puis ceux qui ont le moins de réussites.
 */
export function motsDifficiles(progressions: EtatSrs[], tous: Mot[]): Mot[] {
  const parId = new Map(tous.map((m) => [m.id, m]))
  return progressions
    .filter((p) => p.echecs > 0 && p.boite <= 2)
    .sort((a, b) => b.echecs - a.echecs || a.reussites - b.reussites)
    .map((p) => parId.get(p.id))
    .filter((m): m is Mot => m !== undefined)
}

export const MOTIFS: Record<MotifSignalement, string> = {
  traduction: 'la traduction',
  ecriture: 'l’écriture (latin ou arabe)',
  prononciation: 'la prononciation',
}

/** Texte à copier pour transmettre les mots signalés (et les corriger dans les fichiers JSON). */
export function texteSignalements(signales: { id: string; motif: MotifSignalement }[], tous: Mot[]): string {
  const parId = new Map(tous.map((m) => [m.id, m]))
  const lignes = signales
    .map(({ id, motif }) => {
      const m = parId.get(id)
      return m ? `- ${m.id} : ${m.latin} / ${m.arabe} = ${m.fr} → à vérifier : ${MOTIFS[motif]}` : null
    })
    .filter((l): l is string => l !== null)
  return [`Mots signalés dans Darijaapp (${lignes.length}) :`, ...lignes].join('\n')
}

export interface AvanceeTheme {
  id: string
  total: number
  vus: number
}

/**
 * Ordre des thèmes de l'accueil : ceux en cours d'abord (les plus avancés en tête), puis ceux pas encore
 * commencés dans l'ordre du programme, enfin ceux dont tous les mots sont vus.
 */
export function ordonnerThemes(themes: { id: string; mots: string[] }[], vus: Set<string>): AvanceeTheme[] {
  const avancees = themes.map((t) => ({ id: t.id, total: t.mots.length, vus: t.mots.filter((id) => vus.has(id)).length }))
  const rang = (a: AvanceeTheme) => (a.vus === 0 ? 1 : a.vus >= a.total ? 2 : 0)
  return avancees
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rang(x.a) - rang(y.a) || (rang(x.a) === 0 ? y.a.vus / y.a.total - x.a.vus / x.a.total : 0) || x.i - y.i)
    .map(({ a }) => a)
}
