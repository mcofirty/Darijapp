import { describe, expect, it, vi } from 'vitest'
import { MOTIFS, activerHaptique, vibrer } from './haptique'

describe('vibrer', () => {
  it('utilise l’API de vibration quand elle existe, avec le motif de l’intensité', () => {
    const vibrate = vi.fn(() => true)
    vibrer('succes', { vibrate })
    expect(vibrate).toHaveBeenCalledWith(MOTIFS.succes.vibration)
  })
  it('se tait quand les retours haptiques sont coupés', () => {
    const vibrate = vi.fn(() => true)
    activerHaptique(false)
    vibrer('palier', { vibrate })
    activerHaptique(true)
    expect(vibrate).not.toHaveBeenCalled()
  })
  it('trois intensités croissantes', () => {
    expect(MOTIFS.leger.tics).toBeLessThan(MOTIFS.succes.tics)
    expect(MOTIFS.succes.tics).toBeLessThan(MOTIFS.palier.tics)
  })
})
