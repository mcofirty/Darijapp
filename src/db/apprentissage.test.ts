import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { NOUVEAUX_PAR_SESSION, enregistrerActivite, enregistrerSession, motsConnus, motsDejaVus, planDeSession } from './apprentissage'
import { DarijaDB } from './db'

const J = '2026-10-12'
let base: DarijaDB

beforeEach(() => {
  base = new DarijaDB(`test-${crypto.randomUUID()}`)
})

afterEach(async () => {
  await base.delete()
})

describe('motsConnus', () => {
  it('ne garde que les mots en boîte 2 ou plus', async () => {
    await enregistrerSession(new Map([[MOTS[0].id, true], [MOTS[1].id, false]]), { bonnes: 1, mauvaises: 1, nouveaux: 2, entrainement: false }, J, base)
    expect([...(await motsConnus(base))]).toEqual([MOTS[0].id])
  })
})

describe('planDeSession', () => {
  it('au premier lancement : 5 nouveaux mots, aucune révision', async () => {
    const plan = await planDeSession(J, base)
    expect(plan.nouveaux.map((m) => m.id)).toEqual(MOTS.slice(0, NOUVEAUX_PAR_SESSION).map((m) => m.id))
    expect(plan.revisions).toEqual([])
  })

  it('après une session : 5 mots suivants, et révisions dues le bon jour', async () => {
    const resultats = new Map([[MOTS[0].id, true], [MOTS[1].id, false]])
    await enregistrerSession(resultats, { bonnes: 3, mauvaises: 1, nouveaux: 2, entrainement: false }, J, base)

    const memeJour = await planDeSession(J, base)
    expect(memeJour.nouveaux[0].id).toBe(MOTS[2].id)
    expect(memeJour.revisions).toEqual([])

    const lendemain = await planDeSession('2026-10-13', base)
    expect(lendemain.revisions.map((m) => m.id)).toEqual([MOTS[1].id])

    const dans3Jours = await planDeSession('2026-10-15', base)
    expect(dans3Jours.revisions.map((m) => m.id).sort()).toEqual([MOTS[0].id, MOTS[1].id].sort())
  })
})

describe('enregistrerSession', () => {
  it('ajoute la session avec son XP et crée la progression des mots', async () => {
    const bilan = await enregistrerSession(new Map([[MOTS[0].id, true]]), { bonnes: 4, mauvaises: 0, nouveaux: 1, entrainement: false }, J, base)
    expect(bilan.xp).toBe(4 + 10 + 5)
    expect(await base.sessions.count()).toBe(1)
    expect(await base.progression.get(MOTS[0].id)).toMatchObject({ boite: 2, reussites: 1, favori: false, scores: [] })
    expect((await motsDejaVus(base)).map((m) => m.id)).toEqual([MOTS[0].id])
  })

  it('garde favori et scores existants', async () => {
    await base.progression.put({
      id: MOTS[0].id, boite: 2, prochaineRevision: J, reussites: 1, echecs: 0, scores: [70], favori: true, signale: false, audioPerso: null,
    })
    await enregistrerSession(new Map([[MOTS[0].id, true]]), { bonnes: 1, mauvaises: 0, nouveaux: 0, entrainement: false }, J, base)
    expect(await base.progression.get(MOTS[0].id)).toMatchObject({ boite: 3, favori: true, scores: [70] })
  })

  it('en entraînement libre, ne touche pas à la répétition espacée', async () => {
    await enregistrerSession(new Map([[MOTS[0].id, false]]), { bonnes: 0, mauvaises: 1, nouveaux: 0, entrainement: true }, J, base)
    expect(await base.progression.count()).toBe(0)
    expect(await base.sessions.count()).toBe(1)
  })
})

describe('migration v1 → v2', () => {
  it('garde la progression et le profil', async () => {
    const nom = `migration-${crypto.randomUUID()}`
    const v1 = new Dexie(nom)
    v1.version(1).stores({ progression: 'id, prochaineRevision', profil: 'id', motsPerso: 'id' })
    await v1.table('progression').put({ id: 'salutations-001', boite: 3, prochaineRevision: J })
    await v1.table('profil').put({ id: 'moi', prenom: 'Test', genre: null, afficherArabe: false })
    v1.close()

    const v2 = new DarijaDB(nom)
    expect(await v2.progression.get('salutations-001')).toMatchObject({ boite: 3 })
    expect(await v2.profil.get('moi')).toMatchObject({ afficherArabe: false })
    expect(await v2.sessions.count()).toBe(0)
    await v2.delete()
  })
})

describe('enregistrerActivite', () => {
  it('compte un quiz dans l’XP et la série sans toucher à la répétition espacée', async () => {
    const bilan = await enregistrerActivite('quiz', { bonnes: 5, mauvaises: 0 }, J, base)
    expect(bilan.xp).toBe(5 + 10 + 5)
    expect(await base.progression.count()).toBe(0)
    expect(await base.sessions.toArray()).toEqual([
      { id: 1, date: J, xp: 20, bonnes: 5, mauvaises: 0, nouveaux: 0, type: 'quiz' },
    ])
  })

  it('pas de bonus sans faute pour un Quiz express sans aucune réponse', async () => {
    expect((await enregistrerActivite('express', { bonnes: 0, mauvaises: 0 }, J, base)).xp).toBe(10)
  })
})

describe('scores de prononciation', () => {
  it('ajoute les scores de Dis-le à la progression du mot, 20 au plus', async () => {
    const id = MOTS[0].id
    await enregistrerSession(new Map([[id, true]]), { bonnes: 1, mauvaises: 0, nouveaux: 1, entrainement: false, scores: new Map([[id, [70, 85]]]) }, J, base)
    expect((await base.progression.get(id))?.scores).toEqual([70, 85])
    const beaucoup = Array.from({ length: 25 }, (_, i) => i)
    await enregistrerSession(new Map([[id, true]]), { bonnes: 1, mauvaises: 0, nouveaux: 0, entrainement: true, scores: new Map([[id, beaucoup]]) }, J, base)
    const scores = (await base.progression.get(id))!.scores
    expect(scores).toHaveLength(20)
    expect(scores.at(-1)).toBe(24)
  })

  it('n’invente pas de progression pour un mot jamais vu en entraînement', async () => {
    await enregistrerSession(new Map(), { bonnes: 0, mauvaises: 0, nouveaux: 0, entrainement: true, scores: new Map([['inconnu', [90]]]) }, J, base)
    expect(await base.progression.get('inconnu')).toBeUndefined()
  })
})
