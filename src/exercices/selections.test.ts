import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { motsDifficiles, ordonnerThemes, texteSignalements } from './selections'

const etat = (id: string, boite: number, echecs: number, reussites = 0) => ({ id, boite, echecs, reussites, prochaineRevision: '2026-10-12' })

describe('motsDifficiles', () => {
  it('les mots ratés pas encore installés, les plus ratés d’abord', () => {
    const progressions = [
      etat(MOTS[0].id, 1, 1),
      etat(MOTS[1].id, 1, 3),
      etat(MOTS[2].id, 4, 5), // bien su maintenant : plus difficile
      etat(MOTS[3].id, 2, 0), // jamais raté
      etat(MOTS[4].id, 2, 1, 4),
      etat(MOTS[5].id, 2, 1, 1),
    ]
    expect(motsDifficiles(progressions, MOTS).map((m) => m.id)).toEqual([MOTS[1].id, MOTS[0].id, MOTS[5].id, MOTS[4].id])
  })
})

describe('texteSignalements', () => {
  it('liste chaque mot avec son identifiant, ses écritures et le motif', () => {
    const texte = texteSignalements([{ id: MOTS[0].id, motif: 'traduction' }, { id: 'disparu-001', motif: 'ecriture' }], MOTS)
    expect(texte.split('\n')).toEqual([
      'Mots signalés dans Darijaapp (1) :',
      `- ${MOTS[0].id} : ${MOTS[0].latin} / ${MOTS[0].arabe} = ${MOTS[0].fr} → à vérifier : la traduction`,
    ])
  })
})

describe('ordonnerThemes', () => {
  const themes = [
    { id: 'a', mots: ['a1', 'a2'] },
    { id: 'b', mots: ['b1', 'b2', 'b3', 'b4'] },
    { id: 'c', mots: ['c1', 'c2'] },
    { id: 'd', mots: ['d1', 'd2', 'd3', 'd4'] },
    { id: 'e', mots: ['e1'] },
  ]
  it('en cours d’abord (les plus avancés en tête), puis à commencer dans l’ordre, puis terminés', () => {
    const vus = new Set(['a1', 'a2', 'b1', 'd1', 'd2', 'd3'])
    expect(ordonnerThemes(themes, vus).map((t) => t.id)).toEqual(['d', 'b', 'c', 'e', 'a'])
  })
  it('sans mot vu : l’ordre du programme, avec le nombre de mots vus', () => {
    expect(ordonnerThemes(themes, new Set())).toEqual(themes.map((t) => ({ id: t.id, total: t.mots.length, vus: 0 })))
  })
})
