let contexte: AudioContext | null = null

function note(frequence: number, debut: number, duree: number, type: OscillatorType, volume: number): void {
  const ctx = contexte!
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequence
  gain.gain.setValueAtTime(volume, ctx.currentTime + debut)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + debut + duree)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + debut)
  osc.stop(ctx.currentTime + debut + duree)
}

/** Petit son de retour après une réponse (synthétisé, sans fichier). */
export function sonReponse(juste: boolean): void {
  try {
    contexte ??= new AudioContext()
    if (juste) {
      note(660, 0, 0.12, 'sine', 0.15)
      note(990, 0.09, 0.18, 'sine', 0.15)
    } else {
      note(200, 0, 0.25, 'triangle', 0.18)
    }
  } catch {
    // Pas d'audio disponible : le retour visuel suffit.
  }
}
