import { describe, expect, it } from 'vitest'
import { ARTICLES, PAR_DEFAUT, achatPossible, bonusPrecision, dirhamsDActivite, dirhamsGagnes, possede, solde } from './souk'

describe('dirhams', () => {
  it('moins d’erreurs, plus de dirhams : bonus de 10, 5 puis 2 DH', () => {
    expect(bonusPrecision(0)).toBe(10)
    expect(bonusPrecision(1)).toBe(5)
    expect(bonusPrecision(2)).toBe(2)
    expect(bonusPrecision(3)).toBe(0)
    expect(dirhamsDActivite({ bonnes: 12, mauvaises: 0 })).toBe(22)
    expect(dirhamsDActivite({ bonnes: 12, mauvaises: 1 })).toBe(17)
    expect(dirhamsDActivite({ bonnes: 12, mauvaises: 5 })).toBe(12)
  })

  it('pas de bonus sans aucune bonne réponse', () => {
    expect(dirhamsDActivite({ bonnes: 0, mauvaises: 0 })).toBe(0)
  })

  it('total : activités, 60 par théière, 50 par trésor', () => {
    const activites = [
      { bonnes: 20, mauvaises: 0 },
      { bonnes: 10, mauvaises: 4 },
    ]
    expect(dirhamsGagnes({ activites, theieres: 2, tresors: 1 })).toBe(30 + 10 + 120 + 50)
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

  it('chaque rayon a au moins un article à acheter', () => {
    for (const c of ['espece', 'fond', 'objet', 'pot', 'couleur', 'zellige', 'sons', 'confettis']) {
      expect(ARTICLES.some((a) => a.categorie === c && a.prix > 0), c).toBe(true)
    }
  })

  it('au moins 4 articles par rayon', () => {
    for (const c of ['espece', 'fond', 'objet', 'pot', 'couleur', 'zellige', 'sons', 'confettis']) {
      expect(ARTICLES.filter((a) => a.categorie === c).length, c).toBeGreaterThanOrEqual(4)
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
