import { describe, expect, it } from 'vitest'
import { dtw } from './dtw'
import { FREQUENCE, mfcc, niveauMax, reechantillonner, rogner } from './mfcc'
import { ajouterReglage, appreciation, decalageVoix, distanceEssai, empreinte, scoreDeDistance, REGLAGES_GARDES } from './score'

/** Signal synthétique : une voyelle (deux formants) qui glisse, entourée de silence. */
function voyelle(f1: number, f2: number, duree = 0.5, silence = 0.2, etirement = 1): Float32Array {
  const n = Math.round(duree * FREQUENCE)
  const s = Math.round(silence * FREQUENCE)
  const signal = new Float32Array(n + 2 * s)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const f0 = 120 + 30 * t
    phase += (2 * Math.PI * f0) / FREQUENCE
    // Harmoniques de f0 renforcées autour des formants (qui glissent pendant le son).
    let v = 0
    for (let h = 1; h * f0 < 5000; h++) {
      const f = h * f0
      const a = Math.exp(-(((f - f1 * etirement * (1 + 0.3 * t)) / 150) ** 2)) + 0.6 * Math.exp(-(((f - f2 * etirement * (1 - 0.2 * t)) / 200) ** 2))
      v += (a + 0.02) * Math.sin(h * phase)
    }
    signal[s + i] = 0.1 * v * Math.sin(Math.PI * t)
  }
  return signal
}

describe('mfcc', () => {
  it('donne 12 coefficients toutes les 5 ms, centrés', () => {
    const t = mfcc(voyelle(700, 1200))
    expect(t.length).toBeGreaterThan(160)
    expect(t[0]).toHaveLength(12)
    const moyenne = t.reduce((s, x) => s + x[0], 0) / t.length
    expect(Math.abs(moyenne)).toBeLessThan(1e-9)
  })

  it('rogne le silence du début et de la fin', () => {
    const signal = voyelle(700, 1200, 0.5, 0.4)
    const utile = rogner(signal)
    expect(utile.length).toBeLessThan(signal.length * 0.7)
    expect(utile.length).toBeGreaterThan(0.4 * FREQUENCE)
  })

  it('mesure le niveau maximal', () => {
    expect(niveauMax(new Float32Array(16000))).toBeLessThan(-90)
    expect(niveauMax(voyelle(700, 1200))).toBeGreaterThan(-40)
  })

  it('rééchantillonne à 16 kHz', () => {
    const s = new Float32Array(48000).map((_, i) => Math.sin(i / 10))
    expect(reechantillonner(s, 48000)).toHaveLength(16000)
    expect(reechantillonner(s, 16000)).toBe(s)
  })

  it('coupe les aigus au lieu de les replier', () => {
    // 7 kHz passe, 11 kHz (au-delà des 8 kHz de Nyquist) disparaît au lieu de revenir en 5 kHz.
    const sinus = (f: number) => Float32Array.from({ length: 48000 }, (_, i) => Math.sin((2 * Math.PI * f * i) / 48000))
    const rms = (x: Float32Array) => Math.sqrt(x.slice(1000, -1000).reduce((s, v) => s + v * v, 0) / (x.length - 2000))
    expect(rms(reechantillonner(sinus(1000), 48000))).toBeGreaterThan(0.65)
    expect(rms(reechantillonner(sinus(11000), 48000))).toBeLessThan(0.01)
  })
})

describe('dtw', () => {
  const suite = (valeurs: number[]) => valeurs.map((v) => Float64Array.from([v, -v]))

  it('vaut 0 pour deux suites identiques', () => {
    expect(dtw(suite([1, 2, 3]), suite([1, 2, 3])).moyenne).toBe(0)
  })

  it('absorbe un débit différent', () => {
    expect(dtw(suite([1, 2, 3]), suite([1, 1, 2, 2, 3, 3])).moyenne).toBe(0)
    expect(dtw(suite([1, 2, 3]), suite([3, 2, 1])).moyenne).toBeGreaterThan(0.5)
  })

  it('donne la distance locale le long de la référence', () => {
    const { locales } = dtw(suite([1, 2, 3]), suite([1, 2, 5]))
    expect(locales[0]).toBe(0)
    expect(locales[2]).toBeGreaterThan(0)
  })

  it('renvoie l’infini pour une suite vide', () => {
    expect(dtw([], suite([1])).moyenne).toBe(Infinity)
  })
})

describe('score', () => {
  it('suit le barème', () => {
    expect(scoreDeDistance(0.5)).toBe(100)
    expect(scoreDeDistance(1.3)).toBe(80)
    expect(scoreDeDistance(1.85)).toBe(60)
    expect(scoreDeDistance(5)).toBe(0)
    expect(scoreDeDistance(1.1)).toBeGreaterThan(80)
    expect(scoreDeDistance(2)).toBeLessThan(60)
  })

  it('décroît avec la distance', () => {
    let avant = 101
    for (let d = 0; d < 4; d += 0.05) {
      const s = scoreDeDistance(d)
      expect(s).toBeLessThanOrEqual(avant)
      avant = s
    }
  })

  it('tient compte du réglage sur la voix', () => {
    expect(scoreDeDistance(2.4, 1)).toBe(scoreDeDistance(1.4))
    expect(scoreDeDistance(2.4, 1)).toBeGreaterThan(scoreDeDistance(2.4))
  })

  it('donne libellé et étoiles', () => {
    expect(appreciation(80)).toEqual({ libelle: 'Excellent', etoiles: 3, reussi: true })
    expect(appreciation(79)).toEqual({ libelle: 'Presque', etoiles: 2, reussi: true })
    expect(appreciation(60).reussi).toBe(true)
    expect(appreciation(59)).toEqual({ libelle: 'À retravailler', etoiles: 1, reussi: false })
  })

  it('règle le décalage sur la médiane, borné', () => {
    expect(decalageVoix([])).toBe(0)
    expect(decalageVoix([0.8, 0.9])).toBe(0)
    expect(decalageVoix([2.2, 2.0, 2.4])).toBeCloseTo(1.2)
    expect(decalageVoix([9, 9])).toBe(1.6)
  })

  it('garde les derniers réglages', () => {
    const r = ajouterReglage(Array.from({ length: REGLAGES_GARDES }, () => 1), [2, 3])
    expect(r).toHaveLength(REGLAGES_GARDES)
    expect(r.at(-1)).toBe(3)
  })

  it('reconnaît un essai muet', () => {
    expect(distanceEssai(empreinte(voyelle(700, 1200)), new Float32Array(16000))).toBeNull()
  })

  it('note mieux le même son, même plus aigu, qu’un autre son', () => {
    const ref = empreinte(voyelle(700, 1200))
    const meme = distanceEssai(ref, voyelle(700, 1200, 0.7, 0.3, 1.1))!
    const autre = distanceEssai(ref, voyelle(300, 2300))!
    expect(meme).toBeLessThan(autre)
  })
})
