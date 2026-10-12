import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { Resultats, composerSession, etapeARefaire, melanger, propositions } from './session'

/** Générateur pseudo-aléatoire reproductible. */
function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

describe('melanger', () => {
  it('garde les mêmes éléments', () => {
    expect(melanger([1, 2, 3, 4, 5], graine(1)).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('propositions', () => {
  it('donne 4 choix distincts dont la bonne réponse', () => {
    for (const mot of MOTS) {
      const choix = propositions(mot, MOTS, graine(7))
      expect(choix).toHaveLength(4)
      expect(choix.map((c) => c.id)).toContain(mot.id)
      expect(new Set(choix.map((c) => c.fr)).size).toBe(4)
      expect(new Set(choix.map((c) => c.latin)).size).toBe(4)
    }
  })

  it('prend les leurres dans le même thème quand c’est possible', () => {
    const mot = MOTS.find((m) => m.latin === 'khobz')!
    expect(propositions(mot, MOTS, graine(3)).every((c) => c.theme === 'nourriture')).toBe(true)
  })
})

describe('composerSession', () => {
  const nouveaux = MOTS.slice(0, 5)
  const revisions = MOTS.slice(20, 28)

  it('présente puis exerce chaque nouveau mot, puis les associe par paires', () => {
    const etapes = composerSession(nouveaux, [], MOTS, graine(2))
    expect(etapes.map((e) => e.type)).toEqual([
      'decouverte', 'ecoute', 'decouverte', 'traduis', 'decouverte', 'ecoute',
      'decouverte', 'traduis', 'decouverte', 'ecoute', 'paires',
    ])
  })

  it('ajoute un exercice par révision et une série de paires', () => {
    const etapes = composerSession(nouveaux, revisions, MOTS, graine(2))
    const apres = etapes.slice(11)
    expect(apres).toHaveLength(9)
    expect(apres.slice(0, 8).every((e) => e.type === 'ecoute' || e.type === 'traduis')).toBe(true)
    expect(apres[8]).toMatchObject({ type: 'paires' })
  })

  it('ne fait pas de paires avec moins de 3 mots', () => {
    const etapes = composerSession(nouveaux.slice(0, 2), revisions.slice(0, 2), MOTS, graine(2))
    expect(etapes.some((e) => e.type === 'paires')).toBe(false)
  })
})

describe('etapeARefaire', () => {
  it('refait les exercices à choix mais pas les découvertes', () => {
    const [decouverte, ecoute] = composerSession(MOTS.slice(0, 1), [], MOTS, graine(4))
    expect(etapeARefaire(decouverte, MOTS)).toBeNull()
    expect(etapeARefaire(ecoute, MOTS)).toMatchObject({ type: 'ecoute', mot: ecoute.type === 'ecoute' ? ecoute.mot : null })
  })
})

describe('Resultats', () => {
  it('un mot avec une erreur compte comme raté, même réussi ensuite', () => {
    const r = new Resultats()
    r.noter('a', true)
    r.noter('b', false)
    r.noter('b', true)
    expect(r.parMot()).toEqual(new Map([['a', true], ['b', false]]))
    expect(r.bonnes).toBe(2)
    expect(r.taux).toBeCloseTo(2 / 3)
    expect(r.sansFaute).toBe(false)
  })
})
