import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DarijaDB } from './db'
import { lireJournal, noterEcoute, ouvrirCoffre } from './journal'
import { exporter, importer } from './sauvegarde'

let base: DarijaDB
const J = '2026-10-13'

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('journal du jour', () => {
  it('compte les mots écoutés', async () => {
    await noterEcoute(J, base)
    await noterEcoute(J, base)
    expect(await lireJournal(J, base)).toEqual({ date: J, ecoutes: 2, coffre: false })
  })

  it('la théière ne donne ses 60 XP qu’une fois par jour', async () => {
    expect(await ouvrirCoffre(J, base)).toBe(60)
    expect(await ouvrirCoffre(J, base)).toBe(0)
    expect(await base.bonus.toArray()).toEqual([{ id: 1, date: J, xp: 60, raison: 'coffre' }])
    expect(await ouvrirCoffre('2026-10-14', base)).toBe(60)
  })
})

describe('sauvegarde', () => {
  it('exporter puis importer redonne la même progression, et remplace l’ancienne', async () => {
    await base.progression.put({ id: 'salutations-001', boite: 3, prochaineRevision: J, reussites: 2, echecs: 0, scores: [], favori: false, signale: false, audioPerso: null })
    await base.sessions.add({ date: J, xp: 20, bonnes: 10, mauvaises: 0, nouveaux: 5, type: 'session' })
    await ouvrirCoffre(J, base)
    const copie = await exporter(base)

    const autre = new DarijaDB(`test-${crypto.randomUUID()}`)
    await autre.progression.put({ id: 'jours-001', boite: 1, prochaineRevision: J, reussites: 0, echecs: 1, scores: [], favori: false, signale: false, audioPerso: null })
    await importer(JSON.parse(JSON.stringify(copie)), autre)
    expect(await autre.progression.toArray()).toEqual(await base.progression.toArray())
    expect(await autre.sessions.count()).toBe(1)
    expect(await autre.bonus.count()).toBe(1)
    await autre.delete()
  })
})
