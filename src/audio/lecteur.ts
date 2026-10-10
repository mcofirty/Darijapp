const audiosDisponibles = new Set(__AUDIOS__)

let element: HTMLAudioElement | null = null

/** Indique si le MP3 généré existe pour ce chemin (ex. « audio/salutations-001.mp3 »). */
export function audioDisponible(chemin: string): boolean {
  return audiosDisponibles.has(chemin.replace(/^audio\//, ''))
}

function voixArabe(): SpeechSynthesisVoice | undefined {
  const voix = window.speechSynthesis.getVoices()
  return voix.find((v) => v.lang === 'ar-MA') ?? voix.find((v) => v.lang.startsWith('ar'))
}

function parlerArabe(texte: string, vitesse: number): void {
  if (!('speechSynthesis' in window)) return
  const synthese = window.speechSynthesis
  synthese.cancel()
  const enonce = new SpeechSynthesisUtterance(texte)
  enonce.lang = 'ar-MA'
  const voix = voixArabe()
  if (voix) enonce.voice = voix
  enonce.rate = vitesse
  synthese.speak(enonce)
}

/**
 * Joue l'audio d'un mot : le MP3 généré s'il existe, sinon la synthèse vocale
 * du téléphone à partir de l'écriture arabe.
 */
export function jouer(chemin: string, texteArabe: string, vitesse = 1): void {
  if (!audioDisponible(chemin)) {
    parlerArabe(texteArabe, vitesse)
    return
  }
  element ??= new Audio()
  element.pause()
  element.src = import.meta.env.BASE_URL + chemin
  element.playbackRate = vitesse
  element.play().catch(() => parlerArabe(texteArabe, vitesse))
}
