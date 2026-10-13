import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { PAUSE_PHRASE, reechantillonner } from './mfcc'
import { distanceEssai, empreinte, scoreDeDistance } from './score'

/**
 * Calibrage du score sur des phrases (grammaire, dialogues), avec les MP3 de Jamal de deux leçons :
 * la même phrase rendue autrement, ou dite avec une pause de 0,6 s entre deux mots, reste réussie ;
 * une autre phrase de la leçon reste sous 60. Sans ffmpeg (ou sans les MP3), le test est sauté.
 */
const ffmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

const { lecons } = JSON.parse(readFileSync('src/data/parler/grammaire.json', 'utf8')) as {
  lecons: { id: string; formes: { id: string; latin: string }[] }[]
}
const phrases = lecons
  .filter((l) => l.id === 'futur' || l.id === 'questions')
  .flatMap((l) => l.formes.filter((f) => f.latin.includes(' ')).map((f) => ({ lecon: l.id, id: f.id })))
const presents = phrases.every((p) => existsSync(`public/audio/${p.id}.mp3`))

const RENDUS: Record<string, string> = {
  aigu: 'asetrate=24000*1.12,aresample=24000,atempo=0.95,highpass=f=100,lowpass=f=7000',
  grave: 'asetrate=24000*0.9,aresample=24000,atempo=1.2',
}

function decoder(id: string, filtre = 'anull'): Float32Array {
  const brut = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', `public/audio/${id}.mp3`, '-af', filtre, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], {
    maxBuffer: 1 << 26,
  })
  return reechantillonner(new Float32Array(brut.buffer.slice(brut.byteOffset, brut.byteOffset + brut.byteLength)), 48000)
}

/** Insère 0,6 s de silence au milieu de la phrase, comme un débutant qui cherche le mot suivant. */
function avecPause(signal: Float32Array): Float32Array {
  const milieu = Math.floor(signal.length / 2)
  const pause = Math.round(0.6 * 16000)
  const sortie = new Float32Array(signal.length + pause)
  sortie.set(signal.subarray(0, milieu), 0)
  sortie.set(signal.subarray(milieu), milieu + pause)
  return sortie
}

describe.skipIf(!ffmpeg || !presents)('calibrage du score sur des phrases', () => {
  const signaux = new Map<string, Float32Array>()
  beforeAll(() => {
    for (const p of phrases) {
      signaux.set(`${p.id}:original`, decoder(p.id))
      for (const [nom, filtre] of Object.entries(RENDUS)) signaux.set(`${p.id}:${nom}`, decoder(p.id, filtre))
    }
  }, 120000)
  const references = new Map<string, ReturnType<typeof empreinte>>()
  const score = (ref: string, essai: Float32Array) => {
    if (!references.has(ref)) references.set(ref, empreinte(signaux.get(`${ref}:original`)!, PAUSE_PHRASE))
    return scoreDeDistance(distanceEssai(references.get(ref)!, essai, PAUSE_PHRASE)!)
  }

  it('la même phrase, plus aiguë, plus grave ou coupée d’une pause, est réussie', () => {
    for (const p of phrases) {
      for (const nom of Object.keys(RENDUS)) expect(score(p.id, signaux.get(`${p.id}:${nom}`)!), `${p.id} ${nom}`).toBeGreaterThanOrEqual(60)
      expect(score(p.id, avecPause(signaux.get(`${p.id}:original`)!)), `${p.id} pause`).toBeGreaterThanOrEqual(80)
    }
  }, 60000)

  it('une autre phrase de la même leçon reste sous 60', () => {
    for (const p of phrases) {
      for (const q of phrases) {
        if (q.lecon === p.lecon && q.id !== p.id) expect(score(p.id, signaux.get(`${q.id}:original`)!), `${p.id} / ${q.id}`).toBeLessThan(60)
      }
    }
  }, 60000)
})
