import type { InferenceSession } from 'onnxruntime-web'
import wasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url'
import { preparerAudio, type InfosModele } from '../scoring/sons/modele'
import { comparer, evaluer, regrouper, sonsAttendus, type Evaluation, type Sorties } from '../scoring/sons/prononciation'

/**
 * Le grand modèle de reconnaissance des sons dans le navigateur (onnxruntime-web, WebAssembly).
 * Téléchargé une fois à la demande (Profil), en morceaux, et gardé dans le stockage du site
 * (Cache Storage) : il sert ensuite hors ligne. Rien ne quitte l'appareil : le calcul se fait sur place.
 */

const CACHE = 'darija-modele'
const DOSSIER = `${import.meta.env.BASE_URL}modele/`
const INFOS = `${DOSSIER}xlsr.json`

/** Lit la description du modèle (en ligne si possible, sinon la copie gardée). */
export async function infosModele(): Promise<InfosModele> {
  const cache = await caches.open(CACHE)
  try {
    const reponse = await fetch(INFOS, { cache: 'no-cache' })
    if (reponse.ok) {
      await cache.put(INFOS, reponse.clone())
      return (await reponse.json()) as InfosModele
    }
  } catch {
    // Hors ligne : la copie gardée.
  }
  const garde = await cache.match(INFOS)
  if (!garde) throw new Error('Modèle introuvable')
  return (await garde.json()) as InfosModele
}

/** Le modèle (et le moteur WebAssembly) sont-ils déjà sur le téléphone ? */
export async function modelePresent(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  const cache = await caches.open(CACHE)
  const garde = await cache.match(INFOS)
  if (!garde || !(await cache.match(wasmUrl))) return false
  const infos = (await garde.json()) as InfosModele
  for (const m of infos.morceaux) if (!(await cache.match(DOSSIER + m))) return false
  return true
}

/** Télécharge ce qui manque ; `progres` reçoit la part faite (0 à 1). */
export async function telechargerModele(progres: (part: number) => void, signal?: AbortSignal): Promise<void> {
  const infos = await infosModele()
  const cache = await caches.open(CACHE)
  const fichiers = [wasmUrl, ...infos.morceaux.map((m) => DOSSIER + m)]
  const total = infos.taille + 11e6
  let fait = 0
  for (const url of fichiers) {
    const garde = await cache.match(url)
    if (garde) {
      fait += Number(garde.headers.get('content-length')) || (await garde.clone().arrayBuffer()).byteLength
      progres(Math.min(1, fait / total))
      continue
    }
    const reponse = await fetch(url, { signal })
    if (!reponse.ok || !reponse.body) throw new Error(`Téléchargement impossible (${reponse.status})`)
    const morceaux: Uint8Array[] = []
    const lecteur = reponse.body.getReader()
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break
      morceaux.push(value)
      fait += value.byteLength
      progres(Math.min(1, fait / total))
    }
    const blob = new Blob(morceaux as BlobPart[], { type: url.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' })
    await cache.put(url, new Response(blob, { headers: { 'content-length': String(blob.size), 'content-type': blob.type } }))
  }
  progres(1)
}

/** Efface le modèle du téléphone. */
export async function supprimerModele(): Promise<void> {
  session = null
  if (typeof caches !== 'undefined') await caches.delete(CACHE)
}

let session: Promise<{ session: InferenceSession; infos: InfosModele }> | null = null

/** Ouvre le modèle (une fois par lancement de l'appli : quelques secondes). */
export function ouvrirModele(): Promise<{ session: InferenceSession; infos: InfosModele }> {
  session ??= (async () => {
    const ort = await import('onnxruntime-web')
    const cache = await caches.open(CACHE)
    const infos = await infosModele()
    const wasm = await cache.match(wasmUrl)
    if (!wasm) throw new Error('Moteur absent')
    // Un seul fil : GitHub Pages ne donne pas l'isolation qu'exigent les fils de WebAssembly.
    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = { wasm: URL.createObjectURL(await wasm.blob()) }
    const octets = new Uint8Array(infos.taille)
    let position = 0
    for (const m of infos.morceaux) {
      const r = await cache.match(DOSSIER + m)
      if (!r) throw new Error('Modèle incomplet')
      const morceau = new Uint8Array(await r.arrayBuffer())
      octets.set(morceau, position)
      position += morceau.byteLength
    }
    return { session: await ort.InferenceSession.create(octets, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }), infos }
  })()
  session.catch(() => (session = null))
  return session
}

/** Ce que le modèle entend dans un signal à 16 kHz, regroupé en classes de sons du darija. */
export async function ecouterSons(signal16k: Float32Array): Promise<Sorties> {
  const { session: s, infos } = await ouvrirModele()
  const ort = await import('onnxruntime-web')
  const audio = preparerAudio(signal16k, infos.normaliser)
  const sortie = await s.run({ audio: new ort.Tensor('float32', audio, [1, audio.length]) })
  const logits = sortie.logits
  return regrouper(logits.data as Float32Array, logits.dims[1], infos.vocabulaire)
}

/** Analyse de la voix de référence, gardée par MP3 : on ne la refait pas à chaque essai. */
const references = new Map<string, Promise<Sorties>>()

/**
 * Note un essai son par son contre la voix de référence (même mot, MP3 de Jamal).
 * `cle` identifie la référence (son chemin) ; les deux signaux sont à 16 kHz.
 */
export async function noterParSons(cle: string, reference16k: Float32Array, essai16k: Float32Array, latin: string): Promise<Evaluation> {
  let ref = references.get(cle)
  if (!ref) {
    ref = ecouterSons(reference16k)
    references.set(cle, ref)
    ref.catch(() => references.delete(cle))
  }
  const attendus = sonsAttendus(latin)
  const [r, e] = [await ref, await ecouterSons(essai16k)]
  return comparer(evaluer(r, attendus), evaluer(e, attendus))
}
