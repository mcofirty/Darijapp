/**
 * Texte lu par la voix de synthèse (logique pure, sans import : `scripts/voix.mjs` la lance
 * directement avec Node).
 *
 * L'arabe des mots est écrit sans voyelles : la voix le lit alors comme de l'arabe standard
 * (« kataba » pour كتب, voyelles finales). Le latin, lui, dit comment on parle (« ktab », « bzaf »).
 * On réécrit donc le latin en arabe entièrement vocalisé, en l'alignant sur l'arabe pour garder
 * ce que le latin n'écrit pas (consonnes lourdes, voyelles longues) :
 * - un soukoun (ْ) quand le latin enchaîne une autre consonne, ou en fin de mot ;
 * - une chadda (ّ) quand le latin double la consonne (« ssba7 », « 3amma ») ;
 * - une voyelle brève quand le latin en a une que l'arabe n'écrit pas (a → َ, i → ِ, ou → ُ) ;
 *   le « e » du latin (voyelle neutre, schwa) n'a pas d'équivalent : rien n'est ajouté.
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

/**
 * Une étape de l'alignement : 1 consonne commune, 2 voyelle écrite en arabe, 3 espace ou ponctuation communs,
 * 4 son du latin absent de l'arabe, 5 lettre arabe absente du latin, 6 consonne doublée écrite deux fois.
 * `i` et `j` : position dans le latin et dans l'arabe au début de l'étape.
 */
interface Etape {
  code: number
  i: number
  j: number
}

/** Aligne le latin et l'arabe (programmation dynamique) ; renvoie le chemin et son coût. */
function aligner(unites: Unite[], lettres: string[]): { chemin: Etape[]; cout: number } {
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
  // Remonte le meilleur chemin, puis le remet dans l'ordre du texte.
  const chemin: Etape[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    const code = pas[i][j]
    const di = code === 5 ? 0 : 1
    const dj = code === 4 ? 0 : code === 6 ? 2 : 1
    i -= di
    j -= dj
    chemin.push({ code, i, j })
  }
  return { chemin: chemin.reverse(), cout: cout[n][m] }
}

const BREVE: Record<string, string> = { a: FATHA, i: KASRA, u: DAMMA, e: '' }
/** Voyelle brève qui annonce une voyelle longue écrite (كَا, كِي, كُو). */
const BREVE_DEVANT: Record<string, string> = { ا: FATHA, ى: FATHA, ة: FATHA, آ: '', ي: KASRA, إ: '', و: DAMMA, ؤ: DAMMA }

/** Coût toléré : environ une lettre douteuse par mot, jamais plus de 3 au total. */
function coutMax(unites: Unite[]): number {
  const mots = unites.filter((u) => u.type === 'espace').length + 1
  return Math.min(3, 0.6 + 0.6 * mots)
}

/** Lettre arabe de chaque consonne du latin, quand l'arabe ne la donne pas. */
const TRANSLITTERATION: Record<string, string> = {
  b: 'ب',
  p: 'ب',
  t: 'ت',
  d: 'د',
  j: 'ج',
  g: 'گ',
  k: 'ك',
  q: 'ق',
  '9': 'ق',
  '3': 'ع',
  '7': 'ح',
  h: 'ه',
  kh: 'خ',
  gh: 'غ',
  ch: 'ش',
  s: 'س',
  ç: 'س',
  c: 'ك',
  x: 'كْس',
  z: 'ز',
  r: 'ر',
  l: 'ل',
  m: 'م',
  n: 'ن',
  f: 'ف',
  v: 'ڤ',
  w: 'و',
  y: 'ي',
  '2': 'ء',
}
/** Voyelle du latin en fin de mot, écrite en lettre pour être bien entendue. */
const LONGUE: Record<string, string> = { a: 'ا', i: 'ي', u: 'و', e: '' }
/** Voyelle du latin en début de mot : portée par un alif. */
const INITIALE: Record<string, string> = { a: 'أَ', i: 'إِ', u: 'أُ', e: 'أ' }
const FAMILLE: Record<string, string> = { ا: 'a', ى: 'a', ة: 'a', آ: 'a', ي: 'i', إ: 'i', و: 'u', ؤ: 'u' }

