/**
 * Recherche tolérante (logique pure) : quand un mot est tapé avec une autre écriture ou une faute de frappe,
 * propose les mots qui lui ressemblent, en latin comme en français.
 */
import { normaliser } from './normaliser'
import type { Mot } from './types'

/** Forme commune des écritures du darija : 3 = a, 7 = h, 9/q/k/g, kh/x, gh/r, ch/sh, ou/u/o, e/i, lettres doublées. */
export function formeDarija(texte: string): string {
  return replier(
    normaliser(texte)
      .replace(/['’`-]/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/2/g, '')
      .replace(/kh|5/g, 'x')
      .replace(/gh/g, 'r')
      .replace(/ch|sh/g, 'c')
      .replace(/3/g, 'a')
      .replace(/7/g, 'h')
      .replace(/[9qkg]/g, 'k')
      .replace(/ou|[uo]/g, 'u')
      .replace(/[ei]/g, 'i'),
  )
}

/** Forme d'un texte français : sans accents, ponctuation ni lettres doublées. */
export function formeFrancais(texte: string): string {
  return replier(normaliser(texte).replace(/[^\p{L}\p{N}\s]/gu, ' '))
}

/** Une seule lettre là où elle est doublée (ll → l). */
function replier(texte: string): string {
  return texte.replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim()
}

/** Nombre de lettres à changer, ajouter, retirer ou inverser (deux voisines) pour passer de a à b. */
export function distance(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m || !n) return m || n
  let avant = new Array<number>(n + 1).fill(0)
  let prec = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cour = new Array<number>(n + 1).fill(0)
    cour[0] = i
    for (let j = 1; j <= n; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1
      cour[j] = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + cout)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cour[j] = Math.min(cour[j], avant[j - 2] + 1)
    }
    avant = prec
    prec = cour
  }
  return prec[n]
}

/** Écart accepté selon la longueur du mot tapé : aucun jusqu'à 3 lettres (trop de mots courts se ressemblent), 1 jusqu'à 5, 2 au-delà. */
export function tolerance(longueur: number): number {
  return longueur <= 3 ? 0 : longueur <= 5 ? 1 : 2
}

/**
 * Écart entre un mot tapé et un mot du dictionnaire, en acceptant un début de mot (frappe en cours) ;
 * un début de mot imparfait passe derrière un mot entier aussi proche.
 */
function ecart(tape: string, mot: string): number {
  const entier = distance(tape, mot)
  if (mot.length <= tape.length) return entier
  const debut = distance(tape, mot.slice(0, tape.length))
  return Math.min(entier, debut === 0 ? 0 : debut + 0.5)
}

/** Meilleur écart de chaque mot tapé dans un texte du dictionnaire ; null si l'un d'eux n'y ressemble à rien. */
function ecartTexte(tapes: string[], texte: string): number | null {
  const mots = texte.split(' ')
  let total = 0
  for (const t of tapes) {
    const meilleur = Math.min(...mots.map((m) => ecart(t, m)))
    if (Math.floor(meilleur) > tolerance(t.length)) return null
    total += meilleur
  }
  return total
}

const formes = new WeakMap<Mot, { darija: string; francais: string }>()
function formesDe(mot: Mot) {
  let f = formes.get(mot)
  if (!f) {
    f = { darija: formeDarija(mot.latin), francais: formeFrancais(mot.fr) }
    formes.set(mot, f)
  }
  return f
}

/** Nombre de propositions au plus. */
export const PROCHES_MAX = 20

/**
 * Mots qui ressemblent à la recherche sans la contenir telle quelle (ceux de `exclus` sont déjà trouvés),
 * du plus proche au moins proche. Rien en dessous de 3 lettres : trop de mots se ressembleraient.
 */
export function motsProches(mots: Mot[], requete: string, exclus: ReadonlySet<string> = new Set(), max = PROCHES_MAX): Mot[] {
  if (normaliser(requete).replace(/\s/g, '').length < 3) return []
  const darija = formeDarija(requete).split(' ').filter(Boolean)
  const francais = formeFrancais(requete).split(' ').filter(Boolean)
  const trouves: { mot: Mot; ecart: number }[] = []
  for (const mot of mots) {
    if (exclus.has(mot.id)) continue
    const f = formesDe(mot)
    const ecarts = [ecartTexte(darija, f.darija), ecartTexte(francais, f.francais)].filter((e): e is number => e !== null)
    if (ecarts.length) trouves.push({ mot, ecart: Math.min(...ecarts) })
  }
  return trouves
    .sort((a, b) => a.ecart - b.ecart || a.mot.latin.length - b.mot.latin.length)
    .slice(0, max)
    .map((t) => t.mot)
}
