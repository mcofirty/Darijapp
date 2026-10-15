import { describe, expect, it } from 'vitest'
import { RAYONS, aleatoire, cheminDeLaRoute, dansVignette, placeVignette, pointsDeLaRoute, regionDe, semerDecor } from './decor'

const noeuds = [
  { x: 180, y: 84 },
  { x: 250, y: 242 },
  { x: 280, y: 300 },
  { x: 180, y: 458 },
]
const etapes = [noeuds[0], noeuds[2]]

describe('aleatoire', () => {
  it('donne la même suite pour la même graine, entre 0 et 1', () => {
    const a = aleatoire(3)
    const b = aleatoire(3)
    const suite = Array.from({ length: 20 }, () => a())
    expect(suite).toEqual(Array.from({ length: 20 }, () => b()))
    expect(suite.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('route', () => {
  it('le chemin part du premier nœud et passe par chacun', () => {
    const d = cheminDeLaRoute(noeuds)
    expect(d.startsWith('M180 84')).toBe(true)
    for (const n of noeuds.slice(1)) expect(d).toContain(`${n.x} ${n.y}`)
  })
  it('les points de la route relient les nœuds, extrémités comprises', () => {
    const points = pointsDeLaRoute(noeuds, 8)
    expect(points).toHaveLength(1 + 3 * 8)
    expect(points[8]).toEqual(noeuds[1])
    expect(points.at(-1)).toEqual(noeuds[3])
  })
})

describe('placeVignette', () => {
  it('de l’autre côté de la route que l’étape', () => {
    expect(placeVignette({ x: 80, y: 100 }, 3, 360).x).toBe(210)
    expect(placeVignette({ x: 280, y: 100 }, 1, 360).x).toBe(150)
    expect(placeVignette({ x: 180, y: 100 }, 0, 360)).toEqual({ x: 72, y: 116 })
    expect(placeVignette({ x: 180, y: 100 }, 2, 360).x).toBe(288)
  })
})

describe('regionDe', () => {
  const ys = [0, 100, 200, 300, 400, 500, 600, 700, 800, 1000]
  it('la région de l’étape la plus proche', () => {
    expect(regionDe(10, ys)).toBe('nord')
    expect(regionDe(210, ys)).toBe('rif')
    expect(regionDe(690, ys)).toBe('marrakech')
    expect(regionDe(990, ys)).toBe('desert')
  })
  it('le Haut Atlas entre Essaouira et Merzouga', () => {
    expect(regionDe(900, ys)).toBe('atlas')
    expect(regionDe(820, ys)).toBe('argan')
  })
})

describe('semerDecor', () => {
  const tous = semerDecor(noeuds, etapes, 360, 540)
  it('toujours le même décor', () => {
    expect(semerDecor(noeuds, etapes, 360, 540)).toEqual(tous)
    expect(tous.length).toBeGreaterThan(15)
  })
  it('rien sur la route, les nœuds, les vignettes ni hors de la carte, rangé de haut en bas', () => {
    const route = pointsDeLaRoute(noeuds, 24)
    for (const e of tous) {
      const r = RAYONS[e.type] * e.echelle
      expect(route.every((p) => Math.hypot(p.x - e.x, p.y - e.y) >= 18 + r)).toBe(true)
      expect(noeuds.every((n) => Math.hypot(n.x - e.x, n.y - e.y) >= 50 + r)).toBe(true)
      expect(etapes.every((v, i) => !dansVignette(e, placeVignette(v, i, 360)))).toBe(true)
      expect(e.x - r).toBeGreaterThanOrEqual(2)
      expect(e.x + r).toBeLessThanOrEqual(358)
    }
    expect(tous.map((e) => e.y)).toEqual([...tous.map((e) => e.y)].sort((a, b) => a - b))
  })
})

describe('semerDecor, bandes réservées', () => {
  it('rien dans la rivière', () => {
    const decor = semerDecor(noeuds, etapes, 360, 540, { bandes: [{ y: 380, demi: 12 }] })
    expect(decor.every((e) => Math.abs(e.y - 380) >= 12 + RAYONS[e.type] * e.echelle)).toBe(true)
  })
})
