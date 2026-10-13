import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { reechantillonner } from '../mfcc'
import { preparerAudio, type InfosModele } from './modele'
import { comparer, evaluer, regrouper, sonsAttendus, type Sorties } from './prononciation'

/**
 * Calibrage du score par sons avec le vrai modèle (onnxruntime-node) :
 * - 4 autres voix arabes d'Azure (scripts/modele/voix-test, 2 femmes, 2 hommes) disent les 26 mots des paires ;
 *   comparées à Jamal, elles doivent réussir le bon mot et échouer sur le mot voisin (9elb / kelb…) ;
 * - les rendus de Jamal (ralenti, plus aigu, plus grave) du même mot réussissent.
 * Sans ffmpeg ou sans le modèle (public/modele), le test est sauté.
 */
const ffmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()
const modele = existsSync('public/modele/xlsr.json')
const VOIX = ['ar-MA-MounaNeural', 'ar-EG-SalmaNeural', 'ar-SA-HamedNeural', 'ar-DZ-IsmaelNeural']
const RENDUS: Record<string, string> = {
  ralenti: 'atempo=0.8',
  aigu: 'asetrate=24000*1.12,aresample=24000,atempo=0.95,highpass=f=100,lowpass=f=7000',
  grave: 'asetrate=24000*0.9,aresample=24000,atempo=1.2',
}

function decoder(chemin: string, filtre = 'anull'): Float32Array {
  const brut = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', chemin, '-af', filtre, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 26 })
  return reechantillonner(new Float32Array(brut.buffer.slice(brut.byteOffset, brut.byteOffset + brut.byteLength)), 48000)
}

const { mots, paires } = JSON.parse(readFileSync('src/data/sons/paires.json', 'utf8')) as {
  mots: { id: string; latin: string }[]
  paires: { a: string; b: string }[]
}
const latin = Object.fromEntries(mots.map((m) => [m.id, m.latin]))

describe.skipIf(!ffmpeg || !modele)('calibrage du score par sons', () => {
  const sorties = new Map<string, Sorties>()
  beforeAll(async () => {
    const ort = await import('onnxruntime-node')
    const infos = JSON.parse(readFileSync('public/modele/xlsr.json', 'utf8')) as InfosModele
    const session = await ort.InferenceSession.create(Buffer.concat(infos.morceaux.map((m) => readFileSync(`public/modele/${m}`))))
    const ecouter = async (signal: Float32Array) => {
      const a = preparerAudio(signal, infos.normaliser)
      const r = await session.run({ audio: new ort.Tensor('float32', a, [1, a.length]) })
      return regrouper(r.logits.data as Float32Array, r.logits.dims[1], infos.vocabulaire)
    }
    for (const m of mots) {
      sorties.set(`jamal:${m.id}`, await ecouter(decoder(`public/audio/${m.id}.mp3`)))
      for (const [r, f] of Object.entries(RENDUS)) sorties.set(`${r}:${m.id}`, await ecouter(decoder(`public/audio/${m.id}.mp3`, f)))
      for (const v of VOIX) sorties.set(`${v}:${m.id}`, await ecouter(decoder(`scripts/modele/voix-test/${v}/${m.id}.mp3`)))
    }
  }, 900000)

  const score = (attendu: string, voix: string, dit: string) => {
    const att = sonsAttendus(latin[attendu])
    return comparer(evaluer(sorties.get(`jamal:${attendu}`)!, att), evaluer(sorties.get(`${voix}:${dit}`)!, att)).score
  }
  const essais = (voix: string[]) =>
    paires.flatMap((p) => [[p.a, p.b], [p.b, p.a]]).flatMap(([x, y]) => voix.map((v) => ({ bon: score(x, v, x), voisin: score(x, v, y) })))

  it('d’autres voix : le bon mot réussit, le mot voisin échoue (le plus souvent)', () => {
    const e = essais(VOIX)
    const reussis = e.filter((x) => x.bon >= 60).length
    const refuses = e.filter((x) => x.voisin < 60).length
    console.log(`autres voix : bon mot réussi ${reussis}/${e.length}, mot voisin refusé ${refuses}/${e.length}`)
    expect(reussis / e.length).toBeGreaterThanOrEqual(0.75)
    expect(refuses / e.length).toBeGreaterThanOrEqual(0.78)
  })

  it('les rendus de Jamal du même mot réussissent', () => {
    const e = essais(Object.keys(RENDUS))
    const reussis = e.filter((x) => x.bon >= 60).length
    const refuses = e.filter((x) => x.voisin < 60).length
    console.log(`rendus de Jamal : bon mot réussi ${reussis}/${e.length}, mot voisin refusé ${refuses}/${e.length}`)
    expect(reussis / e.length).toBeGreaterThanOrEqual(0.9)
    // Le modèle ne donne pas tout à fait les mêmes nombres selon le processeur : 64/84 dans Claude Code,
    // 62/84 sur certaines machines de GitHub. Seuil laissé sous ces deux valeurs.
    expect(refuses / e.length).toBeGreaterThanOrEqual(0.72)
  })
}, 900000)
