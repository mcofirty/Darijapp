/**
 * Vocalisation de l'arabe pour la voix de synthèse (logique pure, sans import : `scripts/voix.ts`
 * la lance directement avec Node).
 *
 * L'arabe des mots est écrit sans voyelles : la voix le lit alors comme de l'arabe standard
 * (« kataba » pour كتب, voyelles finales). Le latin, lui, dit comment on parle (« ktab », « bzaf »).
 * On aligne les deux, puis on place sur chaque consonne arabe :
 * - un soukoun (ْ) quand le latin enchaîne une autre consonne, ou en fin de mot ;
 * - une chadda (ّ) quand le latin double la consonne (« ssba7 », « mzyan » non, « 3amma » oui) ;
 * - une voyelle brève quand le latin en a une que l'arabe n'écrit pas (a → َ, i → ِ, ou → ُ) ;
 *   le « e » du latin (voyelle neutre, schwa) n'a pas d'équivalent : rien n'est ajouté.
 * Si l'alignement est trop incertain, on renvoie null : la voix garde l'arabe tel quel.
 */

const FATHA = '\u064E'
const DAMMA = '\u064F'
const KASRA = '\u0650'
const CHADDA = '\u0651'
const SOUKOUN = '\u0652'
const FATHATAN = '\u064B'

type Unite =
  | { type: 'consonne'; son: string; double: boolean }
  | { type: 'voyelle'; son: 'a' | 'i' | 'u' | 'e' }
  | { type: 'espace' }
  | { type: 'ponctuation' }

// Pas de « sh » : le programme écrit ش « ch », et « shel » (سهل) se lit s-h.
const DIGRAMMES = ['kh', 'gh', 'ch', 'ou']
const VOYELLES: Record<string, 'a' | 'i' | 'u' | 'e'> = {
  a: 'a',
  à: 'a',
  â: 'a',
  i: 'i',
  î: 'i',
  ï: 'i',
  é: 'i',
  è: 'e',
  ê: 'e',
  e: 'e',
  o: 'u',
  ô: 'u',
  u: 'u',
  ou: 'u',
}
const CONSONNES = new Set('bcdfghjklmnpqrstvwxyz23479ç'.split('').concat(['kh', 'gh', 'ch']))

/** Découpe le latin en sons : consonnes (doublées ou non), voyelles, espaces, ponctuation. */
export function decouperLatin(latin: string): Unite[] {
  const s = latin.toLowerCase()
  const unites: Unite[] = []
  let i = 0
  while (i < s.length) {
    const deux = s.slice(i, i + 2)
    const morceau = DIGRAMMES.includes(deux) ? deux : s[i]
    i += morceau.length
    const finDeMot = i >= s.length || !/[a-z0-9çéèêàâîïô]/.test(s[i])
    if (morceau === ' ') unites.push({ type: 'espace' })
    // « y » final après une consonne se dit « i » (penalty).
    else if (morceau === 'y' && finDeMot && unites.at(-1)?.type === 'consonne') unites.push({ type: 'voyelle', son: 'i' })
    else if (morceau in VOYELLES) unites.push({ type: 'voyelle', son: VOYELLES[morceau] })
    else if (CONSONNES.has(morceau)) {
      const son = morceau
      const avant = unites.at(-1)
      // Consonne doublée (« ss », « 77 ») : une seule unité, marquée double.
      if (avant?.type === 'consonne' && avant.son === son && !avant.double) avant.double = true
      else unites.push({ type: 'consonne', son, double: false })
    } else if (morceau === '-' || morceau === "'") continue
    else unites.push({ type: 'ponctuation' })
  }
  return unites
}

/** Lettres arabes qui peuvent rendre chaque consonne du latin, avec un coût (0 = évident). */
const CONSONNE_ARABE: Record<string, Record<string, number>> = {
  b: { ب: 0, پ: 0 },
  p: { پ: 0, ب: 0 },
  t: { ت: 0, ط: 0, ث: 0.5, ة: 0.5 },
  d: { د: 0, ض: 0, ذ: 0.5, ظ: 0.5 },
  j: { ج: 0 },
  g: { ڭ: 0, گ: 0, ك: 0, ق: 0, ج: 0.5, غ: 1 },
  k: { ك: 0, ق: 0.5 },
  q: { ق: 0, ك: 0.5 },
  '9': { ق: 0 },
  '3': { ع: 0 },
  '7': { ح: 0 },
  h: { ه: 0, ح: 0.7, ة: 0.5 },
  kh: { خ: 0 },
  gh: { غ: 0 },
  ch: { ش: 0 },
  s: { س: 0, ص: 0, ث: 0.5, ز: 1 },
  ç: { س: 0 },
  c: { ك: 0.5, س: 0.5 },
  x: { ك: 1.5, س: 1.5 },
  z: { ز: 0, ظ: 0, ذ: 0.5 },
  r: { ر: 0 },
  l: { ل: 0 },
  m: { م: 0 },
  n: { ن: 0 },
  f: { ف: 0, ڤ: 0.5 },
  v: { ڤ: 0, ف: 0.5 },
  w: { و: 0, ؤ: 0.5 },
  y: { ي: 0, ى: 0.5, ئ: 0.5 },
  '2': { ء: 0, أ: 0, إ: 0, ئ: 0, ؤ: 0, آ: 0 },
}

