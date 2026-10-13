const audiosDisponibles = new Set(__AUDIOS__)

let element: HTMLAudioElement | null = null
/** Sans « Exercices d'écoute » : aucun son ne part tout seul (seuls les boutons Écouter lisent). */
let lectureAutomatique = true

export function reglerLectureAutomatique(actif: boolean): void {
  lectureAutomatique = actif
}

/** Indique si le MP3 généré existe pour ce chemin (ex. « audio/salutations-001.mp3 »). */
export function audioDisponible(chemin: string): boolean {
  return audiosDisponibles.has(chemin.replace(/^audio\//, ''))
}

function voixArabe(): SpeechSynthesisVoice | undefined {
  const voix = window.speechSynthesis.getVoices()
  return voix.find((v) => v.lang === 'ar-MA') ?? voix.find((v) => v.lang.startsWith('ar'))
}

/**
 * Lit un texte avec la synthèse vocale du téléphone ; `fin` est appelée une fois la lecture finie.
 * Safari oublie parfois l'événement de fin : un délai de secours, selon la longueur du texte, le remplace.
 */
function parler(texte: string, langue: string, voix: SpeechSynthesisVoice | undefined, vitesse: number, fin?: () => void): void {
  if (!('speechSynthesis' in window)) {
    fin?.()
    return
  }
  const synthese = window.speechSynthesis
  synthese.cancel()
  const enonce = new SpeechSynthesisUtterance(texte)
  enonce.lang = langue
  if (voix) enonce.voice = voix
  enonce.rate = vitesse
  if (fin) {
    let appelee = false
    const finir = () => {
      if (appelee) return
      appelee = true
      window.clearTimeout(secours)
      fin()
    }
    const secours = window.setTimeout(finir, 2500 + (texte.length * 120) / vitesse)
    enonce.onend = finir
    enonce.onerror = finir
  }
  synthese.speak(enonce)
}

function parlerArabe(texte: string, vitesse: number, fin?: () => void): void {
  parler(texte, 'ar-MA', voixArabe(), vitesse, fin)
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
  element.onended = null
  element.onerror = null
  element.src = import.meta.env.BASE_URL + chemin
  element.playbackRate = vitesse
  element.play().catch(() => parlerArabe(texteArabe, vitesse))
}

/** Lecture qui part toute seule (ouverture d'une fiche, mot rejoué après une réponse…) : coupée sans écoute. */
export function jouerAuto(chemin: string, texteArabe: string, vitesse = 1): void {
  if (lectureAutomatique) jouer(chemin, texteArabe, vitesse)
}

/** Comme `jouer`, mais attend la fin de la lecture (mode écoute). */
export function lireEtAttendre(chemin: string, texteArabe: string, vitesse = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!audioDisponible(chemin)) {
      parlerArabe(texteArabe, vitesse, resolve)
      return
    }
    element ??= new Audio()
    const audio = element
    audio.pause()
    audio.src = import.meta.env.BASE_URL + chemin
    audio.playbackRate = vitesse
    const repli = () => parlerArabe(texteArabe, vitesse, resolve)
    audio.onended = () => resolve()
    audio.onerror = repli
    audio.play().catch(repli)
  })
}

function voixFrancaise(): SpeechSynthesisVoice | undefined {
  const voix = window.speechSynthesis.getVoices()
  return voix.find((v) => v.lang === 'fr-FR') ?? voix.find((v) => v.lang.startsWith('fr'))
}

/** Lit la traduction avec la voix française du téléphone, et attend la fin. */
export function parlerFrancais(texte: string): Promise<void> {
  return new Promise((resolve) => parler(texte, 'fr-FR', 'speechSynthesis' in window ? voixFrancaise() : undefined, 1, resolve))
}

/** Arrête toute lecture en cours (MP3 et synthèse vocale). */
export function arreterLecture(): void {
  if (element) {
    element.onended = null
    element.onerror = null
    element.pause()
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
