/**
 * Empêche le zoom au pincement et au double toucher. Safari sur iPhone ignore `user-scalable=no` dans le
 * navigateur (et parfois dans l'appli installée) : on bloque aussi ses événements de geste et les
 * déplacements à plusieurs doigts. Aucune commande de l'appli n'utilise deux doigts.
 */
export function plusieursDoigts(e: { touches?: { length: number } }): boolean {
  return (e.touches?.length ?? 0) > 1
}

export function bloquerZoom(cible: Pick<Document, 'addEventListener'> = document): void {
  const annuler = (e: Event) => e.preventDefault()
  // Événements propres à Safari (pincement).
  cible.addEventListener('gesturestart', annuler)
  cible.addEventListener('gesturechange', annuler)
  cible.addEventListener('gestureend', annuler)
  cible.addEventListener(
    'touchmove',
    (e) => {
      if (plusieursDoigts(e as TouchEvent)) e.preventDefault()
    },
    { passive: false },
  )
}
