import { describe, expect, it } from 'vitest'
import type { MotPerso } from '../db/db'
import { MOTS } from '.'
import { THEME_PERSO, assemblerMots, decrireProvenance, lienDeMot, motDuLien, motValide, validerMot, versMot } from './motsPerso'

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

describe('lien de partage', () => {
  const adresse = 'https://mcofirty.github.io/Darijapp/'
  const mot = { latin: '3afak', arabe: 'عافاك', fr: 's’il te plaît' }

  it('transporte un mot et le retrouve à l’identique', () => {
    const lien = lienDeMot(adresse, mot)
    expect(lien.startsWith(`${adresse}#mot=`)).toBe(true)
    expect(motDuLien(lien.slice(lien.indexOf('#')))).toEqual(mot)
  })

  it('remplace un éventuel #ajout de l’adresse', () => {
    expect(lienDeMot(`${adresse}#ajout`, mot)).toBe(lienDeMot(adresse, mot))
  })

  it('refuse un lien absent, abîmé ou invalide', () => {
    expect(motDuLien('')).toBeNull()
    expect(motDuLien('#ajout')).toBeNull()
    expect(motDuLien('#mot=%E0%A4%A')).toBeNull()
    expect(motDuLien('#mot=' + encodeURIComponent('{"a":1}'))).toBeNull()
    expect(motDuLien('#mot=' + encodeURIComponent(JSON.stringify(['afak', 'عافاك', 'x'])))).toBeNull()
    expect(motDuLien('#mot=' + encodeURIComponent(JSON.stringify(['salam', 'سلام', 'x'.repeat(200)])))).toBeNull()
  })

  it('transporte l’heure et le lieu de l’ajout', () => {
    const ajouteLe = new Date(2026, 9, 13, 14, 32).getTime()
    const lien = lienDeMot(adresse, { ...mot, ajouteLe, lieu: ' Casablanca ' })
    expect(motDuLien(lien.slice(lien.indexOf('#')))).toEqual({ ...mot, ajouteLe, lieu: 'Casablanca' })
  })

  it('lit encore les liens d’avant l’heure et le lieu', () => {
    expect(motDuLien('#mot=' + encodeURIComponent(JSON.stringify(['3afak', 'عافاك', 's’il te plaît'])))).toEqual(mot)
  })

  it('refuse une heure ou un lieu abîmés', () => {
    const lien = (ajouteLe: unknown, lieu: unknown) => '#mot=' + encodeURIComponent(JSON.stringify(['3afak', 'عافاك', 'x', ajouteLe, lieu]))
    expect(motDuLien(lien(null, ''))).toEqual({ ...mot, fr: 'x' })
    expect(motDuLien(lien('demain', ''))).toBeNull()
    expect(motDuLien(lien(-5, ''))).toBeNull()
    expect(motDuLien(lien(null, 42))).toBeNull()
    expect(motDuLien(lien(null, 'x'.repeat(61)))).toBeNull()
    expect(motDuLien('#mot=' + encodeURIComponent(JSON.stringify(['3afak', 'عافاك', 'x', null])))).toBeNull()
  })
})

describe('provenance d’un mot', () => {
  const ajouteLe = new Date(2026, 9, 13, 9, 5).getTime()

  it('donne la date, l’heure et le lieu', () => {
    expect(decrireProvenance({ ajouteLe, lieu: 'Casablanca' })).toBe('Ajouté le 13 octobre 2026 à 9 h 05, à Casablanca')
  })

  it('se contente de ce qui est connu', () => {
    expect(decrireProvenance({ ajouteLe })).toBe('Ajouté le 13 octobre 2026 à 9 h 05')
    expect(decrireProvenance({ lieu: 'Fès' })).toBe('Ajouté à Fès')
    expect(decrireProvenance({ lieu: '  ' })).toBeNull()
    expect(decrireProvenance({})).toBeNull()
  })
})
