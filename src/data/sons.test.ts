import { describe, expect, it } from 'vitest'
import { sonsDuMot } from './sons'

describe('sonsDuMot', () => {
  it('repère les sons particuliers d’un mot', () => {
    expect(sonsDuMot('tsba7 3la khir').map((s) => s.latin)).toEqual(['3', '7', 'kh'])
    expect(sonsDuMot('ghali').map((s) => s.latin)).toEqual(['gh'])
    expect(sonsDuMot('9ahwa').map((s) => s.latin)).toEqual(['9'])
    expect(sonsDuMot('chokran').map((s) => s.latin)).toEqual(['ch'])
  })

  it('ne renvoie rien pour un mot sans son particulier', () => {
    expect(sonsDuMot('salam')).toEqual([])
  })

  it('ne compte chaque son qu’une fois', () => {
    expect(sonsDuMot('na3na3').map((s) => s.latin)).toEqual(['3'])
  })
})
