let contexte: AudioContext | null = null
/** Jeu de sons choisi au souk (« classique », « qraqeb » ou « darbouka »), mis à jour par l'appli. */
let jeu = 'classique'

export function choisirSons(id: string): void {
  jeu = id
}

function note(frequence: number, debut: number, duree: number, type: OscillatorType, volume: number, glisse?: number): void {
  const ctx = contexte!
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequence, ctx.currentTime + debut)
  // Hauteur qui retombe : la peau du tambour qui se détend.
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, ctx.currentTime + debut + duree)
  gain.gain.setValueAtTime(volume, ctx.currentTime + debut)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + debut + duree)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + debut)
  osc.stop(ctx.currentTime + debut + duree)
}

/** Bruit filtré très court : claquement métallique (qraqeb) ou « tek » sec (darbouka). */
function claquement(debut: number, duree: number, frequence: number, volume: number): void {
  const ctx = contexte!
  const echantillons = Math.ceil(ctx.sampleRate * duree)
  const tampon = ctx.createBuffer(1, echantillons, ctx.sampleRate)
  const donnees = tampon.getChannelData(0)
  for (let i = 0; i < echantillons; i++) donnees[i] = (Math.random() * 2 - 1) * (1 - i / echantillons) ** 3
  const source = ctx.createBufferSource()
  source.buffer = tampon
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'bandpass'
  filtre.frequency.value = frequence
  filtre.Q.value = 3
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(filtre).connect(gain).connect(ctx.destination)
  source.start(ctx.currentTime + debut)
}

function jouerJeu(id: string, juste: boolean): void {
  if (id === 'qraqeb') {
    // Le rythme ternaire des castagnettes gnaoua ; un seul claquement sourd pour une erreur.
    if (juste) [0, 0.11, 0.22].forEach((t, i) => claquement(t, 0.07, i === 2 ? 5200 : 4200, 0.5))
    else claquement(0, 0.12, 1800, 0.5)
  } else if (id === 'darbouka') {
    // « Doum » grave puis « tek tek » ; une erreur : un doum seul, plus sourd.
    if (juste) {
      note(110, 0, 0.25, 'sine', 0.35, 70)
      claquement(0.14, 0.05, 3200, 0.45)
      claquement(0.24, 0.05, 3400, 0.4)
    } else note(90, 0, 0.35, 'sine', 0.3, 55)
  } else if (juste) {
    note(660, 0, 0.12, 'sine', 0.15)
    note(990, 0.09, 0.18, 'sine', 0.15)
  } else {
    note(200, 0, 0.25, 'triangle', 0.18)
  }
}

/** Petit son de retour après une réponse (synthétisé, sans fichier), dans le jeu de sons choisi. */
export function sonReponse(juste: boolean): void {
  essayerDeJouer(jeu, juste)
}

/** Fait entendre un jeu de sons au souk, avant de l'acheter. */
export function apercuSons(id: string): void {
  essayerDeJouer(id, true)
}

function essayerDeJouer(id: string, juste: boolean): void {
  try {
    contexte ??= new AudioContext()
    if (contexte.state === 'suspended') void contexte.resume()
    jouerJeu(id, juste)
  } catch {
    // Pas d'audio disponible : le retour visuel suffit.
  }
}
