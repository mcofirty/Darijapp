import { describe, expect, it } from 'vitest'
import { etirement, grossissement, ongletLePlusProche, positionSousLeDoigt, sensDuBalayage } from './glisser'

describe('positionSousLeDoigt', () => {
  it('place le centre de chaque onglet sur un entier', () => {
    // 5 onglets de 100 px à partir de x = 0 : centres à 50, 150, 250…
    expect(positionSousLeDoigt(50, 0, 500, 5)).toBe(0)
    expect(positionSousLeDoigt(250, 0, 500, 5)).toBe(2)
    expect(positionSousLeDoigt(300, 0, 500, 5)).toBe(2.5)
  })

  it('reste dans les bornes', () => {
    expect(positionSousLeDoigt(-40, 0, 500, 5)).toBe(0)
    expect(positionSousLeDoigt(900, 0, 500, 5)).toBe(4)
  })
})

describe('ongletLePlusProche', () => {
  it('arrondit et borne', () => {
    expect(ongletLePlusProche(1.4, 5)).toBe(1)
    expect(ongletLePlusProche(1.6, 5)).toBe(2)
    expect(ongletLePlusProche(7, 5)).toBe(4)
  })
})

describe('effets de la lentille', () => {
  it('s’étire avec la vitesse, sans dépasser 1,35', () => {
    expect(etirement(0)).toBe(1)
    expect(etirement(0.005)).toBeCloseTo(1.2)
    expect(etirement(-1)).toBe(1.35)
  })

  it('grossit l’icône sous la lentille et pas les autres', () => {
    expect(grossissement(0)).toBeCloseTo(1.15)
    expect(grossissement(0.5)).toBeCloseTo(1.075)
    expect(grossissement(2)).toBe(1)
  })
})

describe('sensDuBalayage', () => {
  it('va à l’onglet suivant en balayant vers la gauche', () => {
    expect(sensDuBalayage(-120, 10, 250)).toBe(1)
  })

  it('va à l’onglet précédent en balayant vers la droite', () => {
    expect(sensDuBalayage(120, 10, 250)).toBe(-1)
  })

  it('ignore les gestes courts, verticaux ou lents', () => {
    expect(sensDuBalayage(-30, 0, 200)).toBe(0)
    expect(sensDuBalayage(-100, 90, 200)).toBe(0)
    expect(sensDuBalayage(-100, 0, 1200)).toBe(0)
  })
})
