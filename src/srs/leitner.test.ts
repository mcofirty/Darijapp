import { describe, expect, it } from 'vitest'
import { ajouterJours, dateLocale } from './dates'
import { apresReponse, motsAReviser, nouveauxMots, type EtatSrs } from './leitner'

const J = '2026-10-12'

describe('dates', () => {
  it('formate en heure locale', () => {
    expect(dateLocale(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('ajoute des jours en passant les mois', () => {
    expect(ajouterJours('2026-10-30', 3)).toBe('2026-11-02')
    expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('apresReponse', () => {
  it('un nouveau mot réussi revient dans 3 jours', () => {
    expect(apresReponse('m', undefined, true, J)).toEqual({
      id: 'm', boite: 2, prochaineRevision: '2026-10-15', reussites: 1, echecs: 0,
    })
  })

  it('un mot raté revient le lendemain, en boîte 1', () => {
    const e = apresReponse('m', undefined, false, J)
    expect(e.boite).toBe(1)
    expect(e.prochaineRevision).toBe('2026-10-13')
    expect(e.echecs).toBe(1)
  })

  it('les réussites successives donnent 3, 7 puis 21 jours, et restent à 21', () => {
    let e: EtatSrs | undefined
    const delais = []
    for (let i = 0; i < 4; i++) {
      e = apresReponse('m', e, true, J)
      delais.push(e.prochaineRevision)
    }
    expect(delais).toEqual(['2026-10-15', '2026-10-19', '2026-11-02', '2026-11-02'])
    expect(e!.boite).toBe(4)
  })

  it('un mot raté après un échec repart à 3 jours s’il est réussi', () => {
    const rate = apresReponse('m', undefined, false, J)
    expect(apresReponse('m', rate, true, J).prochaineRevision).toBe('2026-10-15')
  })

  it('un mot bien su redescend en boîte 1 en cas d’échec', () => {
    const su: EtatSrs = { id: 'm', boite: 4, prochaineRevision: J, reussites: 6, echecs: 0 }
    expect(apresReponse('m', su, false, J)).toMatchObject({ boite: 1, reussites: 6, echecs: 1 })
  })
})

describe('sélection des mots', () => {
  const etat = (id: string, prochaineRevision: string, boite = 2): EtatSrs => ({
    id, boite, prochaineRevision, reussites: 1, echecs: 0,
  })

  it('garde les mots dus, les plus en retard d’abord', () => {
    const r = motsAReviser([etat('a', '2026-10-12'), etat('b', '2026-10-20'), etat('c', '2026-10-01')], J)
    expect(r.map((e) => e.id)).toEqual(['c', 'a'])
  })

  it('prend les mots jamais vus dans l’ordre', () => {
    const tous = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    expect(nouveauxMots(tous, new Set(['b']), 2).map((m) => m.id)).toEqual(['a', 'c'])
  })
})
