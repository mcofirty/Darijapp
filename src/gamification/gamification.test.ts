import { describe, expect, it } from 'vitest'
import { calculerSerie } from './serie'
import { niveauDepuisXp, nomDuNiveau, xpDeSession, xpDuNiveau } from './xp'

describe('xp', () => {
  it('compte 1 XP par bonne réponse, 10 par session et 5 sans faute', () => {
    expect(xpDeSession(12, false)).toBe(22)
    expect(xpDeSession(12, true)).toBe(27)
  })

  it('suit la progression 120, 140, puis +20 par niveau', () => {
    expect([1, 2, 3, 4].map(xpDuNiveau)).toEqual([120, 140, 160, 180])
  })

  it('calcule le niveau et l’avancée dans le niveau', () => {
    expect(niveauDepuisXp(0)).toEqual({ niveau: 1, nom: 'Terreau', xp: 0, objectif: 120 })
    expect(niveauDepuisXp(119).niveau).toBe(1)
    expect(niveauDepuisXp(120)).toEqual({ niveau: 2, nom: 'Graine', xp: 0, objectif: 140 })
    expect(niveauDepuisXp(300)).toEqual({ niveau: 3, nom: 'Germe', xp: 40, objectif: 160 })
  })

  it('reste « Arbre » au-delà du dernier nom', () => {
    expect(nomDuNiveau(10)).toBe('Arbre')
    expect(nomDuNiveau(25)).toBe('Arbre')
  })
})

describe('calculerSerie', () => {
  const J = '2026-10-12'

  it('vaut 0 sans pratique', () => {
    expect(calculerSerie([], J)).toEqual({ jours: 0, aujourdhui: false })
  })

  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    expect(calculerSerie(['2026-10-10', '2026-10-11', '2026-10-12'], J)).toEqual({ jours: 3, aujourdhui: true })
  })

  it('ne casse pas la série si aujourd’hui n’est pas encore fait', () => {
    expect(calculerSerie(['2026-10-10', '2026-10-11'], J)).toEqual({ jours: 2, aujourdhui: false })
  })

  it('pardonne une journée manquée', () => {
    expect(calculerSerie(['2026-10-09', '2026-10-10', '2026-10-12'], J).jours).toBe(3)
  })

  it('casse après deux jours manqués d’affilée', () => {
    expect(calculerSerie(['2026-10-08', '2026-10-09', '2026-10-12'], J).jours).toBe(1)
  })

  it('ne pardonne pas deux journées manquées dans la même semaine', () => {
    // manqués : le 11 (pardonné) et le 8 (trop proche) → la série s'arrête au 9
    expect(calculerSerie(['2026-10-06', '2026-10-07', '2026-10-09', '2026-10-10', '2026-10-12'], J).jours).toBe(3)
  })

  it('pardonne de nouveau une semaine plus tard', () => {
    const jours = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07',
      '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-12']
    // manqués : le 11 et le 4, à 7 jours d'écart
    expect(calculerSerie(jours, J).jours).toBe(10)
  })
})
