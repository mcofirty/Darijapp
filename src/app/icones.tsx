import type { Onglet } from './onglets'

const props = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true, className: 'h-7 w-7' } as const

/** Icônes pleines de la barre d'onglets. */
export function IconeOnglet({ onglet }: { onglet: Onglet }) {
  switch (onglet) {
    case 'apprendre':
      return (
        <svg {...props}>
          <rect x="2.5" y="3.5" width="14" height="11.5" rx="2.5" opacity="0.55" />
          <rect x="7.5" y="8.5" width="14" height="11.5" rx="2.5" />
        </svg>
      )
    case 'parcours':
      return (
        <svg {...props}>
          <path d="M2.5 6.6 8.3 4v15.4l-5.8 2.6Z" />
          <path d="M9.7 4l4.6 2.4v15.4l-4.6-2.4Z" />
          <path d="M15.7 6.4 21.5 3.8v15.4l-5.8 2.6Z" />
        </svg>
      )
    case 'quiz':
      return (
        <svg {...props}>
          <path d="M9 2.8a3 3 0 0 0-3 2.9 3.1 3.1 0 0 0-2.7 4.6 3.3 3.3 0 0 0 1 5.6A3 3 0 0 0 9 19.8a2.6 2.6 0 0 0 2.3 1.4V4.6A2.6 2.6 0 0 0 9 2.8Z" />
          <path d="M15 2.8a2.6 2.6 0 0 0-2.3 1.8v16.6a2.6 2.6 0 0 0 2.3-1.4 3 3 0 0 0 4.7-3.9 3.3 3.3 0 0 0 1-5.6A3.1 3.1 0 0 0 18 5.7a3 3 0 0 0-3-2.9Z" />
        </svg>
      )
    case 'progres':
      return (
        <svg {...props}>
          <rect x="2.5" y="11.5" width="5.5" height="9.5" rx="1.6" />
          <rect x="9.25" y="7.5" width="5.5" height="13.5" rx="1.6" />
          <rect x="16" y="3" width="5.5" height="18" rx="1.6" />
        </svg>
      )
    case 'profil':
      return (
        <svg {...props}>
          <circle cx="12" cy="7.5" r="4.2" />
          <path d="M3.8 20.2c0-4.1 3.7-6.7 8.2-6.7s8.2 2.6 8.2 6.7c0 .7-.5 1.3-1.2 1.3H5c-.7 0-1.2-.6-1.2-1.3Z" />
        </svg>
      )
  }
}
