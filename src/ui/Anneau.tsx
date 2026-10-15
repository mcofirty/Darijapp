import { useEffect, useState, type ReactNode } from 'react'

/**
 * Anneau de progression : il part de zéro et se remplit en douceur à l'affichage (transition coupée par
 * « Réduire les animations »). Le contenu (chiffre, icône) se place au centre.
 */
export function Anneau({
  fraction,
  taille = 64,
  epaisseur = 7,
  couleur = 'var(--accent)',
  piste = 'var(--remplissage)',
  label,
  children,
}: {
  fraction: number
  taille?: number
  epaisseur?: number
  couleur?: string
  piste?: string
  label: string
  children?: ReactNode
}) {
  const cible = Math.min(1, Math.max(0, fraction))
  const [rempli, setRempli] = useState(0)
  useEffect(() => {
    const image = requestAnimationFrame(() => setRempli(cible))
    return () => cancelAnimationFrame(image)
  }, [cible])
  const r = 50 - epaisseur / 2
  const c = 2 * Math.PI * r
  return (
    <span role="img" aria-label={label} className="relative inline-flex shrink-0 items-center justify-center" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke={piste} strokeWidth={epaisseur} />
        <circle
          className="anneau-score"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - rempli)}
          opacity={rempli > 0 ? 1 : 0}
        />
      </svg>
      <span className="relative flex flex-col items-center leading-none" aria-hidden>
        {children}
      </span>
    </span>
  )
}
