/**
 * Décor de la carte du Parcours (logique pure) : la route entre les nœuds, la place des vignettes de villes,
 * et des éléments semés selon la région traversée, du nord vert au désert de Merzouga. Tout est calculé
 * à partir d'une graine fixe : le décor reste le même d'une visite à l'autre.
 */

export interface Point {
  x: number
  y: number
}

/** Régions du voyage, dans l'ordre réel du nord au sud-est. */
export type Region = 'nord' | 'rif' | 'centre' | 'cote' | 'marrakech' | 'argan' | 'atlas' | 'desert'

/** Région de chaque étape (Tanger, Tétouan, Chefchaouen, Fès, Meknès, Rabat, Casablanca, Marrakech, Essaouira, Merzouga). */
export const REGIONS_ETAPES: Region[] = ['nord', 'nord', 'rif', 'centre', 'centre', 'cote', 'cote', 'marrakech', 'argan', 'desert']

export type TypeDecor =
  | 'arbre'
  | 'fleur'
  | 'coquelicot'
  | 'herbe'
  | 'mouton'
  | 'pin'
  | 'rocher'
  | 'chevre'
  | 'olivier'
  | 'champ'
  | 'maison'
  | 'palmierNain'
  | 'mouette'
  | 'palmier'
  | 'cactus'
  | 'herbeSeche'
  | 'arganier'
  | 'buisson'
  | 'kasbah'
  | 'cailloux'
  | 'nuage'

export interface ElementDecor {
  type: TypeDecor
  x: number
  y: number
  /** Retournement horizontal, pour varier. */
  miroir: boolean
  /** Échelle, de 0,8 à 1,15. */
  echelle: number
}

/** Ce qu'on rencontre dans chaque région, avec un poids (plus il est grand, plus c'est fréquent). */
const FLORE: Record<Region, [TypeDecor, number][]> = {
  nord: [['arbre', 3], ['fleur', 3], ['coquelicot', 2], ['herbe', 4], ['mouton', 1], ['nuage', 1]],
  rif: [['pin', 4], ['rocher', 2], ['herbe', 3], ['fleur', 2], ['chevre', 1], ['nuage', 1]],
  centre: [['olivier', 4], ['champ', 2], ['mouton', 1], ['herbe', 3], ['coquelicot', 2], ['maison', 1]],
  cote: [['palmierNain', 3], ['maison', 1], ['herbe', 3], ['fleur', 2], ['mouette', 1], ['arbre', 1]],
  marrakech: [['palmier', 4], ['cactus', 2], ['rocher', 1], ['herbeSeche', 3], ['cailloux', 1]],
  argan: [['arganier', 4], ['chevre', 1], ['rocher', 1], ['herbeSeche', 3], ['buisson', 2]],
  atlas: [['rocher', 3], ['kasbah', 1], ['herbeSeche', 2], ['buisson', 1]],
  desert: [['cailloux', 3], ['palmier', 1], ['rocher', 1], ['herbeSeche', 1]],
}

