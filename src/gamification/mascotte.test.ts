import { describe, expect, it } from 'vitest'
import { PHRASES_MASCOTTE, humeurDuBilan, phraseMascotte } from './mascotte'

describe('mascotte', () => {
  it('a des phrases pour chaque humeur', () => {
    for (const h of ['bravo', 'rate', 'fete', 'encourage', 'salut'] as const) expect(PHRASES_MASCOTTE[h].length).toBeGreaterThan(0)
  })

  it('tire une phrase de l’humeur demandée, même au bord du hasard', () => {
    expect(PHRASES_MASCOTTE.rate).toContain(phraseMascotte('rate', () => 0))
    expect(PHRASES_MASCOTTE.rate).toContain(phraseMascotte('rate', () => 0.9999))
    expect(PHRASES_MASCOTTE.rate).toContain(phraseMascotte('rate', () => 1))
  })

  it('fête un bon bilan et encourage sinon', () => {
    expect(humeurDuBilan(1)).toBe('fete')
    expect(humeurDuBilan(0.8)).toBe('fete')
    expect(humeurDuBilan(0.5)).toBe('encourage')
    expect(humeurDuBilan(undefined)).toBe('fete')
  })
})
