import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { ETAPES, etatsDuVoyage, motsDeLEtape } from '../gamification/voyage'
import { ajouterJours } from '../srs/dates'
import { BLOCS_MAX, QUESTIONS_EPREUVE, QUESTIONS_LEGENDAIRE, blocSu, blocsDuProgramme, composerEpreuve, composerLegendaire, guideDeLEtape, progressionsSautees, questionsDuBloc } from './epreuves'

const graine = (n: number) => {
  let x = n
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280)
}

describe('épreuves du Parcours', () => {
  const tanger = ETAPES[0]
  const ids = new Set(motsDeLEtape(tanger, MOTS).map((m) => m.id))

  it('l’épreuve d’étape pose 10 questions sur des mots de l’étape', () => {
    const e = composerEpreuve(tanger, MOTS, graine(1))
    expect(e).toHaveLength(QUESTIONS_EPREUVE)
    for (const q of e) expect(q.type === 'ecoute' || q.type === 'traduis' ? ids.has(q.mot.id) : false).toBe(true)
  })

  it('l’épreuve légendaire mélange traductions, phrases et darija de mémoire', () => {
    const e = composerLegendaire(tanger, MOTS, graine(2))
    expect(e).toHaveLength(QUESTIONS_LEGENDAIRE)
    expect(new Set(e.map((q) => q.type)).size).toBeGreaterThanOrEqual(3)
    expect(e.some((q) => q.type === 'disle' && q.inverse)).toBe(true)
  })

  it('une étape validée par son épreuve a son tampon, et le tampon doré seulement avec', () => {
    const etats = etatsDuVoyage(MOTS, [], ['tanger'], ['tanger', 'fes'])
    expect(etats[0]).toMatchObject({ tampon: true, legendaire: true })
    expect(etats[3]).toMatchObject({ tampon: false, legendaire: false })
  })

  it('le guide donne des mots clés de chaque thème et le son du darija le plus présent', () => {
    const g = guideDeLEtape(tanger, MOTS)
    expect(g.cles.length).toBe(tanger.themes.length * 3)
    expect(g.son).not.toBeNull()
    expect(g.exemple?.latin).toContain(g.son!.latin)
  })
})

describe('test de niveau', () => {
  it('coupe le programme en blocs et pose 3 questions par bloc', () => {
    const blocs = blocsDuProgramme(MOTS)
    expect(blocs).toHaveLength(BLOCS_MAX)
    expect(blocs[0][0]).toBe(MOTS[0])
    const q = questionsDuBloc(blocs[2], graine(3))
    expect(q).toHaveLength(3)
    for (const x of q) if (x.type === 'traduis') for (const c of x.choix) expect(blocs[2]).toContain(c)
  })

  it('un bloc est su à 2 bonnes réponses sur 3', () => {
    expect(blocSu(2)).toBe(true)
    expect(blocSu(1)).toBe(false)
  })

  it('les mots sautés passent en boîte 2, révisions étalées sur 14 jours', () => {
    const p = progressionsSautees(MOTS.slice(0, 30), '2026-10-15', ajouterJours)
    expect(p.every((x) => x.boite === 2)).toBe(true)
    expect(new Set(p.map((x) => x.prochaineRevision)).size).toBe(14)
    expect(p[0].prochaineRevision).toBe('2026-10-16')
  })
})
