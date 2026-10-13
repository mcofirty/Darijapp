import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { reechantillonner } from './mfcc'
import { distanceEssai, empreinte, scoreDeDistance } from './score'

/**
 * Calibrage du score sur les vrais MP3 de Jamal (règle du cahier des charges) :
 * deux rendus du même mot dépassent 80, deux mots proches restent sous 60.
 * Les « autres rendus » sont fabriqués par ffmpeg : ralenti, voix plus aiguë dans la bande d'un
 * micro de téléphone, voix plus grave et plus rapide. Décodés à 48 kHz comme dans Safari, puis
 * rééchantillonnés par l'appli. Sans ffmpeg (ou sans les MP3), le test est sauté.
 */
const ffmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

const { mots, paires } = JSON.parse(readFileSync('src/data/sons/paires.json', 'utf8')) as {
  mots: { id: string }[]
  paires: { a: string; b: string }[]
}
const presents = mots.every((m) => existsSync(`public/audio/${m.id}.mp3`))

const RENDUS: Record<string, string> = {
  original: 'anull',
  ralenti: 'atempo=0.8',
  aigu: 'asetrate=24000*1.12,aresample=24000,atempo=0.95,highpass=f=100,lowpass=f=7000',
  grave: 'asetrate=24000*0.9,aresample=24000,atempo=1.2',
}

function decoder(id: string, filtre: string): Float32Array {
  const brut = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', `public/audio/${id}.mp3`, '-af', filtre, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], {
    maxBuffer: 1 << 26,
  })
  return reechantillonner(new Float32Array(brut.buffer.slice(brut.byteOffset, brut.byteOffset + brut.byteLength)), 48000)
}

describe.skipIf(!ffmpeg || !presents)('calibrage sur la voix de Jamal', () => {
  const signaux = new Map<string, Float32Array>(mots.flatMap((m) => Object.entries(RENDUS).map(([r, f]) => [`${m.id}:${r}`, decoder(m.id, f)] as const)))
  const references = new Map(mots.map((m) => [m.id, empreinte(signaux.get(`${m.id}:original`)!)]))
  const score = (ref: string, essai: string) => scoreDeDistance(distanceEssai(references.get(ref)!, signaux.get(essai)!)!)

  it.each(mots.map((m) => m.id))('%s : un autre rendu du même mot dépasse 80', (id) => {
    for (const r of ['ralenti', 'aigu', 'grave']) expect(score(id, `${id}:${r}`), r).toBeGreaterThan(80)
  })

  it.each(paires.map((p) => [p.a, p.b]))('%s / %s : deux mots proches restent sous 60', (a, b) => {
    for (const r of Object.keys(RENDUS)) {
      expect(score(a, `${b}:${r}`), r).toBeLessThan(60)
      expect(score(b, `${a}:${r}`), r).toBeLessThan(60)
    }
  })
}, 60000)
