import { describe, expect, it, vi } from 'vitest'
import { bloquerZoom, plusieursDoigts } from './zoom'

describe('bloquerZoom', () => {
  it('annule le pincement de Safari et les déplacements à deux doigts, pas à un seul', () => {
    const ecouteurs = new Map<string, (e: Event) => void>()
    bloquerZoom({ addEventListener: ((type: string, f: (e: Event) => void) => ecouteurs.set(type, f)) as Document['addEventListener'] })
    const geste = { preventDefault: vi.fn() } as unknown as Event
    ecouteurs.get('gesturestart')!(geste)
    expect(geste.preventDefault).toHaveBeenCalled()

    const deux = { touches: { length: 2 }, preventDefault: vi.fn() } as unknown as Event
    const un = { touches: { length: 1 }, preventDefault: vi.fn() } as unknown as Event
    ecouteurs.get('touchmove')!(deux)
    ecouteurs.get('touchmove')!(un)
    expect(deux.preventDefault).toHaveBeenCalled()
    expect(un.preventDefault).not.toHaveBeenCalled()
  })
  it('compte les doigts', () => {
    expect(plusieursDoigts({ touches: { length: 2 } })).toBe(true)
    expect(plusieursDoigts({ touches: { length: 1 } })).toBe(false)
    expect(plusieursDoigts({})).toBe(false)
  })
})
