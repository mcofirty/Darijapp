import { describe, expect, it } from 'vitest'
import { BADGES, acquisVerifies, rangBadge } from './collection'
import { nouveauPalierFlamme, palierFlamme } from './serie'

describe('palierFlamme', () => {
  it('suit les seuils de 3, 7, 30 et 100 jours', () => {
    expect(palierFlamme(0)).toBe('eteinte')
    expect(palierFlamme(1)).toBe('braise')
    expect(palierFlamme(2)).toBe('braise')
    expect(palierFlamme(3)).toBe('flamme')
    expect(palierFlamme(6)).toBe('flamme')
    expect(palierFlamme(7)).toBe('brasier')
    expect(palierFlamme(29)).toBe('brasier')
    expect(palierFlamme(30)).toBe('soleil')
    expect(palierFlamme(100)).toBe('legende')
    expect(palierFlamme(365)).toBe('legende')
  })
})

describe('nouveauPalierFlamme', () => {
  it('fête un seuil atteint par la première activité du jour', () => {
    expect(nouveauPalierFlamme(7, true)?.palier).toBe('brasier')
    expect(nouveauPalierFlamme(3, true)?.palier).toBe('flamme')
  })
  it('rien entre deux seuils, ni pour une deuxième activité, ni pour le premier jour', () => {
    expect(nouveauPalierFlamme(8, true)).toBeNull()
    expect(nouveauPalierFlamme(7, false)).toBeNull()
    expect(nouveauPalierFlamme(1, true)).toBeNull()
  })
})

describe('acquisVerifies', () => {
  it('ne compte que les mots retrouvés en révision (boîte 3 ou plus)', () => {
    expect(acquisVerifies([{ boite: 1 }, { boite: 2 }, { boite: 3 }, { boite: 4 }])).toBe(2)
    expect(acquisVerifies([])).toBe(0)
  })
})

describe('rangBadge', () => {
  const badge = (id: string) => BADGES.find((b) => b.id === id)!
  it('monte du bronze au platine dans une même mesure', () => {
    expect(rangBadge(badge('mots-10'))).toBe(0)
    expect(rangBadge(badge('mots-1000'))).toBe(3)
    expect(rangBadge(badge('serie-3'))).toBe(0)
    expect(rangBadge(badge('serie-100'))).toBe(3)
  })
  it('un rang ne descend jamais quand le seuil monte', () => {
    for (const b of BADGES) {
      const memes = BADGES.filter((x) => x.mesure === b.mesure && x.seuil > b.seuil)
      for (const x of memes) expect(rangBadge(x)).toBeGreaterThanOrEqual(rangBadge(b))
    }
  })
})
