import { describe, expect, it } from 'vitest'
import { croissance, etapesDeCroissance, palierDe, taille } from './jardin'

describe('croissance', () => {
  it('commence au Terreau, terre sèche', () => {
    expect(croissance(0)).toEqual({
      stade: 1,
      nom: 'Terreau',
      niveau: 1,
      palier: 1,
      nomPalier: 'Terre sèche',
      avancement: 0,
      avancementPalier: 0,
      prochain: 'Terre arrosée',
      xpRestants: 60,
    })
  })

  it('chaque palier occupe un tiers du stade', () => {
    expect(croissance(30)).toMatchObject({ palier: 1, avancementPalier: 0.5, avancement: 0.5 / 3 })
    expect(croissance(60)).toMatchObject({ stade: 1, palier: 2, nomPalier: 'Terre arrosée', avancement: 1 / 3 })
    // 60 + 70 + 80 = 210 XP : stade 2, premier palier.
    expect(croissance(210)).toMatchObject({ stade: 2, nom: 'Graine', niveau: 4, palier: 1, nomPalier: 'Graine semée', avancement: 0 })
  })

  it('reste un arbre centenaire après le 30e palier', () => {
    expect(croissance(7000)).toMatchObject({ stade: 10, niveau: 30, palier: 3, nomPalier: 'Arbre centenaire', prochain: null, avancement: 1, xpRestants: 0 })
  })
})

describe('palierDe', () => {
  it('découpe le stade en trois', () => {
    expect([0, 0.2, 1 / 3, 0.5, 2 / 3, 0.99, 1].map(palierDe)).toEqual([1, 1, 2, 2, 3, 3, 3])
  })
})

describe('taille', () => {
  it('grandit sans à-coup de 0 à 1', () => {
    let avant = -1
    for (let xp = 0; xp < 7000; xp += 10) {
      const t = taille(croissance(xp))
      expect(t).toBeGreaterThanOrEqual(avant)
      expect(t).toBeLessThanOrEqual(1)
      avant = t
    }
    expect(taille({ stade: 1, avancement: 0 })).toBe(0)
    expect(taille({ stade: 10, avancement: 1 })).toBe(1)
  })
})

describe('etapesDeCroissance', () => {
  it('pousse dans le même palier', () => {
    expect(etapesDeCroissance(0, 30)).toEqual([{ stade: 1, palier: 1, de: 0, a: 0.5 / 3 }])
  })

  it('finit le palier, traverse les suivants, puis pousse dans le nouveau', () => {
    // 30 XP : moitié du 1er palier ; 210 + 45 = 255 XP : moitié du 4e palier (90 XP), au stade 2.
    const etapes = etapesDeCroissance(30, 255)
    expect(etapes.map((e) => [e.stade, e.palier])).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 1],
    ])
    expect(etapes[0].de).toBeCloseTo(0.5 / 3)
    expect(etapes[0].a).toBeCloseTo(1 / 3)
    expect(etapes[2].a).toBeCloseTo(1)
    expect(etapes[3].de).toBeCloseTo(0)
    expect(etapes[3].a).toBeCloseTo(0.5 / 3)
  })

  it('rien à animer sans XP nouveaux', () => {
    expect(etapesDeCroissance(200, 200)).toEqual([])
    expect(etapesDeCroissance(300, 100)).toEqual([])
  })
})
