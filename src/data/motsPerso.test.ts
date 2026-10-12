import { describe, expect, it } from 'vitest'
import type { MotPerso } from '../db/db'
import { MOTS } from '.'
import { THEME_PERSO, assemblerMots, motValide, validerMot, versMot } from './motsPerso'

const salam = { latin: 'salam', arabe: 'سلام', fr: 'bonjour' }

describe('validation d’un mot ajouté', () => {
  it('accepte un mot complet', () => {
    expect(validerMot(salam)).toEqual({})
    expect(motValide(salam)).toBe(true)
  })

  it('exige les trois champs', () => {
    expect(Object.keys(validerMot({ latin: '', arabe: '', fr: '' })).sort()).toEqual(['arabe', 'fr', 'latin'])
    expect(validerMot({ ...salam, fr: '  ' }).fr).toBeDefined()
  })

  it('refuse des lettres arabes dans le latin et inversement', () => {
    expect(validerMot({ ...salam, latin: 'سلام' }).latin).toBeDefined()
    expect(validerMot({ ...salam, arabe: 'salam' }).arabe).toBeDefined()
    expect(validerMot({ ...salam, arabe: 'سلام salam' }).arabe).toBeDefined()
  })

  it('applique la translittération 3 7 9 kh gh ch', () => {
    expect(motValide({ latin: '3afak', arabe: 'عافاك', fr: 's’il te plaît' })).toBe(true)
    expect(motValide({ latin: 'afak', arabe: 'عافاك', fr: 'x' })).toBe(false)
    expect(motValide({ latin: '9elb', arabe: 'قلب', fr: 'cœur' })).toBe(true)
    expect(motValide({ latin: 'kelb', arabe: 'قلب', fr: 'cœur' })).toBe(false)
    expect(motValide({ latin: 'khobz', arabe: 'خبز', fr: 'pain' })).toBe(true)
    expect(motValide({ latin: 'chems', arabe: 'شمس', fr: 'soleil' })).toBe(true)
    expect(motValide({ latin: 'ghaba', arabe: 'غابة', fr: 'forêt' })).toBe(true)
    expect(motValide({ latin: '7out', arabe: 'حوت', fr: 'poisson' })).toBe(true)
  })
})

describe('mots ajoutés dans l’appli', () => {
  const a: MotPerso = { id: 'perso-a', ...salam, creeLe: 2 }
  const b: MotPerso = { id: 'perso-b', latin: 'khobz', arabe: 'خبز', fr: 'pain', creeLe: 1 }

  it('deviennent des mots du thème « mes-mots »', () => {
    const mot = versMot(a)
    expect(mot).toMatchObject({ id: 'perso-a', latin: 'salam', arabe: 'سلام', fr: 'bonjour', theme: THEME_PERSO })
    expect(mot.exemple.latin).toBe('')
  })

  it('passent avant le programme, dans l’ordre d’ajout', () => {
    const tous = assemblerMots([a, b], MOTS)
    expect(tous.slice(0, 2).map((m) => m.id)).toEqual(['perso-b', 'perso-a'])
    expect(tous).toHaveLength(MOTS.length + 2)
    expect(tous[2]).toBe(MOTS[0])
  })
})
