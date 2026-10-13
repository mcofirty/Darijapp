import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DarijaDB, lireProfil } from './db'
import { ouvrirCoffre, ouvrirTresor } from './journal'
import { acheter, choisir, lirePorteMonnaie } from './souk'

let base: DarijaDB
const J = '2026-10-13'

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('porte-monnaie', () => {
  it('gagne des dirhams avec les bonnes réponses (bonus de précision compris), la théière et les trésors', async () => {
    await base.sessions.add({ date: J, xp: 30, bonnes: 20, mauvaises: 1, nouveaux: 5, type: 'session' })
    await ouvrirCoffre(J, base)
    await ouvrirTresor('tresor-tanger', 100, J, base)
    // 20 bonnes réponses + 5 DH de précision (une erreur), une théière, un trésor.
    expect((await lirePorteMonnaie(base)).solde).toBe(20 + 5 + 60 + 50)
  })

  it('acheter retire le prix, met l’article en place, et refuse sans assez de dirhams', async () => {
    // 150 bonnes réponses + 10 DH sans faute = 160 DH.
    await base.sessions.add({ date: J, xp: 200, bonnes: 150, mauvaises: 0, nouveaux: 5, type: 'session' })
    expect(await acheter('indigo', base)).toBe('Il te manque 90 DH.')
    expect(await acheter('chefchaouen', base)).toBeNull()
    expect((await lirePorteMonnaie(base)).solde).toBe(10)
    expect((await lireProfil(base)).couleur).toBe('chefchaouen')
    expect(await acheter('chefchaouen', base)).toBe('Déjà à toi.')
  })

  it('un objet du jardin acheté s’affiche, puis se range et se ressort', async () => {
    await base.sessions.add({ date: J, xp: 200, bonnes: 150, mauvaises: 0, nouveaux: 5, type: 'session' })
    expect(await acheter('lanterne', base)).toBeNull()
    expect((await lireProfil(base)).objets).toEqual(['lanterne'])
    await choisir('objet', 'lanterne', base)
    expect((await lireProfil(base)).objets).toEqual([])
    await choisir('objet', 'lanterne', base)
    expect((await lireProfil(base)).objets).toEqual(['lanterne'])
  })
})
