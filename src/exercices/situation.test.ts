import { describe, expect, it } from 'vitest'
import { THEMES } from '../data/themes'
import { SITUATIONS, SITUATION_LIBRE, dureeEstimee, situationDuPlan } from './situation'

describe('situationDuPlan', () => {
  it('prend le thème du premier nouveau mot', () => {
    expect(situationDuPlan({ nouveaux: [{ theme: 'nourriture' }, { theme: 'souk' }], revisions: [{ theme: 'chiffres' }] })).toEqual(SITUATIONS.nourriture)
  })
  it('sinon celui de la première révision', () => {
    expect(situationDuPlan({ nouveaux: [], revisions: [{ theme: 'transports' }] })).toEqual(SITUATIONS.transports)
  })
  it('rien à faire : pas de situation', () => {
    expect(situationDuPlan({ nouveaux: [], revisions: [] })).toBeNull()
  })
  it('thème inconnu (mot ajouté) : situation de repli', () => {
    expect(situationDuPlan({ nouveaux: [{ theme: 'perso' }], revisions: [] })).toBe(SITUATION_LIBRE)
  })
  it('chaque thème du programme a sa situation, tutoyée et sans majuscule', () => {
    for (const t of THEMES) {
      const s = SITUATIONS[t.id]
      expect(s, t.id).toBeDefined()
      expect(s.texte[0]).toBe(s.texte[0].toLowerCase())
      expect(s.texte).not.toMatch(/(^|\s)(vous|votre|vos)(\s|$)/)
    }
    expect(Object.keys(SITUATIONS).sort()).toEqual(THEMES.map((t) => t.id).sort())
  })
})

describe('dureeEstimee', () => {
  it('5 nouveaux mots : environ 3 minutes', () => {
    expect(dureeEstimee(5, 0)).toBe(3)
  })
  it('session pleine (5 nouveaux, 8 révisions) : environ 6 minutes', () => {
    expect(dureeEstimee(5, 8)).toBe(6)
  })
  it('jamais moins de 2 minutes', () => {
    expect(dureeEstimee(0, 1)).toBe(2)
    expect(dureeEstimee(0, 0)).toBe(2)
  })
})
