/**
 * Analyse à l'avance la voix de référence (MP3 de Jamal) de tout ce qui peut passer par Dis-le :
 * mots du programme, formes de grammaire, répliques à dire des dialogues, mots des paires de sons.
 * Le score précis n'a plus qu'à analyser l'essai : deux fois moins de calcul sur l'iPhone.
 *
 * Écrit public/modele/references.json : { "audio/<id>.mp3": { l: latin, s: [répartition de chaque son] } },
 * téléchargé avec le modèle. Un MP3 absent du fichier (généré plus tard) est analysé sur le téléphone.
 *
 *   npx tsx scripts/modele/references.ts      (ffmpeg, onnxruntime-node et le modèle dans public/modele)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import * as ort from 'onnxruntime-node'
import { reechantillonner } from '../../src/scoring/mfcc'
import { preparerAudio, type InfosModele } from '../../src/scoring/sons/modele'
import { evaluer, regrouper, sonsAttendus } from '../../src/scoring/sons/prononciation'

const lire = (f: string) => JSON.parse(readFileSync(f, 'utf8'))

/** Tout ce qui se dit dans Dis-le : chemin du MP3 et latin. */
function aDire(): Map<string, string> {
  const liste = new Map<string, string>()
  const ajouter = (audio: string | undefined, latin: string) => {
    if (audio && existsSync(`public/${audio}`)) liste.set(audio, latin)
  }
  for (const f of readdirSync('src/data').filter((f) => f.endsWith('.json'))) {
    const d = lire(`src/data/${f}`)
    if (Array.isArray(d)) for (const m of d) ajouter(m.audio, m.latin)
  }
  for (const l of lire('src/data/parler/grammaire.json').lecons) for (const f of l.formes) ajouter(f.audio, f.latin)
  for (const s of lire('src/data/parler/dialogues.json').scenes)
    for (const r of s.repliques)
      if (r.qui === 'moi') {
        ajouter(r.audio, r.latin)
        if (r.feminin) ajouter(r.feminin.audio, r.feminin.latin)
      }
  for (const m of lire('src/data/sons/paires.json').mots) ajouter(m.audio, m.latin)
  return liste
}

function decoder(chemin: string): Float32Array {
  const brut = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', chemin, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 26 })
  return reechantillonner(new Float32Array(brut.buffer.slice(brut.byteOffset, brut.byteOffset + brut.byteLength)), 48000)
}

const infos = lire('public/modele/xlsr.json') as InfosModele
const session = await ort.InferenceSession.create(Buffer.concat(infos.morceaux.map((m) => readFileSync(`public/modele/${m}`))))
const liste = aDire()
const references: Record<string, { l: string; s: Record<string, number>[] }> = {}
let n = 0
const debut = Date.now()
for (const [audio, latin] of liste) {
  const a = preparerAudio(decoder(`public/${audio}`), infos.normaliser)
  const r = await session.run({ audio: new ort.Tensor('float32', a, [1, a.length]) })
  const e = evaluer(regrouper(r.logits.data as Float32Array, r.logits.dims[1], infos.vocabulaire), sonsAttendus(latin))
  // Seules les probabilités d'au moins 0,5 % sont gardées, arrondies au millième.
  references[audio] = {
    l: latin,
    s: e.details.map((d) => Object.fromEntries(Object.entries(d.repartition).filter(([, p]) => p >= 0.005).map(([k, p]) => [k, Math.round(p * 1000) / 1000]))),
  }
  if (++n % 200 === 0) console.log(`${n}/${liste.size} (${Math.round((Date.now() - debut) / 1000)} s)`)
}
writeFileSync('public/modele/references.json', JSON.stringify(references))
console.log(`${n} références écrites dans public/modele/references.json`)
