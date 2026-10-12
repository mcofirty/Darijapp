import type { Onglet } from './onglets'

/** Boîte de 28 pt : le dessin visible fait environ 23 pt, comme les symboles pleins de la barre d'onglets iOS. */
const props = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true, className: 'h-7 w-7' } as const

/** Icônes pleines de la barre d'onglets, d'après la maquette fournie par l'utilisateur. */
export function IconeOnglet({ onglet }: { onglet: Onglet; actif?: boolean }) {
  switch (onglet) {
    case 'apprendre':
      return (
        <svg {...props}>
          <rect x="1.5" y="3" width="15" height="12" rx="2.6" opacity="0.6" />
          <rect x="6.5" y="8" width="16" height="13" rx="2.8" />
        </svg>
      )
    case 'parcours':
      return (
        <svg {...props}>
          <path d="M3 6.4 8.4 3.8v16.3L3 22.4Z" />
          <path d="M9.9 3.8l4.2 2.4v16.3l-4.2-2.4Z" />
          <path d="M15.6 6.2 21 3.6v16.3l-5.4 2.6Z" />
        </svg>
      )
    case 'quiz':
      return (
        <svg {...props}>
          <path d="M8.6 2.6a3.2 3.2 0 0 0-3.2 3 3.3 3.3 0 0 0-2.9 4.9 3.5 3.5 0 0 0 1.1 5.9 3.2 3.2 0 0 0 4.6 3.4 2.8 2.8 0 0 0 3.2 1.6v-5.7l-2.3-1.6a.9.9 0 1 1 1-1.5l1.3.9V4.8a2.8 2.8 0 0 0-2.8-2.2Z" />
          <path d="M15.4 2.6a2.8 2.8 0 0 0-2.8 2.2v6.1l2.1-1.5V7.6a.9.9 0 1 1 1.8 0v2.3a.9.9 0 0 1-.4.7l-3.5 2.5v8.3a2.8 2.8 0 0 0 3.2-1.6 3.2 3.2 0 0 0 4.6-3.4 3.5 3.5 0 0 0 1.1-5.9 3.3 3.3 0 0 0-2.9-4.9 3.2 3.2 0 0 0-3.2-3Z" />
        </svg>
      )
    case 'progres':
      return (
        <svg {...props}>
          <rect x="2" y="11" width="5.8" height="10.5" rx="1.8" />
          <rect x="9.1" y="7" width="5.8" height="14.5" rx="1.8" />
          <rect x="16.2" y="2.5" width="5.8" height="19" rx="1.8" />
        </svg>
      )
    case 'profil':
      return (
        <svg {...props}>
          <circle cx="12" cy="7.4" r="4.4" />
          <path d="M4.2 20.3c0-4.2 3.5-6.9 7.8-6.9s7.8 2.7 7.8 6.9c0 .8-.6 1.4-1.4 1.4H5.6c-.8 0-1.4-.6-1.4-1.4Z" />
        </svg>
      )
  }
}
