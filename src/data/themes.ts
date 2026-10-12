import type { Theme } from './types'

/** Ordre d'affichage des thèmes ; chaque id correspond à src/data/<id>.json. */
export const THEMES: Theme[] = [
  { id: 'salutations', titre: 'Salutations et politesse' },
  { id: 'chiffres', titre: 'Chiffres et prix' },
  { id: 'nourriture', titre: 'Nourriture et boissons' },
  { id: 'souk', titre: 'Au souk et marchandage' },
  { id: 'transports', titre: 'Transports et directions' },
  { id: 'famille', titre: 'Se présenter et famille' },
  { id: 'jours', titre: 'Jours et moments' },
  { id: 'expressions', titre: 'Expressions utiles' },
]
