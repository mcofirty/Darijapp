import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { planDeSession } from './apprentissage'
import { DarijaDB } from './db'
import { ajouterMot, lireMotsPerso, modifierMot, supprimerMot, tousLesMots } from './motsPerso'

let base: DarijaDB
const salam = { latin: 'salam', arabe: 'سلام', fr: 'bonjour' }

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})
afterEach(async () => {
  await base.delete()
})

describe('mots ajoutés', () => {
  it('s’ajoutent, se modifient et se suppriment', async () => {
    const mot = await ajouterMot({ ...salam, latin: '  salam ' }, base)
    expect((await lireMotsPerso(base)).map((m) => m.latin)).toEqual(['salam'])
    await modifierMot(mot.id, { latin: 'khobz', arabe: 'خبز', fr: 'pain' }, base)
    expect((await lireMotsPerso(base))[0]).toMatchObject({ latin: 'khobz', fr: 'pain' })
    await supprimerMot(mot.id, base)
    expect(await lireMotsPerso(base)).toEqual([])
  })

  it('refusent un mot incomplet ou mal translittéré', async () => {
    await expect(ajouterMot({ latin: '', arabe: 'سلام', fr: 'bonjour' }, base)).rejects.toThrow()
    await expect(ajouterMot({ latin: 'afak', arabe: 'عافاك', fr: 'x' }, base)).rejects.toThrow()
  })

  it('arrivent en tête des nouveaux mots d’une session', async () => {
    const mot = await ajouterMot(salam, base)
    const plan = await planDeSession('2026-10-12', base)
    expect(plan.nouveaux[0].id).toBe(mot.id)
    expect(plan.nouveaux).toHaveLength(5)
    expect((await tousLesMots(base)).length).toBe(MOTS.length + 1)
  })

  it('la suppression retire aussi la progression', async () => {
    const mot = await ajouterMot(salam, base)
    await base.progression.put({
      id: mot.id, boite: 1, prochaineRevision: '2026-10-13', reussites: 0, echecs: 1, scores: [], favori: false, signale: false, audioPerso: null,
    })
    await supprimerMot(mot.id, base)
    expect(await base.progression.get(mot.id)).toBeUndefined()
  })
})