/** Rayon d'encombrement de chaque élément, pour qu'ils ne se chevauchent pas. */
export const RAYONS: Record<TypeDecor, number> = {
  arbre: 11, fleur: 4, coquelicot: 4, herbe: 6, mouton: 10, pin: 10, rocher: 9, chevre: 9, olivier: 11, champ: 18,
  maison: 13, palmierNain: 10, mouette: 8, palmier: 14, cactus: 10, herbeSeche: 6, arganier: 14, buisson: 8,
  kasbah: 16, cailloux: 6, nuage: 16,
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function aleatoire(graine: number): () => number {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Chemin SVG de la route : des courbes douces d'un nœud au suivant. */
export function cheminDeLaRoute(noeuds: Point[]): string {
  if (noeuds.length === 0) return ''
  let d = `M${noeuds[0].x} ${noeuds[0].y}`
  for (let i = 1; i < noeuds.length; i++) {
    const a = noeuds[i - 1]
    const b = noeuds[i]
    const my = (a.y + b.y) / 2
    d += ` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`
  }
  return d
}

/** Points le long de la route (mêmes courbes que `cheminDeLaRoute`), pour garder le décor à distance. */
export function pointsDeLaRoute(noeuds: Point[], parCourbe = 16): Point[] {
  const points: Point[] = noeuds.slice(0, 1)
  for (let i = 1; i < noeuds.length; i++) {
    const a = noeuds[i - 1]
    const b = noeuds[i]
    const my = (a.y + b.y) / 2
    for (let k = 1; k <= parCourbe; k++) {
      const t = k / parCourbe
      const u = 1 - t
      // Courbe de Bézier cubique : a, (a.x, my), (b.x, my), b.
      const x = u * u * u * a.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t * t * t * b.x
      const y = u * u * u * a.y + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * b.y
      points.push({ x, y })
    }
  }
  return points
}

/** Centre de la vignette d'une ville : de l'autre côté de la route que son étape (au sol, sous le monument). */
export function placeVignette(etape: Point, index: number, largeur: number): Point {
  const milieu = largeur / 2
  const x = etape.x < milieu - 10 ? etape.x + 130 : etape.x > milieu + 10 ? etape.x - 130 : index % 4 === 0 ? 72 : largeur - 72
  return { x, y: etape.y + 16 }
}

/** Zone occupée par une vignette (monument au-dessus du sol, eau un peu en dessous). */
export function dansVignette(p: Point, v: Point, marge = 0): boolean {
  return p.x > v.x - 70 - marge && p.x < v.x + 70 + marge && p.y > v.y - 100 - marge && p.y < v.y + 30 + marge
}

/**
 * Région à une hauteur donnée : celle de l'étape la plus proche, sauf entre Essaouira et Merzouga,
 * où l'on franchit le Haut Atlas.
 */
export function regionDe(y: number, etapes: number[]): Region {
  const n = etapes.length
  if (n >= 2 && y > etapes[n - 2] + 70 && y < etapes[n - 1] - 70) return 'atlas'
  let proche = 0
  etapes.forEach((ey, i) => {
    if (Math.abs(ey - y) < Math.abs(etapes[proche] - y)) proche = i
  })
  return REGIONS_ETAPES[Math.min(proche, REGIONS_ETAPES.length - 1)]
}

function tirer(liste: [TypeDecor, number][], r: number): TypeDecor {
  const total = liste.reduce((s, [, p]) => s + p, 0)
  let seuil = r * total
  for (const [type, poids] of liste) {
    seuil -= poids
    if (seuil < 0) return type
  }
  return liste[liste.length - 1][0]
}

/**
 * Sème le décor : des essais au hasard (graine fixe), gardés seulement loin de la route, des nœuds,
 * des vignettes, des bandes réservées (rivière) et des autres éléments. Rangé de haut en bas, pour que le plus bas passe devant.
 */
export function semerDecor(
  noeuds: Point[],
  etapes: Point[],
  largeur: number,
  hauteur: number,
  { graine = 7, essais = 1400, bandes = [] }: { graine?: number; essais?: number; bandes?: { y: number; demi: number }[] } = {},
): ElementDecor[] {
  const hasard = aleatoire(graine)
  const route = pointsDeLaRoute(noeuds, 24)
  const vignettes = etapes.map((e, i) => placeVignette(e, i, largeur))
  const ys = etapes.map((e) => e.y)
  const poses: ElementDecor[] = []
  for (let k = 0; k < essais; k++) {
    const x = 10 + hasard() * (largeur - 20)
    const y = 14 + hasard() * (hauteur - 28)
    const type = tirer(FLORE[regionDe(y, ys)], hasard())
    const miroir = hasard() < 0.5
    const echelle = 0.8 + hasard() * 0.35
    const r = RAYONS[type] * echelle
    if (x - r < 2 || x + r > largeur - 2) continue
    if (route.some((p) => Math.hypot(p.x - x, p.y - y) < 18 + r)) continue
    if (noeuds.some((n) => Math.hypot(n.x - x, n.y - y) < 50 + r)) continue
    // Étiquette de la ville, sous son étape.
    if (etapes.some((e) => Math.abs(e.x - x) < 78 + r && y > e.y && y < e.y + 84 + r)) continue
    if (vignettes.some((v) => dansVignette({ x, y }, v, r))) continue
    // Bandes réservées (rivière) : rien dedans.
    if (bandes.some((b) => Math.abs(b.y - y) < b.demi + r)) continue
    if (poses.some((p) => Math.hypot(p.x - x, p.y - y) < RAYONS[p.type] * p.echelle + r + 4)) continue
    poses.push({ type, x, y, miroir, echelle })
  }
  return poses.sort((a, b) => a.y - b.y)
}
