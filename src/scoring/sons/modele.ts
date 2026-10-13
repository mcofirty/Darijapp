/**
 * Ce que l'appli sait du grand modèle de reconnaissance des sons (wav2vec2 XLSR-53, phonétique de
 * Common Voice, Meta, licence Apache 2.0), décrit par `public/modele/xlsr.json` (écrit par l'Action « Modèle »).
 * Logique pure : le chargement (navigateur ou Node) se fait ailleurs.
 */

export interface InfosModele {
  modele: string
  /** Morceaux du fichier ONNX (GitHub refuse les fichiers de plus de 100 Mo). */
  morceaux: string[]
  /** Taille totale, en octets. */
  taille: number
  /** Sons du modèle, dans l'ordre de ses sorties (0 = blanc du CTC). */
  vocabulaire: string[]
  /** Normaliser l'audio (moyenne 0, variance 1) avant de le donner au modèle. */
  normaliser: boolean
}

/** Prépare un signal à 16 kHz comme l'extracteur de Hugging Face : moyenne 0, variance 1. */
export function preparerAudio(signal: Float32Array, normaliser = true): Float32Array {
  if (!normaliser || signal.length === 0) return signal
  let moyenne = 0
  for (const x of signal) moyenne += x
  moyenne /= signal.length
  let variance = 0
  for (const x of signal) variance += (x - moyenne) ** 2
  variance /= signal.length
  const ecart = Math.sqrt(variance + 1e-7)
  return signal.map((x) => (x - moyenne) / ecart)
}
