import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { THEMES } from '../data/themes'
import { ETAPES, SEUIL_TAMPON, cleTresor, etatsDuVoyage, motsDeLEtape, planDeLecon, prochaineEtape, tresorOuvrable } from './voyage'

const J = '2026-10-13'

describe('voyage', () => {
  it('les 10 étapes couvrent chacun des 31 thèmes une seule fois', () => {
    const themes = ETAPES.flatMap((e) => e.themes)
    expect(themes.sort()).toEqual(THEMES.map((t) => t.id).sort())
    expect(new Set(ETAPES.map((e) => e.id)).size).toBe(ETAPES.length)
  })

  it('au départ : aucun tampon, la première étape est conseillée', () => {
    const etats = etatsDuVoyage(MOTS, [])
    expect(etats.every((e) => !e.tampon && e.vus === 0)).toBe(true)
    expect(prochaineEtape(etats)).toBe(0)
  })

  it('le tampon vient quand 80 % des mots de l’étape sont retenus (boîte 2 ou plus)', () => {
    const mots = motsDeLEtape(ETAPES[0], MOTS)
    const n = Math.ceil(mots.length * SEUIL_TAMPON)
    const presque = mots.slice(0, n - 1).map((m) => ({ id: m.id, boite: 2 }))
    expect(etatsDuVoyage(MOTS, presque)[0].tampon).toBe(false)
    const assez = mots.slice(0, n).map((m) => ({ id: m.id, boite: 3 }))
    const etats = etatsDuVoyage(MOTS, [...assez, { id: mots[n].id, boite: 1 }])
    expect(etats[0]).toMatchObject({ tampon: true, retenus: n, vus: n + 1 })
    expect(prochaineEtape(etats)).toBe(1)
  })

  it('un trésor s’ouvre une fois, quand l’étape d’avant a son tampon', () => {
    const tout = motsDeLEtape(ETAPES[0], MOTS).map((m) => ({ id: m.id, boite: 4 }))
    const etats = etatsDuVoyage(MOTS, tout)
    expect(tresorOuvrable(0, etats, new Set())).toBe(true)
    expect(tresorOuvrable(0, etats, new Set([cleTresor(0)]))).toBe(false)
    expect(tresorOuvrable(1, etats, new Set())).toBe(false)
  })
})

describe('planDeLecon', () => {
  const etape = ETAPES[0]
  const mots = motsDeLEtape(etape, MOTS)

  it('5 nouveaux mots de l’étape, dans l’ordre', () => {
    expect(planDeLecon(etape, MOTS, [], J).nouveaux.map((m) => m.id)).toEqual(mots.slice(0, 5).map((m) => m.id))
  })

  it('les révisions dues de l’étape seulement', () => {
    const progressions = [
      { id: mots[0].id, prochaineRevision: '2026-10-12' },
      { id: mots[1].id, prochaineRevision: '2026-10-20' },
      { id: 'jours-001', prochaineRevision: '2026-10-01' },
    ]
    expect(planDeLecon(etape, MOTS, progressions, J).revisions.map((m) => m.id)).toEqual([mots[0].id])
  })

  it('tout vu et rien de dû : entraînement libre sur les mots de l’étape', () => {
    const progressions = mots.map((m) => ({ id: m.id, prochaineRevision: '2026-11-01' }))
    const plan = planDeLecon(etape, MOTS, progressions, J)
    expect(plan.nouveaux).toEqual([])
    expect(plan.revisions).toEqual([])
    expect(plan.entrainement).toHaveLength(mots.length)
  })
})