/**
 * Ce que lit la voix : le latin, écrit en arabe entièrement vocalisé. C'est le latin qui décide
 * de la prononciation ; de l'arabe, on ne garde que ce que le latin n'écrit pas, quand les deux
 * concordent : consonnes lourdes (ص ط ض ق, écrites s t d g en latin) et voyelles longues (ا و ي).
 * Lettres arabes absentes du latin : retirées (article non prononcé, lettre muette). Sons du latin
 * absents de l'arabe : ajoutés. Si les deux divergent trop, tout vient du latin.
 */
export function vocaliser(latin: string, arabe: string): string | null {
  const unites = decouperLatin(latin)
  if (unites.length === 0) return null
  const lettres = [...arabe.normalize('NFC')].filter((l) => !/[\u064B-\u0652]/.test(l))
  let { chemin, cout } = aligner(unites, lettres)
  if (cout > coutMax(unites)) chemin = aligner(unites, []).chemin

  const estFin = (k: number) => {
    const u = unites[k]
    return u === undefined || u.type === 'espace' || u.type === 'ponctuation'
  }
  const tanwin = (k: number) => {
    const u = unites[k]
    const avant = unites[k - 1]
    return u?.type === 'consonne' && u.son === 'n' && !u.double && estFin(k + 1) && avant?.type === 'voyelle' && avant.son === 'a'
  }

  // Morceaux du texte, dans l'ordre ; les consonnes gardent leur son du latin pour recevoir leur voyelle.
  const morceaux: { texte: string; unite?: number; double?: boolean }[] = []
  const voyelleEcrite = new Map<number, string>()
  // « n » final lu comme tanwin (chokran = شكرا) : seulement quand l'arabe ne l'écrit pas.
  const tanwinLu = new Set(chemin.filter((e) => e.code === 4 && tanwin(e.i)).map((e) => e.i))
  for (const { code, i, j } of chemin) {
    const u = unites[i]
    if (code === 1) morceaux.push({ texte: lettres[j], unite: i, double: u.type === 'consonne' && u.double })
    else if (code === 6) morceaux.push({ texte: lettres[j] }, { texte: lettres[j + 1], unite: i })
    else if (code === 2) {
      morceaux.push({ texte: lettres[j] })
      voyelleEcrite.set(i, lettres[j])
    } else if (code === 3 || (code === 5 && (lettres[j] === ' ' || PONCTUATION_ARABE.has(lettres[j])))) morceaux.push({ texte: lettres[j] })
    else if (code === 4) {
      if (u.type === 'espace') morceaux.push({ texte: ' ' })
      else if (u.type === 'consonne' && !tanwin(i)) morceaux.push({ texte: TRANSLITTERATION[u.son] ?? '', unite: i, double: u.double })
      else if (u.type === 'voyelle') {
        const avant = unites[i - 1]
        if (avant === undefined || avant.type === 'espace' || avant.type === 'ponctuation') morceaux.push({ texte: INITIALE[u.son] })
        else if (estFin(i + 1) || avant.type !== 'consonne') {
          // Voyelle finale, ou qui suit une autre voyelle : écrite en lettre.
          morceaux.push({ texte: LONGUE[u.son] })
          if (LONGUE[u.son]) voyelleEcrite.set(i, LONGUE[u.son])
        }
      }
    }
    // code 5 : lettre arabe que le latin ne prononce pas, retirée.
  }

  const sortie = morceaux.map(({ texte, unite, double }) => {
    if (unite === undefined || texte === 'ة') return texte
    const suite = unites[unite + 1]
    let marques = double ? CHADDA : ''
    if (suite?.type === 'voyelle') {
      const ecrite = voyelleEcrite.get(unite + 1)
      if (ecrite === undefined) marques += BREVE[suite.son]
      else if (ecrite === 'ا' && tanwinLu.has(unite + 2)) marques += FATHATAN
      else if (FAMILLE[ecrite] === suite.son || (suite.son === 'e' && FAMILLE[ecrite] === 'i')) marques += BREVE_DEVANT[ecrite] ?? ''
    } else if (!double) marques += SOUKOUN
    return texte + marques
  })
  return sortie.join('').replace(/ +/g, ' ').trim().normalize('NFC')
}
