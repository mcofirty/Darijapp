import { describe, expect, it } from 'vitest'
import { validerMot } from '../data/motsPerso'
import { SCENES, aDire, accorder, meilleurResultat, propositionsReplique, repliquesDe } from './dialogues'

describe('données des dialogues', () => {
  it('8 scènes de 4 à 6 répliques, dont 2 ou 3 à dire', () => {
    expect(SCENES).toHaveLength(8)
    for (const s of SCENES) {
      expect(s.repliques.length).toBeGreaterThanOrEqual(4)
      expect(s.repliques.length).toBeLessThanOrEqual(6)
      expect(aDire(s)).toBeGreaterThanOrEqual(2)
      expect(aDire(s)).toBeLessThanOrEqual(3)
    }
  })

  it('chaque réplique (et sa version au féminin) respecte la translittération et nomme son MP3', () => {
    const ids: string[] = []
    for (const s of SCENES) {
      s.repliques.forEach((r, i) => {
        expect(r.id).toBe(`dia-${s.id}-${i + 1}`)
        for (const t of r.feminin ? [r, r.feminin] : [r]) {
          ids.push(t.id)
          expect(validerMot(t), `${t.latin} / ${t.arabe}`).toEqual({})
          expect(t.audio).toBe(`audio/${t.id}.mp3`)
        }
        if (r.feminin) {
          expect(r.feminin.id).toBe(`${r.id}-f`)
          expect(r.feminin.arabe).not.toBe(r.arabe)
        }
      })
    }
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('accorder', () => {
  const scene = SCENES.find((s) => s.id === 'voisine')!

  it('masculin par défaut, féminin quand le profil le dit', () => {
    expect(repliquesDe(scene, null).map((r) => r.latin)).toEqual(repliquesDe(scene, 'm').map((r) => r.latin))
    expect(repliquesDe(scene, 'f')[3].latin).toBe('la, ana fransawiya')
    expect(repliquesDe(scene, 'm')[3].latin).toBe('la, ana fransawi')
  })

  it('une réplique sans version féminine reste la même', () => {
    const r = scene.repliques[5]
    expect(r.feminin).toBeUndefined()
    expect(accorder(r, 'f')).toMatchObject({ latin: r.latin, audio: r.audio, qui: 'moi' })
  })
})

describe('meilleurResultat', () => {
  it('garde le meilleur nombre de répliques réussies', () => {
    expect(meilleurResultat({}, 'cafe', 0)).toEqual({ cafe: 0 })
    expect(meilleurResultat({ cafe: 2 }, 'cafe', 1)).toEqual({ cafe: 2 })
    expect(meilleurResultat({ cafe: 2 }, 'cafe', 3)).toEqual({ cafe: 3 })
  })
})

describe('propositionsReplique', () => {
  it('4 répliques à dire, dont la bonne, toutes différentes, accordées au genre', () => {
    for (const genre of ['m', 'f'] as const) {
      for (const s of SCENES) {
        for (const r of repliquesDe(s, genre).filter((x) => x.qui === 'moi')) {
          const choix = propositionsReplique(r, s, genre)
          expect(choix).toHaveLength(4)
          expect(choix.map((c) => c.id)).toContain(r.id)
          expect(new Set(choix.map((c) => c.latin)).size).toBe(4)
          expect(new Set(choix.map((c) => c.fr)).size).toBe(4)
          const aDireAccordees = SCENES.flatMap((x) => repliquesDe(x, genre)).filter((x) => x.qui === 'moi').map((x) => x.id)
          expect(choix.every((c) => aDireAccordees.includes(c.id))).toBe(true)
        }
      }
    }
  })
})
