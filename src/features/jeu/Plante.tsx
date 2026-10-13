import { article } from '../../gamification/souk'

/**
 * La plante de l'utilisateur : elle pousse avec son niveau (Terreau, Graine, Germe, Pousse, Tige,
 * Feuilles, Bouton, Fleur, Fruit, Arbre), dans le pot choisi au souk.
 */
export function Plante({ niveau, pot, taille = 56 }: { niveau: number; pot: string; taille?: number }) {
  const couleurPot = article(pot)?.apercu ?? '#c4693d'
  const n = Math.min(niveau, 10)
  const feuille = (x: number, y: number, sens: 1 | -1, k = 1) => (
    <path
      key={`${x}-${y}-${sens}`}
      d={`M${x} ${y} q${8 * sens * k} ${-6 * k} ${14 * sens * k} ${-2 * k} q${-6 * sens * k} ${8 * k} ${-14 * sens * k} ${2 * k}z`}
      fill="#3fae5a"
    />
  )
  const hautTige = [0, 0, 0, 52, 44, 34, 30, 26, 26, 26][n - 1] ?? 26
  return (
    <svg viewBox="0 0 64 64" width={taille} height={taille} role="img" aria-label={`Plante au niveau ${niveau}`}>
      {/* Plante */}
      {n === 2 && <ellipse cx="32" cy="44" rx="3" ry="2" fill="#8b5a2b" />}
      {n >= 3 && n < 10 && <path d={`M32 46 V${hautTige}`} stroke="#2f8f46" strokeWidth="2.4" strokeLinecap="round" />}
      {n === 3 && [feuille(32, 46 - 2, 1, 0.5), feuille(32, 46 - 2, -1, 0.5)]}
      {n >= 4 && n < 10 && [feuille(32, hautTige + 12, 1), feuille(32, hautTige + 8, -1)]}
      {n >= 6 && n < 10 && [feuille(32, hautTige + 4, 1, 0.8), feuille(32, hautTige + 18, -1, 0.8)]}
      {n === 7 && <ellipse cx="32" cy={hautTige - 2} rx="3" ry="4.5" fill="#d64b6a" />}
      {n === 8 &&
        [0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="32" cy={hautTige - 6} rx="3.2" ry="6" fill="#e2445c" transform={`rotate(${a} 32 ${hautTige})`} />
        ))}
      {n === 8 && <circle cx="32" cy={hautTige} r="2.6" fill="#ffcc00" />}
      {n === 9 && [<circle key="f1" cx="27" cy={hautTige + 2} r="4.5" fill="#ff8c1a" />, <circle key="f2" cx="37" cy={hautTige - 1} r="4.5" fill="#ff8c1a" />]}
      {n === 10 && (
        <>
          <path d="M32 46 V30" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="22" r="13" fill="#3fae5a" />
          <circle cx="24" cy="26" r="8" fill="#38a052" />
          <circle cx="40" cy="26" r="8" fill="#38a052" />
          <circle cx="28" cy="20" r="2.2" fill="#ff8c1a" />
          <circle cx="38" cy="24" r="2.2" fill="#ff8c1a" />
        </>
      )}
      {/* Terre et pot */}
      <ellipse cx="32" cy="46" rx="15" ry="3" fill="#6b4226" />
      <path d="M15 46 h34 l-4 15 a2 2 0 0 1-2 1.6 H21 a2 2 0 0 1-2-1.6z" fill={couleurPot} />
      <rect x="13.5" y="44" width="37" height="5" rx="2" fill={couleurPot} />
      <rect x="13.5" y="44" width="37" height="5" rx="2" fill="#000" opacity="0.12" />
      {pot === 'safi' && <path d="M22 54 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3" fill="none" stroke="#f5e6b8" strokeWidth="1.3" />}
      {pot === 'cuivre' && [50, 54, 58].map((y) => <circle key={y} cx={y === 54 ? 28 : 36} cy={y} r="1.2" fill="#e8a46b" />)}
      {pot === 'tadelakt' && <path d="M19 50 q13 4 26 0" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />}
    </svg>
  )
}

/** Motif de zellige (SVG en fond), choisi au souk pour la carte du jour. */
export function motifZellige(id: string): string | undefined {
  if (id === 'etoile') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='none' stroke-width='1.6'><path d='M14 3 L17 11 L25 14 L17 17 L14 25 L11 17 L3 14 L11 11 Z' stroke='%23c1272d'/><rect x='9' y='9' width='10' height='10' transform='rotate(45 14 14)' stroke='%23006233'/></g></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  if (id === 'fassi') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 1 L23 12 L12 23 L1 12 Z' fill='%232563c9' fill-opacity='0.85'/><path d='M12 7 L17 12 L12 17 L7 12 Z' fill='white'/></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  return undefined
}
