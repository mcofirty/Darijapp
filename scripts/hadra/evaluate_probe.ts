/** Diagnostic Common Voice du pilote ; ne certifie ni IPA ni prononciation darija. */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import * as ort from 'onnxruntime-node'
import { preparerAudio } from '../../src/scoring/sons/modele'
import { evaluer, regrouper, sonsAttendus } from '../../src/scoring/sons/prononciation'

const root = process.cwd()
const infos = JSON.parse(readFileSync(`${root}/public/modele/xlsr.json`, 'utf8'))
const report = JSON.parse(readFileSync(`${root}/docs/hadra/probe/report.json`, 'utf8'))
const session = await ort.InferenceSession.create(Buffer.concat(infos.morceaux.map((name: string) => readFileSync(`${root}/public/modele/${name}`))), { intraOpNumThreads: 2 })
const outputs = []
for (const record of report.records) {
  if (!record.mp3) {
    outputs.push({ key: record.key, prompt: record.prompt, analyses: [], unavailable: 'technical_rejection' })
    continue
  }
  const candidates = [{ origin: 'hadra', path: `${root}/docs/hadra/probe/${record.mp3}` }, { origin: 'jamal', path: `${root}/public/${record.audio}` }]
  const analyses = []
  for (const candidate of candidates) {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', candidate.path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 26 })
    const wave = preparerAudio(new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)), infos.normaliser)
    const r = await session.run({ audio: new ort.Tensor('float32', wave, [1, wave.length]) })
    const logits = r.logits.data as Float32Array
    const tokens: string[] = []
    let previous = -1
    for (let t = 0; t < r.logits.dims[1]; t++) {
      let index = 0
      const base = t * infos.vocabulaire.length
      for (let i = 1; i < infos.vocabulaire.length; i++) if (logits[base + i] > logits[base + index]) index = i
      if (index && index !== previous) tokens.push(infos.vocabulaire[index])
      previous = index
    }
    const assessment = evaluer(regrouper(logits, r.logits.dims[1], infos.vocabulaire), sonsAttendus(record.prompt))
    analyses.push({ origin: candidate.origin, decoded_tokens: tokens, uncalibrated_gop_score: assessment.score, special_sounds: assessment.details.filter(d => d.special).map(d => ({ expected: d.latin, uncalibrated_probability: d.probabilite, preferred_alternative: d.confondu })) })
  }
  outputs.push({ key: record.key, prompt: record.prompt, analyses })
}
const result = { evaluator: infos.modele, linguistic_certification: false, calibrated_confidence: null, limits: ['Common Voice model, not a darija pronunciation validator', 'Gemination folded by existing scoring code', 'Jamal is synthetic and not linguistic ground truth', 'Greedy tokens and GOP scores are diagnostic, not certified IPA'], records: outputs }
writeFileSync(process.argv[2] ?? 'artifacts/hadra/phonetic-diagnostic.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
