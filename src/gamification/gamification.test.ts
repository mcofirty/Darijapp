import { describe, expect, it } from 'vitest'
import { calculerSerie } from './serie'
import { NOMS_PALIERS, niveauDepuisXp, nomDuNiveau, xpDeSession, xpDuNiveau } from './xp'

describe('xp', () => {
  it('compte 1 XP par bonne réponse, 10 par session et 5 sans faute', () => {
    expect(xpDeSession(12, false)).toBe(22)
    expect(xpDeSession(12, true)).toBe(27)
  })

  it('suit la progression 60, 70, puis +10 par niveau', () => {
    expect([1, 2, 3, 4].map(xpDuNiveau)).toEqual([60, 70, 80, 90])
  })

  it('demande environ 6 000 XP pour les 30 paliers', () => {
    const total = Array.from({ length: 30 }, (_, i) => xpDuNiveau(i + 1)).reduce((a, b) => a + b, 0)
    expect(total).toBe(6150)
    expect(niveauDepuisXp(total).niveau).toBe(31)
  })

  it('calcule le niveau et l’avancée dans le niveau', () => {
    expect(niveauDepuisXp(0)).toEqual({ niveau: 1, nom: 'Terre sèche', xp: 0, objectif: 60 })
    expect(niveauDepuisXp(59).niveau).toBe(1)
    expect(niveauDepuisXp(60)).toEqual({ niveau: 2, nom: 'Terre arrosée', xp: 0, objectif: 70 })
    expect(niveauDepuisXp(150)).toEqual({ niveau: 3, nom: 'Terre prête', xp: 20, objectif: 80 })
  })

  it('a 30 paliers nommés, puis reste « Arbre centenaire »', () => {
    expect(NOMS_PALIERS).toHaveLength(30)
    expect(new Set(NOMS_PALIERS).size).toBe(30)
    expect(nomDuNiveau(30)).toBe('Arbre centenaire')
    expect(nomDuNiveau(45)).toBe('Arbre centenaire')
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
