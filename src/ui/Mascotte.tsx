import { useMemo } from 'react'
import { phraseMascotte, type Humeur } from '../gamification/mascotte'

/**
 * Bellarej, la cigogne de l'appli (dessin SVG) : ailes levées et yeux rieurs quand c'est réussi,
 * tête penchée quand c'est raté. Saute à son arrivée (sauf avec Réduire les animations).
 */
export function Mascotte({ humeur, className = 'h-14 w-14' }: { humeur: Humeur; className?: string }) {
  const contente = humeur === 'bravo' || humeur === 'fete' || humeur === 'salut'
  const ailesLevees = humeur === 'fete' || humeur === 'salut'
  return (
    <svg viewBox="0 0 64 64" className={`${className} ${contente ? 'mascotte-saut' : 'mascotte-penche'} shrink-0 overflow-visible`} aria-hidden>
      {/* Pattes et pieds */}
      <g stroke="#e4572e" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M28 46 L26 60 M23 60 H29" />
        <path d="M34 46 L36 60 M33 60 H39" />
      </g>
      {/* Corps, queue noire et cou */}
      <path d="M17 40 L8 44 L12 38 Z" fill="#1c1c1e" />
      <ellipse cx="30" cy="38" rx="14" ry="10" fill="#fff" stroke="#1c1c1e" strokeWidth="1.2" />
      <path d="M36 32 C38 26 37 22 38 16 L44 16 C44 23 45 28 42 34 Z" fill="#fff" stroke="#1c1c1e" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="41" cy="13" r="6.5" fill="#fff" stroke="#1c1c1e" strokeWidth="1.2" />
      {/* Aile : levée pour fêter, repliée sinon */}
      {ailesLevees ? (
        <>
          <path d="M34 33 C28 25 20 17 9 12 C11 15 11 17 13 19 C10 20 10 22 12 25 C9 26 10 28 13 30 C15 32 19 35 27 40 Z" fill="#1c1c1e" />
          <path d="M34 33 C30 28 26 24 20 21 C21 28 23 34 27 40 Z" fill="#fff" stroke="#1c1c1e" strokeWidth="1.2" strokeLinejoin="round" />
        </>
      ) : (
        <path d="M18 36 C26 30 38 32 42 38 C36 46 24 46 18 41 Z" fill="#1c1c1e" />
      )}
      {/* Bec : ouvert quand elle parle de bonne humeur */}
      {contente ? (
        <>
          <path d="M46 11 L61 10 L46 14 Z" fill="#f28c28" />
          <path d="M46 14.5 L59 17 L46 16.5 Z" fill="#e4572e" />
        </>
      ) : (
        <path d="M46 12 L60 16 L46 16 Z" fill="#f28c28" />
      )}
      {/* Œil et joue */}
      {contente ? (
        <path d="M40 12.5 q2 -2.4 4 0" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <circle cx="42" cy="12" r="1.5" fill="#1c1c1e" />
          <path d="M39.5 8.6 L44 9.6" stroke="#1c1c1e" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {contente && <circle cx="39" cy="16" r="1.6" fill="#ff8fa3" opacity="0.8" />}
    </svg>
  )
}

/** La cigogne et sa bulle : une phrase en darija tirée pour l'humeur, avec sa traduction. */
export function MascotteBulle({ humeur, cle, className = '' }: { humeur: Humeur; cle?: unknown; className?: string }) {
  // Une phrase par apparition : `cle` change quand il faut en tirer une nouvelle.
  const phrase = useMemo(() => phraseMascotte(humeur), [humeur, cle])
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascotte humeur={humeur} />
      <p className="relative mb-3 rounded-[18px] rounded-bl-md bg-carte px-3 py-2 shadow-sm">
        <span className="t-gras block">{phrase.latin}</span>
        <span className="t-sous-titre block text-texte-2">{phrase.fr}</span>
      </p>
    </div>
  )
}

/** La phrase seule, sur une ligne (panneau de réponse de la session). */
export function PhraseDeMascotte({ humeur, cle }: { humeur: Humeur; cle?: unknown }) {
  const phrase = useMemo(() => phraseMascotte(humeur), [humeur, cle])
  return (
    <p className="t-sous-titre mt-0.5 text-texte-2">
      <span className="font-semibold text-texte">{phrase.latin}</span> · {phrase.fr}
    </p>
  )
}
