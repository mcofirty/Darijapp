import { describe, expect, it } from 'vitest'
import { fichierIcs } from './rappel'
import { FORMAT_SAUVEGARDE, lireSauvegarde, nomDuFichier, resumeSauvegarde } from './sauvegarde'

describe('lireSauvegarde', () => {
  const valide = {
    format: FORMAT_SAUVEGARDE,
    version: 1,
    date: '2026-10-13T08:00:00.000Z',
    tables: { progression: [{ id: 'salutations-001', boite: 2 }], sessions: [{ id: 1, date: '2026-10-12', xp: 20 }] },
  }

  it('accepte une sauvegarde et complète les tables absentes', () => {
    const s = lireSauvegarde(JSON.stringify(valide))
    expect(typeof s).toBe('object')
    if (typeof s === 'object') {
      expect(s.tables.progression).toHaveLength(1)
      expect(s.tables.marques).toEqual([])
      expect(resumeSauvegarde(s)).toBe('1 mot vu, 1 activité')
    }
  })

  it('refuse un fichier qui n’en est pas une, ou d’une version plus récente', () => {
    expect(lireSauvegarde('pas du json')).toMatch(/pas une sauvegarde/)
    expect(lireSauvegarde(JSON.stringify({ format: 'autre' }))).toMatch(/pas une sauvegarde/)
    expect(lireSauvegarde(JSON.stringify({ ...valide, version: 99 }))).toMatch(/plus récente/)
    expect(lireSauvegarde(JSON.stringify({ ...valide, tables: { progression: 'abîmé' } }))).toMatch(/abîmée/)
  })

  it('nomme le fichier avec la date', () => {
    expect(nomDuFichier('2026-10-13')).toBe('darijaapp-2026-10-13.json')
  })
})

describe('fichierIcs', () => {
  it('événement quotidien à l’heure choisie, avec alerte', () => {
    const ics = fichierIcs('19:00', '2026-10-13', 'https://mcofirty.github.io/Darijapp/')
    expect(ics).toContain('DTSTART:20261013T190000')
    expect(ics).toContain('DTEND:20261013T191000')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })

  it('passe à l’heure suivante et refuse une heure invalide', () => {
    expect(fichierIcs('08:55', '2026-10-13', 'x')).toContain('DTEND:20261013T090500')
    expect(() => fichierIcs('25:00', '2026-10-13', 'x')).toThrow()
  })
})
