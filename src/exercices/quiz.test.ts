import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import type { EtatSrs } from '../srs/leitner'
import { QUESTIONS_PAR_QUIZ, apresExpress, composerQuiz, motsPourQuiz, questionExpress } from './quiz'

function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

const etat = (id: string, boite: number, echecs = 0, prochaineRevision = '2026-10-12'): EtatSrs => ({
  id,
  boite,
  prochaineRevision,
  reussites: 0,
  echecs,
})

describe('motsPourQuiz', () => {
  it('interroge d’abord les mots les moins sus', () => {
    const progressions = [etat(MOTS[0].id, 4), etat(MOTS[1].id, 1, 0), etat(MOTS[2].id, 1, 3), etat(MOTS[3].id, 2)]
    expect(motsPourQuiz(progressions, MOTS, 4).map((m) => m.id)).toEqual([MOTS[2].id, MOTS[1].id, MOTS[3].id, MOTS[0].id])
  })

  it('complète avec le programme, dans l’ordre, sans doublon', () => {
    const mots = motsPourQuiz([etat(MOTS[5].id, 1)], MOTS, 4)
    expect(mots.map((m) => m.id)).toEqual([MOTS[5].id, MOTS[0].id, MOTS[1].id, MOTS[2].id])
  })

  it('ignore une progression dont le mot n’existe plus', () => {
    expect(motsPourQuiz([etat('disparu-001', 1)], MOTS, 2).map((m) => m.id)).toEqual([MOTS[0].id, MOTS[1].id])
  })
})

describe('composerQuiz', () => {
  it('pose 5 questions, dont une d’association par paires jamais en premier', () => {
    for (let g = 1; g < 30; g++) {
      const etapes = composerQuiz(MOTS.slice(0, 8), MOTS, graine(g))
      expect(etapes).toHaveLength(QUESTIONS_PAR_QUIZ)
      expect(etapes.filter((e) => e.type === 'paires')).toHaveLength(1)
      expect(etapes[0].type).not.toBe('paires')
      expect(etapes.some((e) => e.type === 'ecoute')).toBe(true)
      expect(etapes.some((e) => e.type === 'traduis')).toBe(true)
    }
  })

  it('n’interroge jamais deux fois le même mot', () => {
    const etapes = composerQuiz(MOTS.slice(0, 8), MOTS, graine(4))
    const ids = etapes.flatMap((e) => (e.type === 'paires' ? e.mots.map((m) => m.id) : e.type === 'decouverte' ? [] : [e.mot.id]))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('se passe des paires quand il y a trop peu de mots', () => {
    const etapes = composerQuiz(MOTS.slice(0, 4), MOTS, graine(2))
    expect(etapes.map((e) => e.type).every((t) => t === 'ecoute' || t === 'traduis')).toBe(true)
  })
})

describe('questionExpress', () => {
  it('ne repose pas deux fois de suite le même mot', () => {
    const candidats = MOTS.slice(0, 3)
    for (let g = 1; g < 50; g++) {
      const q = questionExpress(candidats, MOTS, MOTS[0].id, graine(g))
      expect(q.type === 'ecoute' || q.type === 'traduis').toBe(true)
      if (q.type === 'ecoute' || q.type === 'traduis') {
        expect(q.mot.id).not.toBe(MOTS[0].id)
        expect(q.choix.map((c) => c.id)).toContain(q.mot.id)
      }
    }
  })
})

describe('apresExpress', () => {
  it('garde le meilleur score', () => {
    expect(apresExpress(12, 10)).toEqual({ record: 12, nouveauRecord: true })
    expect(apresExpress(10, 10)).toEqual({ record: 10, nouveauRecord: false })
    expect(apresExpress(3, 10)).toEqual({ record: 10, nouveauRecord: false })
  })
})
