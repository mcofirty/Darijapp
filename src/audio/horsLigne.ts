/**
 * Audio hors ligne : télécharge d'un coup les MP3 de la voix Jamal dans le cache où le service worker
 * les cherche (`audio`, réglé dans vite.config.ts). Sans cela, un MP3 n'est gardé qu'à sa première écoute.
 */

/** Nom du cache des MP3 : le même que celui du service worker (CacheFirst). */
export const CACHE_AUDIO = 'audio'
/** Téléchargements en parallèle. */
const EN_PARALLELE = 6

/** Nom du fichier d'une adresse (« …/audio/salutations-001.mp3 » → « salutations-001.mp3 »), ou null. */
export function nomAudio(adresse: string): string | null {
  const m = /\/audio\/([^/?#]+\.mp3)(?:[?#].*)?$/.exec(adresse)
  return m ? decodeURIComponent(m[1]) : null
}

/** Fichiers de la liste qui ne sont pas encore dans le cache, dans l'ordre de la liste. */
export function audiosManquants(tous: readonly string[], presents: ReadonlySet<string>): string[] {
  return tous.filter((f) => !presents.has(f))
}

function adresse(fichier: string): string {
  return new URL(`${import.meta.env.BASE_URL}audio/${fichier}`, window.location.href).href
}

/** Noms des MP3 déjà gardés sur l'appareil. */
export async function audiosPresents(): Promise<Set<string>> {
  if (!('caches' in window)) return new Set()
  const cache = await caches.open(CACHE_AUDIO)
  const cles = await cache.keys()
  return new Set(cles.map((r) => nomAudio(r.url)).filter((n): n is string => n !== null))
}

/**
 * Télécharge les fichiers donnés dans le cache, `EN_PARALLELE` à la fois ; `progres` reçoit le nombre de
 * fichiers traités. Renvoie le nombre d'échecs (réseau coupé, fichier absent). `signal` arrête tout.
 */
export async function telechargerAudios(
  fichiers: readonly string[],
  progres: (faits: number) => void,
  signal: AbortSignal,
): Promise<number> {
  const cache = await caches.open(CACHE_AUDIO)
  let suivant = 0
  let faits = 0
  let echecs = 0
  async function ouvrier() {
    while (suivant < fichiers.length && !signal.aborted) {
      const url = adresse(fichiers[suivant++])
      try {
        const reponse = await fetch(url, { signal })
        if (reponse.ok && reponse.status === 200) await cache.put(url, reponse)
        else echecs++
      } catch {
        if (signal.aborted) return
        echecs++
      }
      progres(++faits)
    }
  }
  await Promise.all(Array.from({ length: EN_PARALLELE }, ouvrier))
  return echecs
}
