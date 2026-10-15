import { useMemo, type ReactNode } from 'react'
import { REGIONS_ETAPES, cheminDeLaRoute, placeVignette, semerDecor, type ElementDecor, type Point, type Region } from './decor'

/**
 * Fond illustré de la carte du Parcours, dans le style plat de « Mon jardin » : le sol change avec le voyage
 * (prairies du nord, montagnes du Rif, oliveraies, côte atlantique, plaine ocre de Marrakech, arganiers,
 * Haut Atlas, dunes de Merzouga), un monument par ville, une route de terre battue et un décor semé
 * selon la région. Repère : largeur de la carte, en pt, et y vers le bas ; un élément est posé sur son sol.
 */

/** Couleur du sol de chaque région. */
const SOL: Record<Region, string> = {
  nord: '#b4dc96',
  rif: '#a6d18e',
  centre: '#bcda8e',
  cote: '#b0d894',
  marrakech: '#e3bf8e',
  argan: '#dcc690',
  atlas: '#cdb08a',
  desert: '#f1c98a',
}

const DECOR: Record<ElementDecor['type'], ReactNode> = {
  arbre: (
    <g>
      <rect x="-1.6" y="-9" width="3.2" height="9" fill="#7a5230" />
      <circle cy="-15" r="8.5" fill="#3fae5a" />
      <circle cx="3" cy="-17.5" r="4" fill="#5cc072" />
    </g>
  ),
  fleur: (
    <g>
      <circle r="2.6" cy="-2.6" fill="#fff" />
      <circle r="1.1" cy="-2.6" fill="#ffd23f" />
    </g>
  ),
  coquelicot: (
    <g>
      <path d="M0 0 V-5" stroke="#4b7a2f" strokeWidth="1.2" />
      <circle cy="-6" r="2.6" fill="#e2445c" />
      <circle cy="-6" r="0.9" fill="#3b2f2f" />
    </g>
  ),
  herbe: <path d="M0 0 l-3.5 -7 M0 0 l0 -9 M0 0 l3.5 -7" stroke="#86bd68" strokeWidth="2" strokeLinecap="round" />,
  herbeSeche: <path d="M0 0 l-3.5 -6 M0 0 l0 -8 M0 0 l3.5 -6" stroke="#b39a5c" strokeWidth="1.8" strokeLinecap="round" />,
  mouton: (
    <g>
      <rect x="-5" y="-4" width="1.6" height="4" fill="#3b2f2f" />
      <rect x="3" y="-4" width="1.6" height="4" fill="#3b2f2f" />
      <ellipse cy="-7.5" rx="8" ry="5" fill="#fbf8f1" />
      <circle cx="-4" cy="-10" r="3.5" fill="#fbf8f1" />
      <circle cx="3" cy="-10.5" r="3.8" fill="#fbf8f1" />
      <ellipse cx="8" cy="-8" rx="2.6" ry="2.1" fill="#3b2f2f" />
    </g>
  ),
  chevre: (
    <g fill="#8a5a35">
      <rect x="-5" y="-5" width="1.6" height="5" />
      <rect x="3" y="-5" width="1.6" height="5" />
      <ellipse cy="-7.5" rx="7" ry="3.6" />
      <path d="M5 -9 l3.5 -4 l2.5 1.5 l-1.5 3.5 z" />
      <path d="M8 -13 q1 -4 -1.5 -5" stroke="#5c3a20" strokeWidth="1.1" fill="none" />
      <circle cx="10" cy="-11" r="0.8" fill="#fbf8f1" />
    </g>
  ),
  pin: (
    <g>
      <rect x="-1.4" y="-5" width="2.8" height="5" fill="#6b4a2e" />
      <path d="M0 -24 L8 -11 H4 L9 -4 H-9 L-4 -11 H-8Z" fill="#2f7d4a" />
      <path d="M0 -24 L8 -11 H4 L9 -4 H0Z" fill="#256b3d" />
    </g>
  ),
  rocher: (
    <g>
      <path d="M-9 0 Q-9 -8 -3 -10 Q3 -12 7 -6 Q10 -2 9 0Z" fill="#a8998a" />
      <path d="M-3 -10 Q3 -12 7 -6 Q2 -7 -3 -10Z" fill="#c4b8aa" />
    </g>
  ),
  cailloux: (
    <g fill="#c9a77a">
      <ellipse cx="-3" cy="-1.5" rx="3" ry="1.8" />
      <ellipse cx="2.5" cy="-1" rx="2.2" ry="1.4" fill="#b8956a" />
      <ellipse cx="0" cy="-3.5" rx="1.6" ry="1.1" />
    </g>
  ),
  olivier: (
    <g>
      <path d="M0 0 q-1 -5 1 -9" stroke="#7a6a55" strokeWidth="3" fill="none" />
      <ellipse cy="-14" rx="10" ry="7" fill="#8a9a6b" />
      <ellipse cx="-3" cy="-16" rx="5" ry="3.5" fill="#9fae80" />
      <circle cx="4" cy="-12" r="1" fill="#3b2f4a" />
      <circle cx="-5" cy="-11" r="1" fill="#3b2f4a" />
    </g>
  ),
  champ: (
    <g>
      <path d="M-18 0 L-12 -12 H14 L18 0Z" fill="#d9c068" />
      <path d="M-14 -3 H15 M-12 -6.5 H14 M-10 -10 H13" stroke="#c4a94e" strokeWidth="1.4" />
    </g>
  ),
  maison: (
    <g>
      <rect x="-11" y="-14" width="22" height="14" fill="#f7f2e6" />
      <rect x="-11" y="-16" width="22" height="2.4" fill="#e2d6bf" />
      <path d="M-3 0 V-7 a3 3 0 0 1 6 0 V0Z" fill="#1d7a5f" />
      <rect x="5" y="-11" width="3.5" height="4" fill="#1d7a5f" />
    </g>
  ),
  palmierNain: (
    <g stroke="#4f9a3a" strokeWidth="2.6" strokeLinecap="round" fill="none">
      <path d="M0 0 q-6 -6 -9 -6 M0 0 q-3 -9 -4 -12 M0 0 q0 -11 0 -13 M0 0 q3 -9 5 -12 M0 0 q6 -6 9 -5" />
    </g>
  ),
  mouette: <path d="M-7 -14 q3.5 -4 7 0 q3.5 -4 7 0" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />,
  palmier: (
    <g>
      <path d="M0 0 Q2 -14 0 -26" stroke="#a0662b" strokeWidth="3.4" fill="none" />
      <path d="M0 -26 q-11 -2 -14 5 M0 -26 q11 -2 14 5 M0 -26 q-5 -8 -13 -8 M0 -26 q5 -8 13 -8" stroke="#4f9a3a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="-2" cy="-24" r="1.6" fill="#8a4f1d" />
      <circle cx="2" cy="-24" r="1.6" fill="#8a4f1d" />
    </g>
  ),
  cactus: (
    <g fill="#5b9a4a">
      <ellipse cy="-6" rx="5" ry="6.5" />
      <ellipse cx="-5.5" cy="-13" rx="3.8" ry="5" transform="rotate(-25 -5.5 -13)" />
      <ellipse cx="5" cy="-14" rx="3.8" ry="5" transform="rotate(20 5 -14)" />
      <circle cx="-6.5" cy="-18" r="1.5" fill="#b8325a" />
      <circle cx="6.5" cy="-19" r="1.5" fill="#ffd23f" />
    </g>
  ),
  arganier: (
    <g>
      <path d="M0 0 q-3 -6 -2 -10 M0 0 q3 -5 4 -9" stroke="#6e5a3c" strokeWidth="2.6" fill="none" />
      <ellipse cy="-14" rx="14" ry="6.5" fill="#7fa03c" />
      <ellipse cx="-4" cy="-16" rx="7" ry="3.2" fill="#93b24e" />
      <circle cx="6" cy="-13" r="1.2" fill="#c8b23a" />
      {/* Les chèvres grimpent aux arganiers. */}
      <g fill="#fbf8f1" transform="translate(4 -20)">
        <ellipse rx="3.2" ry="1.8" />
        <path d="M2.5 -1 l1.8 -2 l1 0.8 l-0.8 2z" />
      </g>
    </g>
  ),
  buisson: (
    <g>
      <ellipse cy="-4" rx="8" ry="4.5" fill="#9aa65a" />
      <ellipse cx="-2.5" cy="-5.5" rx="4" ry="2.5" fill="#adb86c" />
    </g>
  ),
  kasbah: (
    <g>
      <rect x="-16" y="-16" width="32" height="16" fill="#c98e5c" />
      <rect x="-16" y="-24" width="9" height="24" fill="#b97d4c" />
      <rect x="7" y="-24" width="9" height="24" fill="#b97d4c" />
      <path d="M-16 -24 h3 v-2 h3 v2 h3 M7 -24 h3 v-2 h3 v2 h3" stroke="#b97d4c" strokeWidth="2" fill="none" />
      <path d="M-3 0 V-8 a3 3 0 0 1 6 0 V0Z" fill="#7a4f2c" />
      <rect x="-13" y="-19" width="3" height="4" fill="#7a4f2c" />
      <rect x="10" y="-19" width="3" height="4" fill="#7a4f2c" />
    </g>
  ),
  nuage: (
    <g fill="#ffffff" opacity="0.75">
      <ellipse cy="-30" rx="15" ry="5" />
      <ellipse cx="-4" cy="-34" rx="7" ry="5" />
      <ellipse cx="5" cy="-33" rx="6" ry="4" />
    </g>
  ),
}

