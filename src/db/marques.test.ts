import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DarijaDB } from './db'
import { changerFavori, signaler } from './marques'

let base: DarijaDB

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('marques', () => {
  it('un favori ou un signalement ne compte pas le mot comme vu', async () => {
    await changerFavori('salutations-001', true, base)
    await signaler('salutations-002', 'traduction', base)
    expect(await base.progression.count()).toBe(0)
    expect((await base.marques.get('salutations-001'))?.favori).toBe(true)
    expect((await base.marques.get('salutations-002'))?.signale).toBe('traduction')
  })

  it('favori et signalement d’un même mot se cumulent, et la marque vide disparaît', async () => {
    await changerFavori('salutations-001', true, base)
    await signaler('salutations-001', 'ecriture', base)
    expect(await base.marques.get('salutations-001')).toMatchObject({ favori: true, signale: 'ecriture' })
    await changerFavori('salutations-001', false, base)
    await signaler('salutations-001', null, base)
    expect(await base.marques.count()).toBe(0)
  })
})

describe('migration v3 → v4', () => {
  it('garde la progression, les mots ajoutés et les sessions', async () => {
    const nom = `test-${crypto.randomUUID()}`
    const ancienne = new Dexie(nom)
    ancienne.version(3).stores({ progression: 'id, prochaineRevision', profil: 'id', motsPerso: 'id, creeLe', sessions: '++id, date' })
    await ancienne.table('progression').put({ id: 'salutations-001', boite: 2, prochaineRevision: '2026-10-15', reussites: 1, echecs: 0 })
    await ancienne.table('motsPerso').put({ id: 'perso-1', latin: 'khobz', arabe: 'خبز', fr: 'pain', creeLe: 1 })
    await ancienne.table('sessions').add({ date: '2026-10-12', xp: 20, bonnes: 10, mauvaises: 0, nouveaux: 5 })
    ancienne.close()

    const nouvelle = new DarijaDB(nom)
    expect(await nouvelle.progression.get('salutations-001')).toMatchObject({ boite: 2 })
    expect(await nouvelle.motsPerso.count()).toBe(1)
    expect(await nouvelle.sessions.count()).toBe(1)
    expect(await nouvelle.marques.count()).toBe(0)
    await nouvelle.delete()
  })
})
