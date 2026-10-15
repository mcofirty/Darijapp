/**
 * Retours haptiques légers, en trois intensités : une bonne réponse, la fin d'une activité, un vrai palier.
 * Android et Chrome : l'API de vibration. Safari sur iPhone n'a pas cette API ; depuis iOS 18, basculer un
 * interrupteur natif (`<input type="checkbox" switch>`) donne un petit « tic » : on s'en sert, sans garantie.
 * Il faut un geste de l'utilisateur en cours (un toucher), sinon rien ne se passe.
 */
export type Intensite = 'leger' | 'succes' | 'palier'

/** Motifs de vibration (ms) et nombre de « tics » sur iPhone. */
export const MOTIFS: Record<Intensite, { vibration: number[]; tics: number }> = {
  leger: { vibration: [12], tics: 1 },
  succes: { vibration: [14, 70, 22], tics: 2 },
  palier: { vibration: [18, 60, 18, 60, 40], tics: 3 },
}

let actif = true
export function activerHaptique(v: boolean): void {
  actif = v
}

let interrupteur: HTMLLabelElement | null = null

/** Interrupteur natif caché : un clic sur son étiquette déclenche le retour haptique d'iOS. */
function ticIos(): void {
  if (typeof document === 'undefined') return
  if (!interrupteur) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-10px;top:0'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    interrupteur = label
  }
  interrupteur.click()
}

export function vibrer(intensite: Intensite, nav: Pick<Navigator, 'vibrate'> | undefined = typeof navigator === 'undefined' ? undefined : navigator): void {
  if (!actif) return
  const motif = MOTIFS[intensite]
  if (nav && typeof nav.vibrate === 'function') {
    nav.vibrate(motif.vibration)
    return
  }
  for (let i = 0; i < motif.tics; i++) setTimeout(ticIos, i * 110)
}
