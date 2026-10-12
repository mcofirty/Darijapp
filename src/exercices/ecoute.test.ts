import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { PAUSE_REPETITION, dureeApproximative, dureeEnMinutes, motsVusAEcouter, programmeDuMot } from './ecoute'

describe('programmeDuMot', () => {
  it('darija, pause pour répéter, darija ralenti, puis français', () => {
    expect(programmeDuMot({ repeter: true, francais: true }).map((p) => p.type)).toEqual([
      'darija',
      'pause',
      'darija',
      'pause',
      'francais',
      'pause',
    ])
    expect(programmeDuMot({ repeter: true, francais: true })[2]).toEqual({ type: 'darija', lent: true })
  })

  it('sans répétition ni français : le darija et le temps de le répéter', () => {
    expect(programmeDuMot({ repeter: false, francais: false })).toEqual([
      { type: 'darija', lent: false },
      { type: 'pause', ms: PAUSE_REPETITION },
    ])
  })
})

describe('durée', () => {
  it('augmente avec les options et s’affiche en minutes', () => {
    const court = dureeApproximative(30, { repeter: false, francais: false })
    const long = dureeApproximative(30, { repeter: true, francais: true })
    expect(long).toBeGreaterThan(court)
    expect(dureeEnMinutes(long)).toMatch(/^environ \d+ min$/)
    expect(dureeEnMinutes(1000)).toBe('environ 1 min')
  })
})

describe('motsVusAEcouter', () => {
  it('les moins sus d’abord, sans les mots disparus, dans la limite', () => {
    const progressions = [
      { id: MOTS[0].id, boite: 4, echecs: 0 },
      { id: MOTS[1].id, boite: 1, echecs: 1 },
      { id: 'disparu-001', boite: 1, echecs: 9 },
      { id: MOTS[2].id, boite: 1, echecs: 3 },
    ]
    expect(motsVusAEcouter(progressions, MOTS).map((m) => m.id)).toEqual([MOTS[2].id, MOTS[1].id, MOTS[0].id])
    expect(motsVusAEcouter(progressions, MOTS, 1)).toHaveLength(1)
  })
})
