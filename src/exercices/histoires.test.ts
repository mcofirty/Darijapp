import { describe, expect, it } from 'vitest'
import { HISTOIRES, deroule, reponsesMelangees } from './histoires'

describe('histoires', () => {
  it('ont des identifiants et des MP3 au bon format', () => {
    expect(new Set(HISTOIRES.map((h) => h.id)).size).toBe(HISTOIRES.length)
    for (const h of HISTOIRES)
      h.lignes.forEach((l, i) => {
        expect(l.id).toBe(`his-${h.id}-${i + 1}`)
        expect(l.audio).toBe(`audio/${l.id}.mp3`)
        expect(l.qui.trim()).not.toBe('')
        expect(l.image.trim()).not.toBe('')
      })
  })

  it('posent au moins 2 questions à 4 réponses différentes, après une ligne existante', () => {
    for (const h of HISTOIRES) {
      expect(h.questions.length).toBeGreaterThanOrEqual(2)
      for (const q of h.questions) {
        expect(q.apres).toBeGreaterThanOrEqual(0)
        expect(q.apres).toBeLessThan(h.lignes.length)
        expect(new Set(q.choix).size).toBe(4)
        expect(q.choix[q.bonne]).toBeDefined()
      }
    }
  })

  it('déroule chaque question juste après sa ligne', () => {
    const h = HISTOIRES[0]
    const d = deroule(h)
    expect(d.filter((m) => m.type === 'ligne')).toHaveLength(h.lignes.length)
    expect(d.filter((m) => m.type === 'question')).toHaveLength(h.questions.length)
    const premiere = d.findIndex((m) => m.type === 'question')
    expect(d[premiere - 1]).toEqual({ type: 'ligne', index: h.questions[0].apres })
  })

  it('mélange les réponses sans perdre la bonne', () => {
    const q = HISTOIRES[0].questions[0]
    for (const graine of [0.1, 0.5, 0.9]) {
      const { choix, bonne } = reponsesMelangees(q, () => graine)
      expect([...choix].sort()).toEqual([...q.choix].sort())
      expect(choix[bonne]).toBe(q.choix[q.bonne])
    }
  })
})