/** Monument de chaque ville, posé sur le sol en (0, 0). */
function Monument({ index }: { index: number }) {
  switch (index) {
    case 0: // Tanger : phare du cap Spartel, détroit et voilier
      return (
        <g>
          <path d="M-62 0 Q-30 -14 0 -4 T62 -6 V22 H-62Z" fill="#3d8fc4" />
          <path d="M-56 7 q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="#7cc3e8" strokeWidth="2" fill="none" />
          <rect x="-12" y="-62" width="18" height="58" fill="#f7f2e6" />
          <rect x="-12" y="-44" width="18" height="6" fill="#c1272d" />
          <rect x="-12" y="-24" width="18" height="6" fill="#c1272d" />
          <rect x="-15" y="-70" width="24" height="8" rx="2" fill="#2f3a44" />
          <circle cx="-3" cy="-75" r="6" fill="#ffd23f" />
          <g transform="translate(24 5)">
            <path d="M0 0 h30 l-5 8 h-20z" fill="#1f5fa8" />
            <path d="M14 0 v-16 l10 14z" fill="#fff" />
          </g>
        </g>
      )
    case 1: // Tétouan : médina blanche aux portes vertes, cigogne
      return (
        <g>
          <rect x="-50" y="-34" width="30" height="34" fill="#f7f2e6" />
          <rect x="-24" y="-46" width="28" height="46" fill="#ffffff" />
          <rect x="0" y="-28" width="34" height="28" fill="#f0e9da" />
          <rect x="34" y="-20" width="20" height="20" fill="#faf6ee" />
          <path d="M-12 0 V-14 a6 6 0 0 1 12 0 V0Z" fill="#1d7a5f" />
          <rect x="-44" y="-26" width="7" height="8" rx="3" fill="#1d7a5f" />
          <rect x="10" y="-20" width="7" height="8" rx="3" fill="#1d7a5f" />
          {/* Nid de cigogne sur le toit, comme Bellarej. */}
          <ellipse cx="-10" cy="-48" rx="8" ry="2.6" fill="#8a5a35" />
          <ellipse cx="-10" cy="-54" rx="4" ry="5" fill="#fff" />
          <path d="M-7 -57 l7 1.5" stroke="#e5533c" strokeWidth="1.8" />
          <path d="M-14 -53 q3 4 7 1" fill="#2b2b2b" />
        </g>
      )
    case 2: // Chefchaouen : Rif enneigé et maisons bleues
      return (
        <g>
          <path d="M-64 0 L-30 -56 L-6 -28 L20 -66 L62 0Z" fill="#8aa1b8" />
          <path d="M20 -66 L10 -52 L20 -54 L28 -48Z M-30 -56 L-38 -44 L-30 -46 L-24 -42Z" fill="#fff" />
          <rect x="-48" y="-26" width="26" height="26" fill="#5b8fd6" />
          <rect x="-24" y="-36" width="24" height="36" fill="#3a6ea5" />
          <rect x="0" y="-22" width="30" height="22" fill="#6b9fe0" />
          <rect x="30" y="-14" width="18" height="14" fill="#8ab4ee" />
          <path d="M-16 0 V-12 a5 5 0 0 1 10 0 V0Z" fill="#8a5a35" />
          <rect x="8" y="-16" width="6" height="7" fill="#f7f2e6" />
          <rect x="-42" y="-20" width="6" height="6" fill="#f7f2e6" />
        </g>
      )
    case 3: // Fès : Bab Boujloud et cuves des tanneurs
      return (
        <g>
          <rect x="-44" y="-50" width="76" height="50" fill="#2f6fb5" />
          <rect x="-44" y="-56" width="76" height="6" fill="#1d7a5f" />
          <path d="M-44 -56 h6 v-4 h6 v4 h6 v-4 h6 v4 h6 v-4 h6 v4 h6 v-4 h6 v4 h6 v-4 h6 v4 h6 v-4 h6 v4 h4" fill="#1d7a5f" />
          <path d="M-18 0 V-28 a12 12 0 0 1 24 0 V0Z" fill="#f0e2c8" />
          <path d="M-38 -10 V-26 a6 6 0 0 1 12 0 V-10Z" fill="#f0e2c8" />
          <path d="M14 -10 V-26 a6 6 0 0 1 12 0 V-10Z" fill="#f0e2c8" />
          <g transform="translate(-30 13)">
            <ellipse rx="9" ry="4" fill="#e0b13c" />
            <ellipse cx="22" rx="9" ry="4" fill="#c0392b" />
            <ellipse cx="44" rx="9" ry="4" fill="#7a5230" />
            <ellipse cx="66" rx="9" ry="4" fill="#2f8fbf" />
          </g>
        </g>
      )
    case 4: // Meknès : Bab Mansour entre deux oliviers
      return (
        <g>
          <rect x="-40" y="-46" width="80" height="46" fill="#d9a066" />
          <rect x="-46" y="-40" width="10" height="40" fill="#c98e5c" />
          <rect x="36" y="-40" width="10" height="40" fill="#c98e5c" />
          <path d="M-14 0 V-26 a14 14 0 0 1 28 0 V0Z" fill="#6b4a2e" />
          <rect x="-40" y="-50" width="80" height="4" fill="#1d7a5f" />
          <path d="M-32 -36 h12 M20 -36 h12 M-32 -28 h12 M20 -28 h12" stroke="#1d7a5f" strokeWidth="3" />
          <g transform="translate(-60 0)">
            <rect x="-2" y="-14" width="4" height="14" fill="#7a6a55" />
            <circle cy="-20" r="10" fill="#8a9a6b" />
          </g>
          <g transform="translate(60 0)">
            <rect x="-2" y="-12" width="4" height="12" fill="#7a6a55" />
            <circle cy="-18" r="9" fill="#6f7f52" />
          </g>
        </g>
      )
    case 5: // Rabat : tour Hassan, colonnes, Bou Regreg
      return (
        <g>
          <path d="M-64 2 Q-50 -6 -34 2 V20 H-64Z" fill="#3d8fc4" />
          <rect x="-16" y="-66" width="30" height="66" fill="#c98e5c" />
          <path d="M-10 -56 h18 M-10 -40 h18 M-10 -24 h18" stroke="#a96f42" strokeWidth="3" />
          <path d="M-6 -48 V-54 a4 4 0 0 1 8 0 V-48Z" fill="#7a4f2c" />
          <g fill="#f0e2c8">
            {[22, 32, 42, 52].map((x) => (
              <rect key={x} x={x} y={-14} width="5" height="14" />
            ))}
          </g>
        </g>
      )
    case 6: // Casablanca : mosquée Hassan II sur l'océan
      return (
        <g>
          <path d="M-64 2 Q-30 -6 0 2 T64 0 V22 H-64Z" fill="#3d8fc4" />
          <path d="M-58 10 q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="#7cc3e8" strokeWidth="2" fill="none" />
          <rect x="-10" y="-82" width="20" height="84" fill="#e8dcc4" />
          <rect x="-10" y="-82" width="20" height="5" fill="#1d7a5f" />
          <rect x="-10" y="-40" width="20" height="4" fill="#1d7a5f" />
          <path d="M-6 -70 h12 v14 h-12z" fill="#1d7a5f" opacity="0.6" />
          <rect x="-4" y="-92" width="8" height="10" fill="#1d7a5f" />
          <circle cy="-95" r="2.4" fill="#e0b13c" />
          <rect x="10" y="-22" width="44" height="22" fill="#f7f2e6" />
          <path d="M14 0 V-12 a6 6 0 0 1 12 0 V0Z M32 0 V-12 a6 6 0 0 1 12 0 V0Z" fill="#1d7a5f" />
        </g>
      )
    case 7: // Marrakech : Koutoubia, remparts ocre, palmier, calèche
      return (
        <g>
          <rect x="-60" y="-14" width="120" height="14" fill="#c4693d" />
          <path d="M-60 -14 h8 v-5 h8 v5 h8 v-5 h8 v5 h8 v-5 h8 v5 h8 v-5 h8 v5 h8 v-5 h8 v5 h8 v-5 h8 v5 h8 v-5 h8 v5" fill="#c4693d" />
          <rect x="-12" y="-74" width="24" height="60" fill="#d9844f" />
          <rect x="-8" y="-84" width="16" height="10" fill="#d9844f" />
          <circle cy="-89" r="3" fill="#e0b13c" />
          <path d="M-6 -60 V-66 a6 6 0 0 1 12 0 V-60Z" fill="#a8502a" />
          <rect x="-12" y="-46" width="24" height="3" fill="#1d7a5f" />
          <g transform="translate(38 -14)">
            <path d="M0 0 Q2 -18 0 -34" stroke="#a0662b" strokeWidth="4" fill="none" />
            <path d="M0 -34 q-14 -2 -18 6 M0 -34 q14 -2 18 6 M0 -34 q-6 -10 -16 -10 M0 -34 q6 -10 16 -10" stroke="#4f9a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(-46 14)">
            <circle r="4" fill="none" stroke="#3b2f2f" strokeWidth="1.6" />
            <path d="M-6 -6 h14 v-6 h-14z" fill="#1d7a5f" />
            <path d="M8 -9 h8 M18 -12 q4 0 4 6 v6 M14 0 v-8" stroke="#6b4a2e" strokeWidth="2" fill="none" />
          </g>
        </g>
      )
    case 8: // Essaouira : remparts, canons, barques bleues, mouettes
      return (
        <g>
          <path d="M-64 0 H64 V22 H-64Z" fill="#3d8fc4" />
          <path d="M-58 10 q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="#7cc3e8" strokeWidth="2" fill="none" />
          <path d="M-60 0 V-30 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 V0Z" fill="#d9c3a0" />
          <rect x="-50" y="-16" width="10" height="3" fill="#3b3b3b" />
          <circle cx="-30" cy="-14" r="3" fill="#7a5230" />
          <g transform="translate(6 6)">
            <path d="M0 0 h34 l-6 8 h-22z" fill="#1f5fa8" />
            <rect y="-2" width="34" height="3" fill="#f2f2f2" />
          </g>
          <g transform="translate(26 13) scale(0.8)">
            <path d="M0 0 h34 l-6 8 h-22z" fill="#1f5fa8" />
            <rect y="-2" width="34" height="3" fill="#e2445c" />
          </g>
          <path d="M14 -40 q5 -5 10 0 q5 -5 10 0 M34 -54 q4 -4 8 0 q4 -4 8 0" stroke="#f8f8f8" strokeWidth="2" fill="none" />
        </g>
      )
    default: // Merzouga : soleil, dunes, caravane
      return (
        <g>
          <circle cx="40" cy="-60" r="14" fill="#fff1c9" />
          <path d="M-64 0 Q-30 -36 0 -10 T64 -14 V0Z" fill="#e8954a" />
          <path d="M-64 0 Q-10 -20 30 -2 T64 -4 V0Z" fill="#d97c35" />
          {[-30, 2].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i ? -6 : -16}) scale(${i ? 0.8 : 1})`} fill="#8a5a35">
              <path d="M-14 0 q2 -12 10 -12 q4 -8 10 0 q6 -6 10 2 q4 -4 8 -6 l2 4 q-4 2 -6 8 v14 h-3 v-12 h-14 v12 h-3 v-12 q-6 0 -6 -10z" />
            </g>
          ))}
          <path d="M-8 -14 h7 v-5 h-7z" fill="#c1272d" />
        </g>
      )
  }
}

/** Haut Atlas, en travers de la carte : sommets enneigés, puis un premier plan plus chaud. */
function Atlas({ y, largeur }: { y: number; largeur: number }) {
  const l = largeur
  return (
    <g transform={`translate(0 ${y})`}>
      <path d={`M0 10 L${l * 0.12} -34 L${l * 0.24} -8 L${l * 0.4} -52 L${l * 0.56} -14 L${l * 0.72} -46 L${l * 0.88} -12 L${l} -36 V30 H0Z`} fill="#a58b73" />
      <path
        d={`M${l * 0.12} -34 l-7 10 l7 -2 l6 4z M${l * 0.4} -52 l-9 13 l9 -3 l8 5z M${l * 0.72} -46 l-8 12 l8 -3 l7 5z M${l} -36 l-8 11 l8 -2z`}
        fill="#ffffff"
      />
      <path d={`M0 30 Q${l * 0.2} -6 ${l * 0.42} 20 T${l * 0.8} 12 T${l} 18 V50 H0Z`} fill="#bf9d76" />
    </g>
  )
}

/** Rivière qui traverse la carte (le Bou Regreg, avant Rabat). */
function Riviere({ y, largeur }: { y: number; largeur: number }) {
  const l = largeur
  const d = `M-10 ${y + 4} C${l * 0.25} ${y - 10} ${l * 0.45} ${y + 14} ${l * 0.7} ${y} S${l + 10} ${y - 6} ${l + 10} ${y - 6}`
  return (
    <g>
      <path d={d} stroke="#7cc3e8" strokeWidth="16" fill="none" />
      <path d={d} stroke="#3d8fc4" strokeWidth="10" fill="none" />
      <path d={d} stroke="#9fd8f0" strokeWidth="1.5" strokeDasharray="6 12" fill="none" />
    </g>
  )
}

interface Props {
  /** Étapes et trésors, dans l'ordre de la route. */
  noeuds: Point[]
  /** Étapes seules (une par ville, dans l'ordre d'`ETAPES`). */
  etapes: Point[]
  largeur: number
  hauteur: number
}

export function CarteMaroc({ noeuds, etapes, largeur, hauteur }: Props) {
  const ys = etapes.map((e) => e.y)
  const n = ys.length
  // Rivière entre le trésor de Meknès et Rabat ; Haut Atlas entre le trésor d'Essaouira et Merzouga.
  const yRiviere = n > 5 ? ys[5] - 51 : null
  const yAtlas = n > 9 ? (ys[8] + 114 + ys[9]) / 2 - 6 : null
  const decor = useMemo(
    () => semerDecor(noeuds, etapes, largeur, hauteur, { bandes: yRiviere === null ? [] : [{ y: yRiviere, demi: 14 }] }),
    // Les nœuds ne bougent qu'avec la liste des étapes : leur nombre suffit.
    [noeuds.length, largeur, hauteur],
  )
  const route = cheminDeLaRoute(noeuds)
  const stops: { offset: number; couleur: string }[] = []
  ys.forEach((y, i) => {
    stops.push({ offset: y / hauteur, couleur: SOL[REGIONS_ETAPES[i] ?? 'nord'] })
    if (i === 8 && yAtlas !== null) stops.push({ offset: yAtlas / hauteur, couleur: SOL.atlas })
  })

  return (
    <svg className="carte-maroc absolute inset-0 h-full w-full" viewBox={`0 0 ${largeur} ${hauteur}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sol-maroc" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={hauteur}>
          {stops.map((s, i) => (
            <stop key={i} offset={Math.min(1, Math.max(0, s.offset))} stopColor={s.couleur} />
          ))}
        </linearGradient>
      </defs>
      <rect width={largeur} height={hauteur} fill="url(#sol-maroc)" />
      {yRiviere !== null && <Riviere y={yRiviere} largeur={largeur} />}
      {yAtlas !== null && <Atlas y={yAtlas} largeur={largeur} />}
      {n > 9 && (
        // Grandes dunes autour de Merzouga, jusqu'au bas de la carte.
        <g>
          <path d={`M0 ${ys[9] - 30} Q${largeur * 0.3} ${ys[9] - 70} ${largeur * 0.55} ${ys[9] - 34} T${largeur} ${ys[9] - 50} V${hauteur} H0Z`} fill="#eab877" opacity="0.7" />
          <path d={`M0 ${ys[9] + 60} Q${largeur * 0.4} ${ys[9] + 20} ${largeur * 0.7} ${ys[9] + 64} T${largeur} ${ys[9] + 50} V${hauteur} H0Z`} fill="#e3a865" opacity="0.6" />
        </g>
      )}
      {decor
        .filter((e) => e.type !== 'nuage')
        .map((e, i) => (
          <g key={i} transform={`translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) scale(${(e.miroir ? -e.echelle : e.echelle).toFixed(2)} ${e.echelle.toFixed(2)})`}>
            {DECOR[e.type]}
          </g>
        ))}
      {/* Route de terre battue : bord, piste, pointillés clairs. */}
      <path d={route} stroke="#d4c09a" strokeWidth="26" fill="none" strokeLinecap="round" />
      <path d={route} stroke="#e7d6b4" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d={route} stroke="#fff8e6" strokeWidth="3" strokeDasharray="2 10" fill="none" strokeLinecap="round" />
      {etapes.map((e, i) => {
        const v = placeVignette(e, i, largeur)
        return (
          <g key={i} transform={`translate(${v.x} ${v.y})`}>
            <Monument index={i} />
          </g>
        )
      })}
      {/* Les nuages passent au-dessus de tout. */}
      {decor
        .filter((e) => e.type === 'nuage')
        .map((e, i) => (
          <g key={i} transform={`translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) scale(${e.echelle.toFixed(2)})`}>
            {DECOR.nuage}
          </g>
        ))}
    </svg>
  )
}