/** Lettres arabes qui peuvent porter une voyelle du latin (voyelles longues, hamza en début de mot). */
const VOYELLE_ARABE: Record<string, Record<string, number>> = {
  a: { ا: 0, ى: 0, ة: 0, آ: 0, أ: 0 },
  i: { ي: 0, إ: 0, ى: 0.5, أ: 0.5 },
  u: { و: 0, ؤ: 0.5, أ: 0.5 },
  // « e » est d'ordinaire une voyelle neutre non écrite ; dans les emprunts au français (lmeteo), un ي.
  e: { ي: 0.5, ا: 1, ة: 1, أ: 0.5 },
}

/** Coût d'une lettre arabe sans équivalent dans le latin (lettre muette, ou mal comprise). */
function coutMuette(lettre: string, debutDeMot: boolean, articleAvant: boolean): number {
  if (lettre === 'ا') return debutDeMot ? 0 : 0.6
  if (lettre === 'ل' && articleAvant) return 0.2 // « l » de l'article, absent ou assimilé (ssba7 = الصباح)
  if (lettre === 'ة') return 0.3
  if (lettre === 'ى' || lettre === 'ء' || lettre === 'أ' || lettre === 'إ') return 0.5
  if (lettre === 'و' || lettre === 'ي') return 1.2
  return 2.5
}

const PONCTUATION_ARABE = new Set(['؟', '،', '!', '.', '—', '/', '?', ',', ':', '«', '»', '؛'])

type Role =
  | { type: 'consonne'; unite: number }
  | { type: 'voyelle'; unite: number }
  | { type: 'muette' }
  | { type: 'neutre' }

/** Aligne le latin et l'arabe (programmation dynamique) ; renvoie le rôle de chaque lettre arabe et le coût. */
function aligner(
  unites: Unite[],
  lettres: string[],
): { roles: Role[]; voyellesPortees: Set<number>; sautees: Set<number>; cout: number } {
  const n = unites.length
  const m = lettres.length
  const debutDeMot = lettres.map((_, j) => j === 0 || lettres[j - 1] === ' ')
  // Une lettre collée en tête de mot (ب ف ل و ك : « b », « f », « l », « w », « k ») n'empêche pas l'article
  // qui suit d'être en début de mot : بالصابون = b + ssaboun, فالليل = f + llil, للبيرو = l + lbiro.
  const proclitique = (j: number) => debutDeMot[j] && 'بفلوك'.includes(lettres[j])
  const debutOuApresProclitique = lettres.map((_, j) => debutDeMot[j] || (j > 0 && proclitique(j - 1)))
  const article = lettres.map(
    (l, j) =>
      l === 'ل' && j > 0 && ((lettres[j - 1] === 'ا' && debutOuApresProclitique[j - 1]) || (lettres[j - 1] === 'ل' && proclitique(j - 1))),
  )
  const cout = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity))
  const pas = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1))
  cout[0][0] = 0
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const c = cout[i][j]
      if (c === Infinity) continue
      const u = unites[i]
      const l = lettres[j]
      const essayer = (di: number, dj: number, ajout: number, code: number) => {
        if (c + ajout < cout[i + di][j + dj]) {
          cout[i + di][j + dj] = c + ajout
          pas[i + di][j + dj] = code
        }
      }
      if (i < n && j < m) {
        if (u.type === 'consonne' && CONSONNE_ARABE[u.son]?.[l] !== undefined) {
          essayer(1, 1, CONSONNE_ARABE[u.son][l], 1)
          // Consonne doublée écrite deux fois en arabe (« llah » = لله).
          if (u.double && lettres[j + 1] === l) essayer(1, 2, CONSONNE_ARABE[u.son][l], 6)
        }
        if (u.type === 'voyelle' && VOYELLE_ARABE[u.son][l] !== undefined) essayer(1, 1, VOYELLE_ARABE[u.son][l], 2)
        if (u.type === 'espace' && l === ' ') essayer(1, 1, 0, 3)
        if (u.type === 'ponctuation' && PONCTUATION_ARABE.has(l)) essayer(1, 1, 0, 3)
      }
      if (i < n) {
        // Son du latin sans lettre arabe : voyelle brève (normale), espace ou ponctuation en trop, consonne oubliée ;
        // « n » final après « a » : tanwin (chokran = شكرا).
        const suivante = unites[i + 1]
        const fin = suivante === undefined || suivante.type === 'espace' || suivante.type === 'ponctuation'
        const avant = unites[i - 1]
        const tanwin = u.type === 'consonne' && u.son === 'n' && !u.double && fin && avant?.type === 'voyelle' && avant.son === 'a'
        essayer(1, 0, u.type === 'voyelle' || u.type === 'ponctuation' ? 0 : u.type === 'espace' ? 0.2 : tanwin ? 0.3 : 2.5, 4)
      }
      if (j < m) {
        const neutre = l === ' ' ? 0.2 : PONCTUATION_ARABE.has(l) || /[ً-ْ]/.test(l) ? 0 : null
        essayer(0, 1, neutre ?? coutMuette(l, debutOuApresProclitique[j], article[j]), 5)
      }
    }
  }
  const roles: Role[] = Array.from({ length: m }, () => ({ type: 'neutre' }))
  const voyellesPortees = new Set<number>()
  const sautees = new Set<number>()
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    const p = pas[i][j]
    if (p === 1) roles[j - 1] = { type: 'consonne', unite: i - 1 }
    else if (p === 6) {
      roles[j - 1] = { type: 'consonne', unite: i - 1 }
      roles[j - 2] = { type: 'muette' }
    } else if (p === 4) sautees.add(i - 1)
    else if (p === 2) {
      roles[j - 1] = { type: 'voyelle', unite: i - 1 }
      voyellesPortees.add(i - 1)
    } else if (p === 5 && lettres[j - 1] !== ' ' && !PONCTUATION_ARABE.has(lettres[j - 1])) roles[j - 1] = { type: 'muette' }
    if (p === 1 || p === 2 || p === 3) {
      i--
      j--
    } else if (p === 6) {
      i--
      j -= 2
    } else if (p === 4) i--
    else j--
  }
  return { roles, voyellesPortees, sautees, cout: cout[n][m] }
}

