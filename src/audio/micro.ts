import { FREQUENCE, PAUSE_MOT, reechantillonner } from '../scoring/mfcc'
import { empreinte, type Empreinte } from '../scoring/score'
import { audioDisponible } from './lecteur'

/** Enregistrement de la voix (MediaRecorder) et décodage à 16 kHz pour le score. Rien ne quitte l'appareil. */

export function microDisponible(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
}

let contexte: AudioContext | null = null
function ctx(): AudioContext {
  contexte ??= new AudioContext()
  if (contexte.state === 'suspended') void contexte.resume()
  return contexte
}

/**
 * À appeler dès le toucher, avant tout `await` : Safari ne réveille l'analyse du son
 * (AudioContext) que pendant un geste de l'utilisateur.
 */
export function preparerMicro(): void {
  try {
    ctx()
  } catch {
    // Pas d'AudioContext : l'enregistrement s'arrêtera au bout de sa durée maximale.
  }
}

export interface Enregistrement {
  /** Arrête l'enregistrement maintenant. */
  arreter: () => void
  /** Le son enregistré, une fois arrêté (vide si annulé). */
  fini: Promise<Blob>
}

/** Seuils de détection de la voix, en dB : au-dessus, on parle ; en dessous, c'est le silence. */
const VOIX = -42
const SILENCE = -48
/** Silence (ms) qui arrête l'enregistrement après la voix : un mot, ou une phrase (pauses entre les mots). */
export const SILENCE_MOT = 800
export const SILENCE_PHRASE = 1200

/**
 * Démarre l'enregistrement (après un toucher : l'iPhone l'exige). S'arrête seul après `silenceFinal` ms
 * de silence qui suit la voix, ou au bout de `dureeMax` ms. `onNiveau` reçoit le volume (0 à 1).
 * Le micro est rendu à la fin : tant qu'il est ouvert, l'iPhone baisse le son des MP3.
 */
export async function enregistrer(dureeMax: number, onNiveau?: (niveau: number) => void, silenceFinal = SILENCE_MOT): Promise<Enregistrement> {
  const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
  const enregistreur = new MediaRecorder(flux)
  const morceaux: Blob[] = []
  enregistreur.ondataavailable = (e) => {
    if (e.data.size > 0) morceaux.push(e.data)
  }
  const source = ctx().createMediaStreamSource(flux)
  const analyseur = ctx().createAnalyser()
  analyseur.fftSize = 1024
  source.connect(analyseur)
  const tampon = new Float32Array(analyseur.fftSize)

  let parle = false
  let silenceDepuis = 0
  const debut = performance.now()
  const minuterie = window.setInterval(() => {
    analyseur.getFloatTimeDomainData(tampon)
    let s = 0
    for (const v of tampon) s += v * v
    const db = 10 * Math.log10(s / tampon.length + 1e-10)
    onNiveau?.(Math.min(1, Math.max(0, (db + 60) / 45)))
    const maintenant = performance.now()
    if (db > VOIX) {
      parle = true
      silenceDepuis = 0
    } else if (parle && db < SILENCE) {
      silenceDepuis ||= maintenant
      if (maintenant - silenceDepuis > silenceFinal) arreter()
    }
    if (maintenant - debut > dureeMax) arreter()
  }, 50)

  function arreter() {
    window.clearInterval(minuterie)
    if (enregistreur.state !== 'inactive') enregistreur.stop()
  }

  const fini = new Promise<Blob>((resolve) => {
    enregistreur.onstop = () => {
      source.disconnect()
      flux.getTracks().forEach((t) => t.stop())
      onNiveau?.(0)
      resolve(new Blob(morceaux, { type: enregistreur.mimeType }))
    }
  })
  enregistreur.start()
  return { arreter, fini }
}

/**
 * Décode un son (MP3, ou audio/mp4 de Safari) en signal mono à 16 kHz.
 * Safari ne sait pas lire l'audio/mp4 du MediaRecorder autrement que par decodeAudioData.
 */
export async function decoder16k(donnees: ArrayBuffer): Promise<Float32Array> {
  const tampon = await ctx().decodeAudioData(donnees)
  return reechantillonner(tampon.getChannelData(0), tampon.sampleRate)
}

const references = new Map<string, Promise<{ empreinte: Empreinte; duree: number; signal: Float32Array } | null>>()

/**
 * Empreinte du MP3 de Jamal d'un mot (ou d'une phrase, avec `pause` = PAUSE_PHRASE), gardée en mémoire.
 * `null` sans MP3 (mot ajouté, MP3 pas encore généré, ou hors ligne sans l'avoir écouté) : on passe
 * alors à l'auto-évaluation.
 */
export function referenceDuMot(chemin: string, pause = PAUSE_MOT): Promise<{ empreinte: Empreinte; duree: number; signal: Float32Array } | null> {
  if (!chemin || !audioDisponible(chemin)) return Promise.resolve(null)
  const cle = `${pause}:${chemin}`
  let r = references.get(cle)
  if (!r) {
    r = fetch(import.meta.env.BASE_URL + chemin)
      .then((rep) => (rep.ok ? rep.arrayBuffer() : Promise.reject(new Error(String(rep.status)))))
      .then(decoder16k)
      .then((signal) => ({ empreinte: empreinte(signal, pause), duree: signal.length / FREQUENCE, signal }))
      .catch(() => {
        references.delete(cle)
        return null
      })
    references.set(cle, r)
  }
  return r
}

/** Lit un enregistrement de l'utilisateur. */
export function rejouer(son: Blob): void {
  const url = URL.createObjectURL(son)
  const audio = new Audio(url)
  audio.onended = () => URL.revokeObjectURL(url)
  void audio.play().catch(() => URL.revokeObjectURL(url))
}
