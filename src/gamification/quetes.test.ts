import { describe, expect, it } from 'vitest'
import { QUETES, QUETE_SESSION, avancement, quetesDuJour, statsDuJour } from './quetes'

describe('quetesDuJour', () => {
  it('3 quêtes différentes, dont toujours la session du jour', () => {
    for (let j = 1; j <= 28; j++) {
      const date = `2026-10-${String(j).padStart(2, '0')}`
      const q = quetesDuJour(date)
      expect(q).toHaveLength(3)
      expect(q[0]).toBe(QUETE_SESSION)
      expect(new Set(q.map((x) => x.id)).size).toBe(3)
    }
  })

  it('les mêmes toute la journée, et elles varient d’un jour à l’autre', () => {
    expect(quetesDuJour('2026-10-13')).toEqual(quetesDuJour('2026-10-13'))
    const ids = new Set(Array.from({ length: 20 }, (_, i) => quetesDuJour(`2026-11-${String(i + 1).padStart(2, '0')}`)[1].id))
    expect(ids.size).toBeGreaterThan(3)
  })

  it('chaque quête de la liste peut sortir', () => {
    const vues = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const d = new Date(2026, 0, 1 + i)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      quetesDuJour(date).forEach((q) => vues.add(q.id))
    }
    for (const q of QUETES) expect(vues).toContain(q.id)
  })
})

describe('statsDuJour et avancement', () => {
  const activites = [
    { xp: 27, bonnes: 12, mauvaises: 0, nouveaux: 5 }, // ancienne session, sans type
    { type: 'quiz', xp: 14, bonnes: 4, mauvaises: 1, nouveaux: 0 },
    { type: 'express', xp: 10, bonnes: 0, mauvaises: 0, nouveaux: 0 },
  ]

  it('compte les activités par type, les sans-faute, l’XP, les nouveaux mots et les écoutes', () => {
    expect(statsDuJour(activites, 7)).toEqual({
      sessions: 1,
      quiz: 1,
      express: 1,
      sons: 0,
      sansFaute: 1,
      xp: 51,
      nouveaux: 5,
      ecoutes: 7,
    })
  })

  it('une quête est faite quand l’objectif est atteint, sans dépasser l’objectif', () => {
    const stats = statsDuJour(activites, 7)
    expect(avancement(QUETE_SESSION, stats)).toMatchObject({ valeur: 1, faite: true })
    expect(avancement(QUETES.find((q) => q.id === 'ecoute')!, stats)).toMatchObject({ valeur: 7, faite: false })
    expect(avancement(QUETES.find((q) => q.id === 'xp')!, stats)).toMatchObject({ valeur: 40, faite: true })
  })
})
