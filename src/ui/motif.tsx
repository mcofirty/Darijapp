/**
 * Motif géométrique marocain épuré : étoiles à huit branches (deux carrés croisés) et cercles, en traits fins.
 * Purement décoratif, en `currentColor` : il prend la couleur (et l'opacité) de son conteneur.
 */
export function MotifEtoiles({ className = '' }: { className?: string }) {
  const etoile = (x: number, y: number, t: number) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-t} y={-t} width={2 * t} height={2 * t} />
      <rect x={-t} y={-t} width={2 * t} height={2 * t} transform="rotate(45)" />
      <circle r={t * 0.42} />
    </g>
  )
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      {etoile(104, 56, 34)}
      {etoile(150, 130, 22)}
      {etoile(40, 10, 16)}
      <circle cx="104" cy="56" r="52" strokeDasharray="2 5" />
    </svg>
  )
}