const BREVE: Record<string, string> = { a: FATHA, i: KASRA, u: DAMMA, e: '' }
/** Voyelle brève qui annonce une voyelle longue écrite (كَا, كِي, كُو). */
const BREVE_DEVANT: Record<string, string> = { ا: FATHA, ى: FATHA, ة: FATHA, آ: '', ي: KASRA, إ: '', و: DAMMA, ؤ: DAMMA }

/** Coût toléré : environ une lettre douteuse par mot, jamais plus de 3 au total. */
function coutMax(unites: Unite[]): number {
  const mots = unites.filter((u) => u.type === 'espace').length + 1
  return Math.min(3, 0.6 + 0.6 * mots)
}

/**
 * L'arabe vocalisé d'après le latin, ou null si les deux ne se correspondent pas assez
 * (la voix lit alors l'arabe tel quel).
 */
export function vocaliser(latin: string, arabe: string): string | null {
  const unites = decouperLatin(latin)
  const lettres = [...arabe.normalize('NFC')]
  if (unites.length === 0 || lettres.length === 0) return null
  const { roles, voyellesPortees, sautees, cout } = aligner(unites, lettres)
  if (cout > coutMax(unites)) return null

  let sortie = ''
  lettres.forEach((l, j) => {
    sortie += l
    const role = roles[j]
    if (role.type !== 'consonne' || l === 'ة') return
    const u = unites[role.unite] as Extract<Unite, { type: 'consonne' }>
    const suite = unites[role.unite + 1]
    if (u.double) sortie += CHADDA
    const lettreSuivante = lettres[j + 1]
    const roleSuivant = roles[j + 1]?.type
    if (suite?.type === 'voyelle' && lettreSuivante in BREVE_DEVANT && (roleSuivant === 'voyelle' || roleSuivant === 'muette')) {
      // Une voyelle longue écrite suit : la brève doit lui correspondre (كَا, كِي, كُو), sinon rien (latin et arabe divergent).
      const famille: Record<string, string> = { ا: 'a', ى: 'a', ة: 'a', ي: 'i', إ: 'i', و: 'u', ؤ: 'u' }
      const accord = famille[lettreSuivante] === suite.son || (suite.son === 'e' && famille[lettreSuivante] === 'i')
      const tanwin = lettreSuivante === 'ا' && sautees.has(role.unite + 2) && unites[role.unite + 2]?.type === 'consonne'
      sortie += tanwin ? FATHATAN : accord ? BREVE_DEVANT[lettreSuivante] : ''
    } else if (suite?.type === 'voyelle') {
      if (voyellesPortees.has(role.unite + 1)) {
        // Voyelle longue écrite juste après : on annonce sa voyelle brève.
        const porteuse = lettres.slice(j + 1).find((_, k) => roles[j + 1 + k]?.type === 'voyelle')
        const tanwin = porteuse === 'ا' && sautees.has(role.unite + 2) && unites[role.unite + 2]?.type === 'consonne'
        sortie += tanwin ? FATHATAN : porteuse ? (BREVE_DEVANT[porteuse] ?? '') : ''
      } else sortie += BREVE[suite.son]
    } else if (!u.double) sortie += SOUKOUN
  })
  return sortie.normalize('NFC')
}
