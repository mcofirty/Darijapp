import { describe, expect, it } from 'vitest'
import { mustawa } from './collection'
import { Combo, multiplicateurXp } from './combo'
import { defiDuMois, defisReussis, valeurDefi } from './defis'
import { bilanDeLaSemaine, lundiDe } from './semaine'
import { calculerSerie, joursAGeler, reparationPossible, trouManque } from './serie'

describe('gel et réparation de la série', () => {
  // Pratiqué du 1er au 5, puis rien les 6 et 7 ; on est le 8.
  const jours = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']

  it('deux jours manqués cassent la série, sauf s’ils sont couverts (sans compter)', () => {
    expect(calculerSerie(jours, '2026-10-08').jours).toBe(0)
    expect(calculerSerie(jours, '2026-10-08', ['2026-10-06', '2026-10-07']).jours).toBe(5)
  })

  it('trouve le trou juste avant aujourd’hui', () => {
    expect(trouManque(jours, '2026-10-08')).toEqual(['2026-10-07', '2026-10-06'])
    expect(trouManque(jours, '2026-10-06')).toEqual([])
  })

  it('gèle seulement si la série en dépend et s’il y a assez de gels', () => {
    expect(joursAGeler(jours, '2026-10-08', [], 2)).toEqual(['2026-10-07', '2026-10-06'])
    expect(joursAGeler(jours, '2026-10-08', [], 1)).toEqual([])
    // Un seul jour manqué : le pardon automatique suffit, le gel est gardé.
    expect(joursAGeler(jours, '2026-10-07', [], 2)).toEqual([])
  })

  it('propose de réparer un oubli récent', () => {
    expect(reparationPossible(jours, '2026-10-08', [])).toEqual({ jours: ['2026-10-07', '2026-10-06'], serie: 5 })
    expect(reparationPossible(jours, '2026-10-09', [])).toBeNull()
    expect(reparationPossible(jours, '2026-10-06', [])).toBeNull()
  })
})

describe('défi du mois', () => {
  it('change de mesure chaque mois et se nomme avec son mois', () => {
    expect(defiDuMois('2026-10').titre).toBe('Défi d’octobre : 20 activités')
    expect(defiDuMois('2026-11').mesure).toBe('nouveaux')
    expect(defiDuMois('2026-12').titre).toBe('Défi de décembre : 300 XP')
  })

  it('compte le mois et liste les défis réussis', () => {
    const sessions = Array.from({ length: 20 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, xp: 20, nouveaux: 5 }))
    const datees = { sessions, bonus: [{ date: '2026-10-03', xp: 60 }] }
    expect(valeurDefi(defiDuMois('2026-10'), datees)).toBe(20)
    expect(defisReussis(datees).map((d) => d.mois)).toEqual(['2026-10'])
  })
})

describe('combo et double XP', () => {
  it('donne 1 XP de plus dès la 5e bonne réponse d’affilée et fête chaque palier de 5', () => {
    const c = new Combo()
    const paliers = [true, true, true, true, true, true, false, true].map((j) => c.noter(j))
    expect(paliers).toEqual([null, null, null, null, 5, null, null, null])
    expect(c.bonus).toBe(2)
    expect(c.suite).toBe(1)
  })

  it('double l’XP pendant la fenêtre seulement', () => {
    expect(multiplicateurXp(1000, 2000)).toBe(2)
    expect(multiplicateurXp(3000, 2000)).toBe(1)
    expect(multiplicateurXp(3000, null)).toBe(1)
  })
})

describe('mustawa d nnbta', () => {
  it('monte avec les mots retenus', () => {
    expect(mustawa([{ boite: 1 }, { boite: 2 }, { boite: 4 }])).toBe(14)
  })
})

describe('bilan de la semaine', () => {
  it('résume la semaine d’avant', () => {
    expect(lundiDe('2026-10-14')).toBe('2026-10-12')
    const b = bilanDeLaSemaine(
      [
        { date: '2026-10-06', xp: 30, nouveaux: 5 },
        { date: '2026-10-08', xp: 50, nouveaux: 5 },
        { date: '2026-10-13', xp: 10, nouveaux: 0 },
      ],
      [{ date: '2026-10-06', xp: 60 }],
      [{ latin: '7al' }, { latin: '7ell' }, { latin: '9elb' }],
      '2026-10-13',
    )
    expect(b).toMatchObject({ lundi: '2026-10-05', xp: 140, activites: 2, nouveaux: 10, joursActifs: 2, meilleurJour: { date: '2026-10-06', xp: 90 }, sons: ['7', '9'] })
    expect(bilanDeLaSemaine([], [], [], '2026-10-13')).toBeNull()
  })
})
