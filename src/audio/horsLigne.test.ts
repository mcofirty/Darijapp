import { describe, expect, it } from 'vitest'
import { audiosManquants, nomAudio } from './horsLigne'

describe('audio hors ligne', () => {
  it('retrouve le nom du MP3 dans l’adresse gardée en cache', () => {
    expect(nomAudio('https://mcofirty.github.io/Darijapp/audio/salutations-001.mp3')).toBe('salutations-001.mp3')
    expect(nomAudio('https://mcofirty.github.io/Darijapp/audio/salutations-001-ex.mp3?v=2')).toBe('salutations-001-ex.mp3')
    expect(nomAudio('https://mcofirty.github.io/Darijapp/modele/xlsr.json')).toBeNull()
  })

  it('liste les MP3 qui manquent encore, dans l’ordre', () => {
    expect(audiosManquants(['a.mp3', 'b.mp3', 'c.mp3'], new Set(['b.mp3']))).toEqual(['a.mp3', 'c.mp3'])
    expect(audiosManquants(['a.mp3'], new Set(['a.mp3', 'vieux.mp3']))).toEqual([])
  })
})
