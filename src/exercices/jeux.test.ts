import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { validerMot } from '../data/motsPerso'
import { ARTICLES_SOUK, DESTINATIONS, MOTS_TAXI, REPLIQUES, TAILLE_PLAN, negociation, nouvelleCourse, optionsDePrix, remise, tourner } from './jeux'

function graine(n: number) {
  return () => {
    n = (n * 16807) % 2147483647
    return n / 2147483647
  }
}

describe('marchandage', () => {
  it('chaque phrase du marchand respecte la translittération, et les prix baissent', () => {
    for (const a of ARTICLES_SOUK) {
      for (const p of a.prix) {
        expect(validerMot(p), `${p.latin} / ${p.arabe}`).toEqual({})
        expect(p.audio).toBe(`audio/${p.id}.mp3`)
      }
      expect(a.prix[0].montant).toBeGreaterThan(a.prix[1].montant)
      expect(a.prix[1].montant).toBeGreaterThan(a.prix[2].montant)
      expect(remise(a)).toBeGreaterThan(0)
    }
  })

  it('les répliques sont des mots du programme', () => {
    const ids = new Set(MOTS.map((m) => m.id))
    for (const id of [REPLIQUES.tropCher, REPLIQUES.dernierPrix, REPLIQUES.jeLePrends, ...REPLIQUES.leurres]) expect(ids).toContain(id)
  })

  it('4 montants distincts et positifs, dont le bon', () => {
    for (const m of [40, 150, 600, 1000]) {
      const o = optionsDePrix(m, graine(m))
      expect(o).toHaveLength(4)
      expect(o).toContain(m)
      expect(new Set(o).size).toBe(4)
      expect(o.every((x) => x > 0)).toBe(true)
    }
  })

  it('une négociation : prix, trop cher, prix, dernier prix, prix, je le prends', () => {
    const etapes = negociation(ARTICLES_SOUK[0], MOTS, graine(3))
    expect(etapes.map((e) => e.type)).toEqual(['prix', 'replique', 'prix', 'replique', 'prix', 'replique'])
    const repliques = etapes.filter((e) => e.type === 'replique')
    expect(repliques.map((r) => (r.type === 'replique' ? r.bonne.id : ''))).toEqual([REPLIQUES.tropCher, REPLIQUES.dernierPrix, REPLIQUES.jeLePrends])
    for (const r of repliques) if (r.type === 'replique') expect(r.choix.map((c) => c.id)).toContain(r.bonne.id)
  })
})

describe('taxi', () => {
  it('les consignes et destinations sont des mots du programme', () => {
    const ids = new Set(MOTS.map((m) => m.id))
    for (const id of [...Object.values(MOTS_TAXI).flat(), ...DESTINATIONS]) expect(ids).toContain(id)
  })

  it('tourner à droite puis à gauche revient à la même direction', () => {
    expect(tourner(0, 'limen')).toBe(1)
    expect(tourner(0, 'lisser')).toBe(3)
    expect(tourner(tourner(2, 'limen'), 'lisser')).toBe(2)
  })

  it('une course reste dans le plan, ne repasse jamais par une case et finit par « 7bes hna »', () => {
    for (let g = 1; g < 60; g++) {
      const c = nouvelleCourse(graine(g))
      expect(c.consignes.at(-1)).toBe('stop')
      expect(c.consignes.slice(0, -1).some((x) => x !== 'nichan')).toBe(true)
      expect(c.chemin).toHaveLength(c.consignes.length)
      expect(new Set(c.chemin.map((p) => `${p.x},${p.y}`)).size).toBe(c.chemin.length)
      expect(c.chemin.every((p) => p.x >= 0 && p.y >= 0 && p.x < TAILLE_PLAN && p.y < TAILLE_PLAN)).toBe(true)
      // Chaque pas avance d'une seule case.
      for (let i = 1; i < c.chemin.length; i++) {
        expect(Math.abs(c.chemin[i].x - c.chemin[i - 1].x) + Math.abs(c.chemin[i].y - c.chemin[i - 1].y)).toBe(1)
      }
    }
  })
})
