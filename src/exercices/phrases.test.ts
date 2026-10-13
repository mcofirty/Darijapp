import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { INTRUS, decouper, indice, morceauxDePhrase, phraseConstructible, phraseJuste } from './phrases'

function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

describe('decouper', () => {
  it('sépare les mots et retire la ponctuation', () => {
    expect(decouper('la, ghir tmenmya derhem!')).toEqual(['la', 'ghir', 'tmenmya', 'derhem'])
    expect(decouper('nta men fin?')).toEqual(['nta', 'men', 'fin'])
    expect(decouper('  3tini  atay 3afak ')).toEqual(['3tini', 'atay', '3afak'])
  })
})

describe('morceauxDePhrase', () => {
  const phrases = MOTS.filter(phraseConstructible)

  it('il y a assez de phrases de 3 à 6 mots', () => {
    expect(phrases.length).toBeGreaterThan(1000)
  })

  it('donne les mots de la phrase et des intrus, dans un autre ordre', () => {
    const alea = graine(5)
    for (const mot of phrases.slice(0, 300)) {
      const phrase = decouper(mot.exemple.latin)
      const morceaux = morceauxDePhrase(mot, MOTS, alea)
      expect(morceaux).toHaveLength(phrase.length + INTRUS)
      expect([...morceaux].sort()).toEqual(expect.arrayContaining([...phrase].sort()))
      const intrus = morceaux.filter((m) => !phrase.includes(m))
      expect(intrus).toHaveLength(INTRUS)
      expect(morceaux.slice(0, phrase.length).join(' ')).not.toBe(phrase.join(' '))
    }
  })
})

describe('phraseJuste', () => {
  const mot = MOTS.find((m) => decouper(m.exemple.latin).length === 4)!
  const phrase = decouper(mot.exemple.latin)

  it('accepte la phrase dans l’ordre, sans les intrus', () => {
    expect(phraseJuste(phrase, mot)).toBe(true)
    expect(phraseJuste([...phrase].reverse(), mot)).toBe(false)
    expect(phraseJuste(phrase.slice(0, 3), mot)).toBe(false)
    expect(phraseJuste([...phrase, 'bzaf'], mot)).toBe(false)
  })
})

describe('indice', () => {
  it('donne le début du premier mot', () => {
    expect(indice('3afak')).toBe('3a…')
    expect(indice('khobz')).toBe('kho…')
    expect(indice('la')).toBe('la')
    expect(indice('ch7al akher tmen?')).toBe('ch7a…')
  })
})
