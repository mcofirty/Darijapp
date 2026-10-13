import { useEffect, useState } from 'react'
import { couleurDuScore } from '../scoring/score'

const RAYON = 52
const CIRCONFERENCE = 2 * Math.PI * RAYON

/**
 * Score de prononciation dans un anneau qui se remplit selon la note (sur 100), le chiffre au
 * milieu, de la couleur de la réussite (voir couleurDuScore) ; or en dégradé à 100, disque noir à 0.
 */
export function AnneauScore({ score, taille = 132 }: { score: number; taille?: number }) {
  const note = Math.round(Math.min(100, Math.max(0, score)))
  // L'anneau part de 0 et se remplit à l'affichage (transition CSS, coupée par « Réduire les animations »).
  const [rempli, setRempli] = useState(0)
  useEffect(() => {
    const image = requestAnimationFrame(() => setRempli(note))
    return () => cancelAnimationFrame(image)
  }, [note])
  const couleur = couleurDuScore(note)
  const or = note >= 100
  const nul = note === 0
  return (
    <svg viewBox="0 0 120 120" width={taille} height={taille} role="img" aria-label={`Score : ${note} sur 100`} className="mx-auto block">
      {or && (
        <defs>
          <linearGradient id="anneau-or" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1a8" />
            <stop offset="0.45" stopColor="#d4a017" />
            <stop offset="1" stopColor="#a8780a" />
          </linearGradient>
        </defs>
      )}
      {nul && <circle cx="60" cy="60" r={RAYON - 8} fill={couleur} />}
      <circle cx="60" cy="60" r={RAYON} fill="none" stroke="var(--remplissage)" strokeWidth="10" />
      <circle
        className="anneau-score"
        cx="60"
        cy="60"
        r={RAYON}
        fill="none"
        stroke={or ? 'url(#anneau-or)' : couleur}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRCONFERENCE}
        strokeDashoffset={CIRCONFERENCE * (1 - rempli / 100)}
        transform="rotate(-90 60 60)"
        opacity={rempli > 0 ? 1 : 0}
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="38"
        fontWeight="700"
        fill={nul ? '#ffffff' : or ? '#b8860b' : couleur}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {note}
      </text>
      <text x="60" y="86" textAnchor="middle" fontSize="11" fontWeight="600" fill={nul ? '#ffffff' : 'var(--texte-2)'}>
        / 100
      </text>
    </svg>
  )
}
