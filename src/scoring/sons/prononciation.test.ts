import { describe, expect, it } from 'vitest'
import { evaluer, regrouper, sonsAttendus, vraisemblance, type Sorties } from './prononciation'

/** Sorties fabriquées : chaque trame donne presque toute la probabilité à une colonne (0 = blanc). */
function sorties(classes: string[], suite: number[], certitude = 0.9): Sorties {
  const C = classes.length + 1
  const logp = new Float64Array(suite.length * C)
  suite.forEach((col, t) => {
    for (let c = 0; c < C; c++) logp[t * C + c] = Math.log(c === col ? certitude : (1 - certitude) / (C - 1))
  })
  return { trames: suite.length, classes, logp }
}

describe('sonsAttendus', () => {
  it('lit la translittération de l’appli', () => {
    expect(sonsAttendus('9elb')).toEqual(['q', 'ə', 'l', 'b'])
    expect(sonsAttendus('7al')).toEqual(['ħ', 'a', 'l'])
    expect(sonsAttendus('3afak')).toEqual(['ʕ', 'a', 'f', 'a', 'k'])
    expect(sonsAttendus('khobz')).toEqual(['x', 'u', 'b', 'z'])
    expect(sonsAttendus('ghali')).toEqual(['ɣ', 'a', 'l', 'i'])
    expect(sonsAttendus('chkoun')).toEqual(['ʃ', 'k', 'u', 'n'])
  })

  it('compte une lettre doublée pour un son et ignore espaces et ponctuation', () => {
    expect(sonsAttendus('ssba7')).toEqual(['s', 'b', 'a', 'ħ'])
    expect(sonsAttendus('la, ghir')).toEqual(['l', 'a', 'ɣ', 'i', 'r'])
  })
})

describe('vraisemblance', () => {
  it('préfère la séquence entendue', () => {
    const s = sorties(['q', 'k', 'l'], [0, 1, 1, 0, 3, 0])
    expect(vraisemblance(s, [1, 3])).toBeGreaterThan(vraisemblance(s, [2, 3]))
  })

  it('exige un blanc entre deux sons identiques', () => {
    const s = sorties(['l'], [1, 1, 1])
    expect(vraisemblance(s, [1, 1])).toBeLessThan(vraisemblance(s, [1]))
  })
})

describe('evaluer', () => {
  const classes = ['q', 'k', 'ə', 'l', 'b']

  it('note haut un mot dit comme attendu', () => {
    // q, ə, l, b, séparés de blancs.
    const e = evaluer(sorties(classes, [0, 1, 0, 3, 0, 4, 0, 5, 0]), ['q', 'ə', 'l', 'b'])
    expect(e.score).toBeGreaterThan(85)
    expect(e.details.every((d) => d.probabilite > 0.8)).toBe(true)
  })

  it('repère le son remplacé et dit par quoi', () => {
    // On entend k au lieu de q.
    const e = evaluer(sorties(classes, [0, 2, 0, 3, 0, 4, 0, 5, 0]), ['q', 'ə', 'l', 'b'])
    const q = e.details[0]
    expect(q.probabilite).toBeLessThan(0.2)
    expect(q.confondu).toBe('k')
    expect(q.special).toBe(true)
    expect(e.score).toBeLessThan(60)
  })

  it('repère un son omis', () => {
    const e = evaluer(sorties(classes, [0, 3, 0, 4, 0, 5, 0]), ['q', 'ə', 'l', 'b'])
    expect(e.details[0].probabilite).toBeLessThan(0.2)
    expect(e.details[0].confondu).toBeNull()
  })
})

describe('regrouper', () => {
  it('additionne les sons d’une même classe et ignore les sons hors classes', () => {
    // Blanc, χ et x (classe x), h (classe h), ʘ (hors classes).
    const sons = ['<blk>', 'χ', 'x', 'h', 'ʘ']
    const logits = Float32Array.from([0, 0, 0, 0, 5])
    const s = regrouper(logits, 1, sons)
    const C = s.classes.length + 1
    const px = Math.exp(s.logp[s.classes.indexOf('x') + 1])
    expect(px).toBeCloseTo(0.5, 5)
    let total = 0
    for (let c = 0; c < C; c++) total += Math.exp(s.logp[c])
    expect(total).toBeCloseTo(1, 5)
  })
})
