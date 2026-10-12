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
  prononciation: string
  audio: string
  exemple: Exemple
}

export interface Theme {
  id: string
  titre: string
}
