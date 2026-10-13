import { describe, expect, it } from 'vitest'
import { validerMot } from '../data/motsPerso'
import { LECONS_GRAMMAIRE, QUESTIONS_PAR_LECON, composerLecon } from './grammaire'

function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

describe('données des leçons de grammaire', () => {
  it('6 leçons, chacune avec une règle et au moins 7 formes', () => {
    expect(LECONS_GRAMMAIRE).toHaveLength(6)
    for (const l of LECONS_GRAMMAIRE) {
      expect(l.regle.length).toBeGreaterThan(0)
      expect(l.formes.length).toBeGreaterThanOrEqual(7)
    }
  })

  it('chaque forme respecte la translittération et nomme son MP3 d’après son identifiant', () => {
    const ids = LECONS_GRAMMAIRE.flatMap((l) => l.formes.map((f) => f.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of LECONS_GRAMMAIRE) {
      l.formes.forEach((f, i) => {
        expect(validerMot(f), `${f.latin} / ${f.arabe}`).toEqual({})
        expect(f.id).toBe(`gram-${l.id}-${i + 1}`)
        expect(f.audio).toBe(`audio/${f.id}.mp3`)
      })
      // Les leurres viennent de la leçon : traductions et graphies distinctes.
      expect(new Set(l.formes.map((f) => f.fr)).size).toBe(l.formes.length)
      expect(new Set(l.formes.map((f) => f.latin)).size).toBe(l.formes.length)
    }
  })
})

describe('composerLecon', () => {
  it('5 questions sur 5 formes différentes, qui finissent par Dis-le d’une phrase', () => {
    for (const l of LECONS_GRAMMAIRE) {
      for (let g = 1; g < 20; g++) {
        const etapes = composerLecon(l, graine(g))
        expect(etapes).toHaveLength(QUESTIONS_PAR_LECON)
        const ids = etapes.map((e) => (e.type === 'ecoute' || e.type === 'traduis' || e.type === 'phrase' || e.type === 'disle' ? e.mot.id : ''))
        expect(new Set(ids).size).toBe(QUESTIONS_PAR_LECON)
        const fin = etapes[4]
        expect(fin.type).toBe('disle')
        if (fin.type === 'disle') expect(fin.phrase).toBe(fin.mot.latin.includes(' '))
        for (const e of etapes) {
          if (e.type === 'ecoute' || e.type === 'traduis') {
            expect(e.choix.length).toBeGreaterThanOrEqual(3)
            expect(e.choix.every((c) => c.theme === `grammaire-${l.id}`)).toBe(true)
          }
        }
      }
    }
  })

  it('fait construire une phrase quand la leçon en a une de 3 à 6 mots', () => {
    const futur = LECONS_GRAMMAIRE.find((l) => l.id === 'futur')!
    expect(composerLecon(futur, graine(3)).some((e) => e.type === 'phrase')).toBe(true)
    const possessifs = LECONS_GRAMMAIRE.find((l) => l.id === 'possessifs')!
    expect(composerLecon(possessifs, graine(3)).some((e) => e.type === 'phrase')).toBe(false)
  })

  it('sans parler ni écouter : toujours 5 questions, sans Dis-le ni Écoute et choisis', () => {
    for (const l of LECONS_GRAMMAIRE) {
      for (const modes of [{ parler: false, ecouter: true }, { parler: true, ecouter: false }, { parler: false, ecouter: false }]) {
        const etapes = composerLecon(l, graine(5), modes)
        expect(etapes).toHaveLength(QUESTIONS_PAR_LECON)
        expect(etapes.some((e) => e.type === 'disle')).toBe(modes.parler)
        expect(etapes.some((e) => e.type === 'ecoute')).toBe(modes.ecouter)
      }
    }
  })
})
