import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { PAIRES_SONS } from '../data/pairesSons'
import { MINUTES_DE_PAUSE, adapterEtapes, finDePause, modesActifs, prochaineFinDePause } from './modes'
import { QUESTIONS_PAR_QUIZ, composerQuiz } from './quiz'
import { DIRE_PAR_SESSION, composerSession } from './session'

function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

const reglage = { parler: true, ecouter: true, pauseParler: null, pauseEcouter: null }
const maintenant = 1_760_300_000_000

describe('modesActifs', () => {
  it('suit le réglage du Profil', () => {
    expect(modesActifs(reglage, maintenant)).toEqual({ parler: true, ecouter: true })
    expect(modesActifs({ ...reglage, parler: false }, maintenant)).toEqual({ parler: false, ecouter: true })
    expect(modesActifs({ ...reglage, ecouter: false }, maintenant)).toEqual({ parler: true, ecouter: false })
  })

  it('coupe un mode pendant sa pause, puis le rend', () => {
    const fin = finDePause(maintenant)
    expect(fin - maintenant).toBe(MINUTES_DE_PAUSE * 60_000)
    expect(modesActifs({ ...reglage, pauseParler: fin }, maintenant + 1000)).toEqual({ parler: false, ecouter: true })
    expect(modesActifs({ ...reglage, pauseEcouter: fin }, fin - 1)).toEqual({ parler: true, ecouter: false })
    expect(modesActifs({ ...reglage, pauseParler: fin, pauseEcouter: fin }, fin)).toEqual({ parler: true, ecouter: true })
  })
})

describe('prochaineFinDePause', () => {
  it('donne la fin de pause la plus proche encore à venir', () => {
    expect(prochaineFinDePause(reglage, maintenant)).toBeNull()
    expect(prochaineFinDePause({ ...reglage, pauseParler: maintenant + 5000, pauseEcouter: maintenant + 2000 }, maintenant)).toBe(maintenant + 2000)
    expect(prochaineFinDePause({ ...reglage, pauseParler: maintenant - 1, pauseEcouter: maintenant + 2000 }, maintenant)).toBe(maintenant + 2000)
  })
})

describe('adapterEtapes', () => {
  const etapes = composerSession(MOTS.slice(0, 5), MOTS.slice(20, 28), MOTS, graine(4), PAIRES_SONS, DIRE_PAR_SESSION, {
    phrase: true,
    connus: new Set(MOTS.slice(20, 28).map((m) => m.id)),
  })

  it('ne change rien avec tous les modes', () => {
    expect(adapterEtapes(etapes, { parler: true, ecouter: true })).toEqual(etapes)
  })

  it('sans parler : plus aucun Dis-le, le reste dans le même ordre', () => {
    const adaptees = adapterEtapes(etapes, { parler: false, ecouter: true })
    expect(etapes.some((e) => e.type === 'disle')).toBe(true)
    expect(adaptees.some((e) => e.type === 'disle')).toBe(false)
    expect(adaptees).toEqual(etapes.filter((e) => e.type !== 'disle'))
  })

  it('sans écouter : Écoute et choisis devient Traduis, Distingue les sons disparaît, la phrase reste', () => {
    const adaptees = adapterEtapes(etapes, { parler: true, ecouter: false })
    expect(adaptees.some((e) => e.type === 'ecoute' || e.type === 'distingue')).toBe(false)
    expect(adaptees.some((e) => e.type === 'phrase')).toBe(true)
    const avant = etapes.filter((e) => e.type !== 'distingue')
    expect(adaptees).toHaveLength(avant.length)
    avant.forEach((e, i) => {
      if (e.type === 'ecoute') expect(adaptees[i]).toEqual({ ...e, type: 'traduis' })
      else expect(adaptees[i]).toBe(e)
    })
  })
})

describe('quiz sans parler ni écouter', () => {
  it('garde 5 questions, avec des Traduis à la place', () => {
    for (let g = 1; g < 20; g++) {
      const etapes = adapterEtapes(composerQuiz(MOTS.slice(0, 12), MOTS, graine(g), [], false), { parler: false, ecouter: false })
      expect(etapes).toHaveLength(QUESTIONS_PAR_QUIZ)
      expect(etapes.every((e) => e.type === 'traduis' || e.type === 'paires')).toBe(true)
    }
  })
})
