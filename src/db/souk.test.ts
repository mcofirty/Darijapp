import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DarijaDB, lireProfil } from './db'
import { ouvrirCoffre, ouvrirTresor } from './journal'
import { acheter, lirePorteMonnaie } from './souk'

let base: DarijaDB
const J = '2026-10-13'

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('porte-monnaie', () => {
  it('gagne des dirhams avec les bonnes réponses, la théière et les trésors', async () => {
    await base.sessions.add({ date: J, xp: 30, bonnes: 20, mauvaises: 1, nouveaux: 5, type: 'session' })
    await ouvrirCoffre(J, base)
    await ouvrirTresor('tresor-tanger', 100, J, base)
    expect((await lirePorteMonnaie(base)).solde).toBe(20 + 60 + 50)
  })

  it('acheter retire le prix, met l’article en place, et refuse sans assez de dirhams', async () => {
    await base.sessions.add({ date: J, xp: 200, bonnes: 160, mauvaises: 0, nouveaux: 5, type: 'session' })
    expect(await acheter('indigo', base)).toBe('Il te manque 90 DH.')
    expect(await acheter('chefchaouen', base)).toBeNull()
    expect((await lirePorteMonnaie(base)).solde).toBe(10)
    expect((await lireProfil(base)).couleur).toBe('chefchaouen')
    expect(await acheter('chefchaouen', base)).toBe('Déjà à toi.')
  })
})
