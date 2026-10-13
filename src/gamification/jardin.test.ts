import { describe, expect, it } from 'vitest'
import { croissance, taille } from './jardin'

describe('croissance', () => {
  it('commence au Terreau, sans rien', () => {
    expect(croissance(0)).toEqual({ stade: 1, nom: 'Terreau', avancement: 0, prochain: 'Graine', xpRestants: 120 })
  })

  it('avance dans le niveau puis passe au stade suivant', () => {
    expect(croissance(60).avancement).toBe(0.5)
    expect(croissance(120)).toMatchObject({ stade: 2, nom: 'Graine', avancement: 0 })
  })

  it('reste un arbre après le dixième niveau', () => {
    const tout = Array.from({ length: 12 }, (_, i) => 120 + 20 * i).reduce((a, b) => a + b, 0)
    expect(croissance(tout)).toMatchObject({ stade: 10, nom: 'Arbre', prochain: null, avancement: 1, xpRestants: 0 })
  })
})

describe('taille', () => {
  it('grandit sans à-coup de 0 à 1', () => {
    let avant = -1
    for (let xp = 0; xp < 3000; xp += 10) {
      const t = taille(croissance(xp))
      expect(t).toBeGreaterThanOrEqual(avant)
      expect(t).toBeLessThanOrEqual(1)
      avant = t
    }
    expect(taille({ stade: 1, avancement: 0 })).toBe(0)
    expect(taille({ stade: 10, avancement: 1 })).toBe(1)
  })
})
