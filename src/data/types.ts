export interface Exemple {
  latin: string
  arabe: string
  fr: string
  audio: string
}

export interface Mot {
  id: string
  latin: string
  arabe: string
  fr: string
  theme: string
  niveau: 1 | 2 | 3
  /** Vide pour les entrées importées sans explication. */
  prononciation: string
  /** Chemin du MP3, ou vide : la voix de l'iPhone lit alors l'arabe. */
  audio: string
  /** Exemple aux champs vides quand le mot n'en a pas. */
  exemple: Exemple
  /** Précision d'usage (emprunt au français, familier…). */
  note?: string
}

export interface Theme {
  id: string
  titre: string
}
