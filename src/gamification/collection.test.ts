import { describe, expect, it } from 'vitest'
import { BADGES, FAMILLES_BADGES, avancementBadge, badgeObtenu, compterCollection, maitrise, type StatsBadges } from './collection'
import { meilleureSerie, septDerniersJours } from './serie'

describe('collection', () => {
  it('bronze vu, argent en boîte 3, or en boîte 4', () => {
    expect([1, 2, 3, 4].map(maitrise)).toEqual(['bronze', 'bronze', 'argent', 'or'])
    expect(compterCollection([{ boite: 1 }, { boite: 2 }, { boite: 3 }, { boite: 4 }, { boite: 4 }])).toEqual({ bronze: 2, argent: 1, or: 2 })
  })
})

describe('badges', () => {
  const cles = [...new Set(BADGES.map((b) => b.mesure))]
  const avec = (n: number) => Object.fromEntries(cles.map((c) => [c, n])) as unknown as StatsBadges

  it('aucun badge au départ, tous au bout du compte', () => {
    expect(BADGES.filter((b) => badgeObtenu(b, avec(0)))).toEqual([])
    expect(BADGES.every((b) => badgeObtenu(b, avec(100000)))).toBe(true)
  })

  it('plus de 50 badges, au moins 3 par famille, identifiants uniques', () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(50)
    for (const f of FAMILLES_BADGES) expect(BADGES.filter((b) => b.famille === f.id).length, f.id).toBeGreaterThanOrEqual(3)
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
  })

  it('dans une famille, une même mesure a des seuils croissants', () => {
    for (const c of cles) {
      const seuils = BADGES.filter((b) => b.mesure === c).map((b) => b.seuil)
      expect(seuils, c).toEqual([...seuils].sort((a, b) => a - b))
    }
  })

  it('l’avancée vers un badge va de 0 à 1', () => {
    const b = BADGES.find((x) => x.id === 'mots-50')!
    expect(avancementBadge(b, { ...avec(0), motsVus: 20 })).toBeCloseTo(0.4)
    expect(avancementBadge(b, { ...avec(0), motsVus: 80 })).toBe(1)
  })
})

describe('meilleureSerie', () => {
  it('garde la plus longue suite de jours consécutifs', () => {
    expect(meilleureSerie([])).toBe(0)
    expect(meilleureSerie(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06'])).toBe(3)
    expect(meilleureSerie(['2026-10-30', '2026-10-31', '2026-11-01'])).toBe(3)
  })
})

describe('septDerniersJours', () => {
  it('7 jours jusqu’à aujourd’hui, avec les initiales et les jours pratiqués', () => {
    const semaine = septDerniersJours(['2026-10-12', '2026-10-10'], '2026-10-13')
    expect(semaine.map((j) => j.date)).toEqual([
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
    ])
    // Le 13 octobre 2026 est un mardi.
    expect(semaine.map((j) => j.lettre).join('')).toBe('MJVSDLM')
    expect(semaine.filter((j) => j.fait).map((j) => j.date)).toEqual(['2026-10-10', '2026-10-12'])
    expect(semaine[6].aujourdhui).toBe(true)
  })
})
