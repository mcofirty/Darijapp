import { describe, expect, it } from 'vitest'
import { MOTS, chercherAvecProches } from '.'
import { distance, formeDarija, formeFrancais, motsProches, tolerance } from './recherche'
import type { Mot } from './types'

const mot = (id: string, latin: string, fr: string) => ({ id, latin, fr, arabe: '' }) as Mot

describe('formes', () => {
  it('ramène les écritures du darija à une même forme', () => {
    expect(formeDarija('choukran')).toBe(formeDarija('chokran'))
    expect(formeDarija('shukran')).toBe(formeDarija('chokran'))
    expect(formeDarija('3afak')).toBe(formeDarija('afak'))
    expect(formeDarija('ma3lich')).toBe(formeDarija('maalesh'))
    expect(formeDarija('khobz')).toBe(formeDarija('xobz'))
    expect(formeDarija('lghda')).toBe(formeDarija('lrda'))
    expect(formeDarija('bezzaf')).toBe(formeDarija('bezaf'))
    expect(formeDarija('sou2al')).toBe(formeDarija('soual'))
  })
  it('retire accents et ponctuation du français', () => {
    expect(formeFrancais('Bonjour (salutation)')).toBe('bonjour salutation')
    expect(formeFrancais('s’il te plaît')).toBe('s il te plait')
  })
})

describe('distance', () => {
  it('compte lettres changées, ajoutées, retirées ou inversées', () => {
    expect(distance('merci', 'merci')).toBe(0)
    expect(distance('mersi', 'merci')).toBe(1)
    expect(distance('bonjoru', 'bonjour')).toBe(1)
    expect(distance('pai', 'pain')).toBe(1)
    expect(distance('', 'abc')).toBe(3)
  })
  it('tolère plus d’écart sur les mots longs', () => {
    expect([tolerance(3), tolerance(4), tolerance(8)]).toEqual([0, 1, 2])
  })
})

describe('motsProches', () => {
  const mots = [mot('a', 'chokran', 'merci'), mot('b', 'khobz', 'pain'), mot('c', 'bslama', 'au revoir')]
  it('propose les mots écrits autrement ou avec une faute', () => {
    expect(motsProches(mots, 'shukran').map((m) => m.id)).toEqual(['a'])
    expect(motsProches(mots, 'mersi').map((m) => m.id)).toEqual(['a'])
    expect(motsProches(mots, 'au revior').map((m) => m.id)).toEqual(['c'])
  })
  it('écarte les mots déjà trouvés, les recherches trop courtes et ce qui ne ressemble à rien', () => {
    expect(motsProches(mots, 'chokran', new Set(['a']))).toEqual([])
    expect(motsProches(mots, 'ch')).toEqual([])
    expect(motsProches(mots, 'ordinateur')).toEqual([])
  })
  it('range du plus proche au moins proche', () => {
    const liste = [mot('x', 'bab', 'porte'), mot('y', 'bnt', 'fille')]
    expect(motsProches(liste, 'bab')[0].id).toBe('x')
  })
})

describe('dans le dictionnaire', () => {
  it('« mersi » propose merci avant les mots qui en commencent seulement comme lui', () => {
    expect(chercherAvecProches(MOTS, 'mersi').proches[0].fr).toBe('merci')
  })
  it('« shukran » et « mersi » trouvent merci', () => {
    for (const q of ['shukran', 'mersi']) {
      const { exacts, proches } = chercherAvecProches(MOTS, q)
      expect([...exacts, ...proches].some((m) => m.fr === 'merci'), q).toBe(true)
    }
  })
  it('les résultats exacts restent en tête, sans doublon dans les propositions', () => {
    const { exacts, proches } = chercherAvecProches(MOTS, 'khobz')
    expect(exacts.length).toBeGreaterThan(0)
    const ids = new Set(exacts.map((m) => m.id))
    expect(proches.some((m) => ids.has(m.id))).toBe(false)
  })
  it('reste rapide sur tout le dictionnaire', () => {
    const debut = performance.now()
    for (const q of ['bonjoru', 'chokrane', 'lma', 'tomobil', 'zwin bzaf']) chercherAvecProches(MOTS, q)
    expect(performance.now() - debut).toBeLessThan(1500)
  })
})
