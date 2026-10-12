import { describe, expect, it } from 'vitest'
import { MOTS_SONS, PAIRES_SONS } from './pairesSons'
import { validerMot } from './motsPerso'

describe('paires de « Distingue les sons »', () => {
  it('chaque mot respecte la translittération (3 7 9 kh gh ch des deux côtés)', () => {
    for (const m of MOTS_SONS) expect(validerMot(m), `${m.latin} / ${m.arabe}`).toEqual({})
  })

  it('identifiants uniques et MP3 nommés d’après l’identifiant', () => {
    expect(new Set(MOTS_SONS.map((m) => m.id)).size).toBe(MOTS_SONS.length)
    for (const m of MOTS_SONS) {
      expect(m.id).toBe(`son-${m.latin}`)
      expect(m.audio).toBe(`audio/${m.id}.mp3`)
    }
  })

  it('chaque paire oppose deux mots existants et différents, et nomme le son de chacun', () => {
    expect(PAIRES_SONS.length).toBeGreaterThanOrEqual(10)
    for (const p of PAIRES_SONS) {
      expect(p.a).toBeDefined()
      expect(p.b).toBeDefined()
      expect(p.a.latin).not.toBe(p.b.latin)
      expect(p.a.arabe).not.toBe(p.b.arabe)
      expect(p.a.latin).toContain(p.sons[0])
      if (p.sons[1] !== 'rien') expect(p.b.latin).toContain(p.sons[1])
    }
  })
})
