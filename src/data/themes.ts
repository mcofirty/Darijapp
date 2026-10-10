import type { Theme } from './types'

/** Ordre d'affichage des thèmes ; chaque id correspond à src/data/<id>.json. */
export const THEMES: Theme[] = [
  { id: 'salutations', titre: 'Salutations et politesse', icone: '👋' },
  { id: 'chiffres', titre: 'Chiffres et prix', icone: '🔢' },
  { id: 'nourriture', titre: 'Nourriture et boissons', icone: '🍵' },
  { id: 'souk', titre: 'Au souk et marchandage', icone: '🧺' },
  { id: 'transports', titre: 'Transports et directions', icone: '🚕' },
  { id: 'famille', titre: 'Se présenter et famille', icone: '👨‍👩‍👧' },
  { id: 'jours', titre: 'Jours et moments', icone: '📅' },
  { id: 'expressions', titre: 'Expressions utiles', icone: '💬' },
]
