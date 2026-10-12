import { describe, expect, it } from 'vitest'
import { BADGES, compterCollection, maitrise, type StatsBadges } from './collection'
import { meilleureSerie, septDerniersJours } from './serie'

describe('collection', () => {
  it('bronze vu, argent en boîte 3, or en boîte 4', () => {
    expect([1, 2, 3, 4].map(maitrise)).toEqual(['bronze', 'bronze', 'argent', 'or'])
    expect(compterCollection([{ boite: 1 }, { boite: 2 }, { boite: 3 }, { boite: 4 }, { boite: 4 }])).toEqual({ bronze: 2, argent: 1, or: 2 })
  })
})

describe('badges', () => {
  const zero: StatsBadges = { motsVus: 0, motsOr: 0, meilleureSerie: 0, activites: 0, sansFaute: 0, recordExpress: 0, recordSons: 0 }

  it('aucun badge au départ, tous avec tout', () => {
    expect(BADGES.filter((b) => b.obtenu(zero))).toEqual([])
    const tout: StatsBadges = { motsVus: 300, motsOr: 50, meilleureSerie: 30, activites: 9, sansFaute: 1, recordExpress: 15, recordSons: 20 }
    expect(BADGES.every((b) => b.obtenu(tout))).toBe(true)
  })

  it('identifiants uniques', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
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
