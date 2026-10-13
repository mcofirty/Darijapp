import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sonsAttendus } from './prononciation'

/**
 * public/modele/references.json (voix de Jamal analysée à l'avance) doit suivre le contenu : si le latin
 * d'un mot change, sa référence est périmée. La refaire : npx tsx scripts/modele/references.ts
 */
const lire = (f: string) => JSON.parse(readFileSync(f, 'utf8'))
const fichier = 'public/modele/references.json'

describe.skipIf(!existsSync(fichier))('références du score précis', () => {
  it('chaque référence correspond au latin actuel de son MP3', () => {
    const latins = new Map<string, string>()
    for (const f of readdirSync('src/data').filter((f) => f.endsWith('.json'))) {
      const d = lire(`src/data/${f}`)
      if (Array.isArray(d)) for (const m of d) latins.set(m.audio, m.latin)
    }
    for (const l of lire('src/data/parler/grammaire.json').lecons) for (const f of l.formes) latins.set(f.audio, f.latin)
    for (const s of lire('src/data/parler/dialogues.json').scenes)
      for (const r of s.repliques) {
        latins.set(r.audio, r.latin)
        if (r.feminin) latins.set(r.feminin.audio, r.feminin.latin)
      }
    for (const m of lire('src/data/sons/paires.json').mots) latins.set(m.audio, m.latin)
    const references = lire(fichier) as Record<string, { l: string; s: unknown[] }>
    const perimees = Object.entries(references)
      .filter(([audio, r]) => latins.get(audio) !== r.l || r.s.length !== sonsAttendus(r.l).length)
      .map(([audio]) => audio)
    expect(perimees, 'références périmées : npx tsx scripts/modele/references.ts').toEqual([])
  })
})
