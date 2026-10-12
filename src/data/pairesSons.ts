import donnees from './sons/paires.json'

/** Mot d'une paire de « Distingue les sons » : il n'est pas dans le programme ni dans la répétition espacée. */
export interface MotSon {
  id: string
  latin: string
  arabe: string
  fr: string
  audio: string
}

/** Deux mots qui ne diffèrent que par un son (9elb / kelb), et les deux sons opposés (« 9 » contre « k »). */
export interface PaireSons {
  a: MotSon
  b: MotSon
  sons: [string, string]
}

const parId = new Map((donnees.mots as MotSon[]).map((m) => [m.id, m]))

export const PAIRES_SONS: PaireSons[] = donnees.paires.map((p) => ({
  a: parId.get(p.a)!,
  b: parId.get(p.b)!,
  sons: p.sons as [string, string],
}))

export const MOTS_SONS: MotSon[] = donnees.mots as MotSon[]
