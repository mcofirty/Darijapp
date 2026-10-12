/**
 * Animation d'ouverture : vidéo de 3 s fournie par l'utilisateur, jouée par-dessus l'appli au démarrage.
 * Le voile sombre #lancement est écrit dans index.html, pour qu'aucun écran blanc ne passe avant la vidéo ;
 * un script de index.html le retire d'avance sur #ajout et #mot=.
 */

/** Image finale montrée seule (Réduire les animations, ou vidéo qui ne démarre pas). */
const DUREE_IMAGE_FIXE = 1000
/** Au-delà, la vidéo est jugée bloquée (mode Économie d'énergie, premier chargement lent). */
const DELAI_DEMARRAGE = 2000
/** Durée du fondu de sortie, identique à la transition CSS de index.html. */
const DUREE_FONDU = 400

let terminer!: () => void
/** Résolue quand l'animation s'efface (ou tout de suite s'il n'y en a pas). */
export const finLancement = new Promise<void>((resolve) => {
  terminer = resolve
})

export function demarrerLancement(): void {
  const voile = document.getElementById('lancement')
  const video = voile?.querySelector('video')
  if (!voile || !video) {
    terminer()
    return
  }

  let etat: 'attente' | 'video' | 'image' | 'fini' = 'attente'

  const effacer = () => {
    if (etat === 'fini') return
    etat = 'fini'
    voile.classList.add('efface')
    terminer()
    window.setTimeout(() => {
      voile.remove()
      if (video.src) URL.revokeObjectURL(video.src)
    }, DUREE_FONDU)
  }

  // Image finale de la vidéo, puis fondu : on ne reste jamais bloqué sur un écran noir.
  const imageFixe = () => {
    if (etat === 'fini' || etat === 'image') return
    etat = 'image'
    video.pause()
    video.hidden = true
    const image = document.createElement('img')
    image.alt = ''
    image.src = `${import.meta.env.BASE_URL}lancement-fin.jpg`
    voile.append(image)
    window.setTimeout(effacer, DUREE_IMAGE_FIXE)
  }

  // Toucher l'écran passe l'animation.
  voile.addEventListener('pointerdown', effacer)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    imageFixe()
    return
  }

  const secours = window.setTimeout(imageFixe, DELAI_DEMARRAGE)
  video.addEventListener('playing', () => {
    if (etat !== 'attente') return
    etat = 'video'
    window.clearTimeout(secours)
  })
  video.addEventListener('ended', effacer)
  video.addEventListener('error', imageFixe)

  // Lue depuis un blob : Safari demande la vidéo par morceaux (requêtes Range), ce que le cache
  // de la PWA ne sait pas servir ; un blob se lit entièrement, en ligne comme hors ligne.
  fetch(`${import.meta.env.BASE_URL}lancement.mp4`)
    .then((reponse) => {
      if (!reponse.ok) throw new Error(`Vidéo de lancement : ${reponse.status}`)
      return reponse.blob()
    })
    .then((blob) => {
      if (etat !== 'attente') return
      video.muted = true
      video.src = URL.createObjectURL(blob)
      return video.play()
    })
    .catch(imageFixe)
}
