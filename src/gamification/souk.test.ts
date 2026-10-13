import { describe, expect, it } from 'vitest'
import { ARTICLES, PAR_DEFAUT, achatPossible, dirhamsGagnes, possede, solde } from './souk'

describe('dirhams', () => {
  it('1 par bonne réponse, 60 par théière, 50 par trésor', () => {
    expect(dirhamsGagnes({ bonnes: 30, theieres: 2, tresors: 1 })).toBe(30 + 120 + 50)
  })

  it('le solde déduit les achats', () => {
    expect(solde(300, [{ prix: 150 }, { prix: 80 }])).toBe(70)
  })
})

describe('souk', () => {
  it('chaque catégorie a son article gratuit de départ, possédé d’office', () => {
    for (const [categorie, id] of Object.entries(PAR_DEFAUT)) {
      const a = ARTICLES.find((x) => x.id === id)!
      expect(a.categorie).toBe(categorie)
      expect(a.prix).toBe(0)
      expect(possede(id, [])).toBe(true)
    }
  })

  it('identifiants uniques', () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length)
  })

  it('un achat demande assez de dirhams, et pas deux fois', () => {
    expect(achatPossible('chefchaouen', 100, [])).toEqual({ ok: false, raison: 'Il te manque 50 DH.' })
    expect(achatPossible('chefchaouen', 150, [])).toEqual({ ok: true })
    expect(achatPossible('chefchaouen', 500, [{ id: 'chefchaouen' }])).toEqual({ ok: false, raison: 'Déjà à toi.' })
    expect(achatPossible('drapeau', 0, [])).toMatchObject({ ok: false })
  })
})
