import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Fichiers de l'appli (code, données, styles), tests compris. */
function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) return fichiers(chemin)
    return /\.(tsx?|json|css)$/.test(nom) ? [chemin] : []
  })
}

// Un emoji s'affiche en couleur (Emoji_Presentation) ou est forcé en emoji par le sélecteur U+FE0F.
// Les symboles typographiques (★ du passeport, ✓, →) restent permis.
const EMOJI = /[\p{Emoji_Presentation}\uFE0F]/u

describe("pas d'emoji dans l'appli", () => {
  it('aucun fichier de src/ ne contient d’emoji : les illustrations sont dessinées (SVG, Lucide)', () => {
    const fautifs = fichiers('src').filter((f) => EMOJI.test(readFileSync(f, 'utf8')))
    expect(fautifs).toEqual([])
  })
})
