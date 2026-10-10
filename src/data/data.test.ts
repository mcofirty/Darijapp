import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MOTS, chercherMots, motsDuTheme } from '.'
import { SONS } from './sons'
import { THEMES } from './themes'
import type { Mot } from './types'

const dossier = join(__dirname)
const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.json'))
const parFichier = fichiers.map((f) => ({
  theme: f.replace('.json', ''),
  mots: JSON.parse(readFileSync(join(dossier, f), 'utf-8')) as Mot[],
}))
const tous = parFichier.flatMap((p) => p.mots)

// Lettres latines, chiffres de la translittération et ponctuation simple.
const LATIN_AUTORISE = /^[a-z379 ?!.,'’—/-]+$/i
const ARABE = /[؀-ۿ]/
const LETTRE_LATINE = /[a-z]/i

describe('fichiers de mots', () => {
  it('chaque thème déclaré a son fichier, et inversement', () => {
    expect(parFichier.map((p) => p.theme).sort()).toEqual(THEMES.map((t) => t.id).sort())
  })

  it('les identifiants sont uniques et suivent <theme>-NNN', () => {
    expect(new Set(tous.map((m) => m.id)).size).toBe(tous.length)
    for (const { theme, mots } of parFichier) {
      mots.forEach((m, i) => {
        expect(m.id).toBe(`${theme}-${String(i + 1).padStart(3, '0')}`)
        expect(m.theme).toBe(theme)
      })
    }
  })

  it('aucun mot en double', () => {
    expect(new Set(tous.map((m) => m.latin)).size).toBe(tous.length)
  })

  it.each(tous.map((m) => [m.id, m] as const))('%s respecte le format', (_, m) => {
    expect(m.latin).toMatch(LATIN_AUTORISE)
    expect(m.exemple.latin).toMatch(LATIN_AUTORISE)
    expect(m.arabe).toMatch(ARABE)
    expect(m.arabe).not.toMatch(LETTRE_LATINE)
    expect(m.exemple.arabe).toMatch(ARABE)
    expect(m.exemple.arabe).not.toMatch(LETTRE_LATINE)
    expect(m.fr.trim()).not.toBe('')
    expect(m.exemple.fr.trim()).not.toBe('')
    expect(m.prononciation.trim()).not.toBe('')
    expect([1, 2, 3]).toContain(m.niveau)
    expect(m.audio).toBe(`audio/${m.id}.mp3`)
    expect(m.exemple.audio).toBe(`audio/${m.id}-ex.mp3`)
  })

  it('le guide des sons utilise des mots présents dans les données', () => {
    for (const s of SONS) {
      expect(tous.some((m) => m.latin === s.exemple.latin && m.arabe === s.exemple.arabe)).toBe(true)
    }
  })
})

describe('chargement et recherche', () => {
  it('charge tous les mots dans l’ordre des thèmes', () => {
    expect(MOTS).toHaveLength(tous.length)
    expect(MOTS[0].theme).toBe(THEMES[0].id)
    expect(motsDuTheme('chiffres').every((m) => m.theme === 'chiffres')).toBe(true)
  })

  it('cherche en latin, en français sans accents et en arabe', () => {
    expect(chercherMots(MOTS, '3afak').map((m) => m.latin)).toContain('3afak')
    expect(chercherMots(MOTS, 'cafe').map((m) => m.latin)).toContain('9ahwa')
    expect(chercherMots(MOTS, 'خبز').map((m) => m.latin)).toContain('khobz')
    expect(chercherMots(MOTS, '  ')).toHaveLength(MOTS.length)
  })
})
