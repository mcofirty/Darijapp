import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DarijaDB, PROFIL_DEFAUT, lireProfil, modifierProfil } from './db'

let base: DarijaDB

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('profil', () => {
  it('renvoie les valeurs par défaut au premier lancement', async () => {
    expect(await lireProfil(base)).toEqual(PROFIL_DEFAUT)
  })

  it('l’arabe est affiché par défaut', async () => {
    expect((await lireProfil(base)).afficherArabe).toBe(true)
  })

  it('enregistre une modification sans perdre le reste', async () => {
    await modifierProfil({ prenom: 'Romain' }, base)
    await modifierProfil({ afficherArabe: false }, base)
    expect(await lireProfil(base)).toEqual({ ...PROFIL_DEFAUT, prenom: 'Romain', afficherArabe: false })
  })
})

describe('progression', () => {
  it('stocke et relit la progression d’un mot', async () => {
    const progression = {
      id: 'salutations-012',
      boite: 3,
      prochaineRevision: '2026-10-18',
      reussites: 5,
      echecs: 1,
      scores: [62, 74, 81],
      favori: false,
      signale: false,
      audioPerso: null,
    }
    await base.progression.put(progression)
    expect(await base.progression.get('salutations-012')).toEqual(progression)
  })
})
