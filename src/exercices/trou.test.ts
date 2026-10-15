import { describe, expect, it } from 'vitest'
import { MOTS } from '../data'
import { glossaire, motsTouchables } from './glossaire'
import { adapterEtapes } from './modes'
import { composerSession, etapeARefaire } from './session'
import { phraseAvecTrou, questionTrou, trouPossible } from './trou'

const graine = (n: number) => {
  let x = n
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280)
}

describe('phrase à trou', () => {
  const mot = MOTS.find(trouPossible)!

  it('trouve des mots dont l’exemple contient le mot tel quel', () => {
    expect(MOTS.filter(trouPossible).length).toBeGreaterThan(300)
  })

  it('retire le mot de la phrase et propose 4 réponses distinctes, absentes de la phrase sauf la bonne', () => {
    const q = questionTrou(mot, MOTS, graine(1))
    if (q.type !== 'trou') throw new Error('type')
    expect(q.morceaux[q.trou].toLowerCase()).toBe(mot.latin.toLowerCase())
    expect(new Set(q.choix).size).toBe(4)
    expect(q.choix).toContain(q.morceaux[q.trou])
    const autres = q.choix.filter((c) => c !== q.morceaux[q.trou])
    for (const c of autres) expect(q.morceaux.map((m) => m.toLowerCase())).not.toContain(c.toLowerCase())
    expect(phraseAvecTrou(q.morceaux, q.trou)).toContain('_____')
  })

  it('entre dans une session avec l’option, et passe à l’écrit sans parler', () => {
    const revisions = MOTS.filter(trouPossible).slice(0, 6)
    const etapes = composerSession([], revisions, MOTS, graine(2), [], 0, { trou: true })
    const trous = etapes.filter((e) => e.type === 'trou')
    expect(trous).toHaveLength(1)
    const oral = { ...trous[0], oral: true } as (typeof trous)[0]
    expect(adapterEtapes([oral], { parler: false, ecouter: true })[0]).toMatchObject({ type: 'trou', oral: false })
  })

  it('revient en fin de session à l’écrit, pas à l’oral', () => {
    const q = questionTrou(mot, MOTS, graine(3))
    expect(etapeARefaire(q, MOTS)).toMatchObject({ type: 'trou' })
    expect(etapeARefaire({ ...q, oral: true } as typeof q, MOTS)).toBeNull()
  })
})

describe('indice au toucher', () => {
  it('traduit les mots connus d’une phrase, ponctuation comprise', () => {
    const g = glossaire(MOTS)
    const mot = MOTS.find((m) => !/\s/.test(m.latin))!
    const morceaux = motsTouchables(`${mot.latin}, inconnuxyz`, g)
    expect(morceaux[0]).toEqual({ mot: `${mot.latin},`, fr: g.get(mot.latin.toLowerCase()) })
    expect(morceaux[1].fr).toBeNull()
  })
})
