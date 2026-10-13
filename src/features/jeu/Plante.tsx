import type { ReactNode } from 'react'
import { article } from '../../gamification/souk'

/**
 * La plante de l'utilisateur, dessinée en SVG : 10 stades (Terreau, Graine, Germe, Pousse, Tige,
 * Feuilles, Bouton, Fleur, Fruit, Arbre), une espèce et un pot choisis au souk. `avancement`
 * (0 à 1, progression dans le niveau) la fait grandir petit à petit vers le stade suivant.
 * Repère : boîte de 100 × 120, terre du pot à y = 88, la plante pousse vers le haut depuis x = 50.
 */

interface Espece {
  feuille: string
  feuilleSombre: string
  tige: string
  fleur: string
  coeur: string
  fruit: string
  /** Largeur relative des feuilles (l'olivier les a fines, la menthe ronde). */
  largeur: number
  forme: 'buisson' | 'palmier' | 'cactus'
  tronc: string
}

const ESPECES: Record<string, Espece> = {
  menthe: { feuille: '#3fae5a', feuilleSombre: '#2f8f46', tige: '#2f8f46', fleur: '#b07cd8', coeur: '#e9d5ff', fruit: '#b07cd8', largeur: 0.55, forme: 'buisson', tronc: '#5c7a3a' },
  oranger: { feuille: '#2f7d3a', feuilleSombre: '#256b31', tige: '#4b7a2f', fleur: '#ffffff', coeur: '#ffd23f', fruit: '#ff8c1a', largeur: 0.42, forme: 'buisson', tronc: '#7a5230' },
  olivier: { feuille: '#8a9a6b', feuilleSombre: '#6f7f52', tige: '#7a6a55', fleur: '#f3f0d0', coeur: '#d9cf8f', fruit: '#3b2f4a', largeur: 0.22, forme: 'buisson', tronc: '#7a6a55' },
  rosier: { feuille: '#2f7d3a', feuilleSombre: '#256b31', tige: '#3d6b2a', fleur: '#e2445c', coeur: '#b3203a', fruit: '#c0392b', largeur: 0.45, forme: 'buisson', tronc: '#4a5a2a' },
  palmier: { feuille: '#4f9a3a', feuilleSombre: '#3f7f2e', tige: '#a0662b', fleur: '#f2d16b', coeur: '#e0b13c', fruit: '#8a4f1d', largeur: 0.18, forme: 'palmier', tronc: '#a0662b' },
  figuier: { feuille: '#5b9a4a', feuilleSombre: '#4a823b', tige: '#5b9a4a', fleur: '#ffd23f', coeur: '#f2a900', fruit: '#b8325a', largeur: 0.5, forme: 'cactus', tronc: '#4a823b' },
}

const SOL = 88

/** Une feuille en amande, posée en (x, y), orientée selon `angle` (degrés, 0 = vers la droite). */
function feuille(x: number, y: number, angle: number, longueur: number, e: Espece, k: number | string, sombre = false) {
  const l = longueur
  const w = l * e.largeur
  return (
    <path
      key={`f${k}`}
      d={`M0 0 Q${l * 0.45} ${-w} ${l} 0 Q${l * 0.45} ${w} 0 0Z`}
      fill={sombre ? e.feuilleSombre : e.feuille}
      transform={`translate(${x} ${y}) rotate(${angle})`}
    />
  )
}

function fleur(x: number, y: number, r: number, e: Espece, k: number | string, espece: string) {
  if (espece === 'menthe') {
    // Épi de petites fleurs mauves.
    return (
      <g key={`fl${k}`}>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={x} cy={y - i * r * 0.7} r={r * (0.55 - i * 0.08)} fill={e.fleur} />
        ))}
      </g>
    )
  }
  return (
    <g key={`fl${k}`} transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.6} rx={r * 0.5} ry={r * 0.75} fill={e.fleur} stroke={e.fleur === '#ffffff' ? '#e8e2d0' : 'none'} strokeWidth="0.4" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.38} fill={e.coeur} />
    </g>
  )
}

function fruit(x: number, y: number, r: number, e: Espece, k: number | string) {
  return (
    <g key={`fr${k}`}>
      <circle cx={x} cy={y} r={r} fill={e.fruit} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" opacity="0.35" />
    </g>
  )
}

function bouton(x: number, y: number, r: number, e: Espece, k: number | string) {
  return (
    <g key={`b${k}`}>
      <ellipse cx={x} cy={y - r * 0.5} rx={r * 0.55} ry={r} fill={e.fleur === '#ffffff' ? '#f4efe0' : e.fleur} />
      <path d={`M${x - r * 0.6} ${y} q${r * 0.6} ${-r * 0.9} ${r * 1.2} 0`} fill={e.feuilleSombre} />
    </g>
  )
}

/** Plante en buisson (menthe, oranger, olivier, rosier) : tige, feuilles, bouton, fleurs, fruits, puis arbre. */
function Buisson({ stade, croissance, e, espece }: { stade: number; croissance: number; e: Espece; espece: string }) {
  const els: ReactNode[] = []
  if (stade === 10) {
    // Arbre : tronc et couronne, qui s'étoffent avec l'avancement.
    const r = 22 + 8 * croissance
    const haut = SOL - 34 - 10 * croissance
    els.push(<path key="tronc" d={`M47 ${SOL} C46 ${SOL - 14} 49 ${haut + 18} 48 ${haut + 8} L52 ${haut + 8} C51 ${haut + 18} 54 ${SOL - 14} 53 ${SOL}Z`} fill={e.tronc} />)
    const boules = [
      [50, haut - 4, r],
      [50 - r * 0.7, haut + 6, r * 0.7],
      [50 + r * 0.7, haut + 6, r * 0.7],
      [50 - r * 0.35, haut - r * 0.55, r * 0.65],
      [50 + r * 0.4, haut - r * 0.5, r * 0.6],
    ]
    boules.forEach(([x, y, rr], i) => els.push(<circle key={`c${i}`} cx={x} cy={y} r={rr} fill={i % 2 ? e.feuilleSombre : e.feuille} />))
    const points = [
      [-0.5, -0.2],
      [0.45, -0.35],
      [0.1, 0.25],
      [-0.85, 0.3],
      [0.8, 0.3],
      [-0.2, -0.75],
      [0.55, 0.05],
    ]
    points.forEach(([dx, dy], i) => {
      const x = 50 + dx * r
      const y = haut + dy * r
      els.push(espece === 'menthe' || espece === 'rosier' ? fleur(x, y, espece === 'rosier' ? 4 : 3, e, `a${i}`, espece) : fruit(x, y, espece === 'olivier' ? 1.8 : 3, e, `a${i}`))
    })
    return <>{els}</>
  }
  if (stade === 1) return null
  if (stade === 2) {
    // Graine à moitié enfouie, prête à germer.
    return (
      <g>
        <ellipse cx="50" cy={SOL - 1} rx={3.2 + croissance} ry={2.2 + croissance * 0.6} fill="#8b5a2b" />
        <path d={`M50 ${SOL - 3} q1 ${-2 - croissance * 3} 3 ${-3 - croissance * 3}`} stroke={e.tige} strokeWidth="1.2" fill="none" opacity={croissance} />
      </g>
    )
  }
  // Hauteur de la tige : grandit d'un stade à l'autre et à l'intérieur du stade.
  const h = 6 + (stade - 3 + croissance) * 8.5
  const sommet = SOL - h
  els.push(<path key="tige" d={`M50 ${SOL} C49 ${SOL - h * 0.4} 51.5 ${SOL - h * 0.7} 50 ${sommet}`} stroke={e.tige} strokeWidth={1.6 + stade * 0.2} fill="none" strokeLinecap="round" />)
  if (stade === 3) {
    // Germe : deux cotylédons ronds.
    els.push(<ellipse key="c1" cx="45.5" cy={sommet} rx="4.5" ry="2.6" fill={e.feuille} transform={`rotate(-20 45.5 ${sommet})`} />)
    els.push(<ellipse key="c2" cx="54.5" cy={sommet} rx="4.5" ry="2.6" fill={e.feuille} transform={`rotate(20 54.5 ${sommet})`} />)
    return <>{els}</>
  }
  // Paires de feuilles le long de la tige : 1 paire à la Pousse, 2 à la Tige, 4 ensuite.
  const paires = stade === 4 ? 1 : stade === 5 ? 2 : stade === 6 ? 3 + Math.round(croissance) : 4
  const longueur = 8 + stade * 0.9
  for (let p = 0; p < paires; p++) {
    const y = SOL - h * (0.35 + (0.6 * (p + 1)) / (paires + 1))
    els.push(feuille(50, y, -25 - p * 4, longueur, e, `d${p}`, p % 2 === 1))
    els.push(feuille(50, y + 2, 180 + 25 + p * 4, longueur, e, `g${p}`, p % 2 === 0))
  }
  // Feuilles de tête.
  els.push(feuille(50, sommet + 1, -70, longueur * 0.8, e, 'h1'))
  els.push(feuille(50, sommet + 1, -110, longueur * 0.8, e, 'h2', true))
  if (stade >= 6) {
    // Rameaux latéraux.
    els.push(<path key="r1" d={`M50 ${SOL - h * 0.45} q-9 -4 -15 -12`} stroke={e.tige} strokeWidth="1.2" fill="none" />)
    els.push(<path key="r2" d={`M50 ${SOL - h * 0.55} q9 -4 15 -12`} stroke={e.tige} strokeWidth="1.2" fill="none" />)
    els.push(feuille(35, SOL - h * 0.45 - 12, -120, longueur * 0.75, e, 'r1f'))
    els.push(feuille(65, SOL - h * 0.55 - 12, -60, longueur * 0.75, e, 'r2f', true))
  }
  if (stade === 7) {
    els.push(bouton(50, sommet - 2, 3 + croissance * 1.5, e, 1))
    if (croissance > 0.5) els.push(bouton(35, SOL - h * 0.45 - 14, 2.5, e, 2))
  }
  if (stade === 8) {
    els.push(fleur(50, sommet - 3, 5 + croissance, e, 1, espece))
    els.push(fleur(35, SOL - h * 0.45 - 15, 3.5, e, 2, espece))
    els.push(fleur(65, SOL - h * 0.55 - 15, 3.5, e, 3, espece))
  }
  if (stade === 9) {
    els.push(fleur(50, sommet - 3, 4, e, 1, espece))
    const r = espece === 'olivier' ? 1.8 : espece === 'menthe' ? 1.6 : 3 + croissance
    els.push(fruit(36, SOL - h * 0.45 - 10, r, e, 1))
    els.push(fruit(64, SOL - h * 0.55 - 10, r, e, 2))
    if (croissance > 0.4) els.push(fruit(44, SOL - h * 0.7, r, e, 3))
  }
  return <>{els}</>
}

/** Palmier dattier : palmes en éventail, spathe, grappes de dattes, puis stipe. */
function Palmier({ stade, croissance, e }: { stade: number; croissance: number; e: Espece }) {
  if (stade <= 2) return <Buisson stade={stade} croissance={croissance} e={e} espece="palmier" />
  const arbre = stade === 10
  const hTronc = arbre ? 40 + 12 * croissance : 3 + (stade - 3 + croissance) * 2.5
  const sommet = SOL - hTronc
  const nbPalmes = arbre ? 9 : Math.min(9, 2 + stade - 3 + Math.round(croissance))
  const longueur = arbre ? 30 : 10 + (stade - 3 + croissance) * 3
  const els: ReactNode[] = []
  if (hTronc > 4) {
    els.push(<rect key="t" x={50 - (arbre ? 3.5 : 2)} y={sommet} width={arbre ? 7 : 4} height={hTronc} rx="2" fill={e.tronc} />)
    for (let y = sommet + 4; y < SOL - 2; y += 5) els.push(<path key={`s${y}`} d={`M${arbre ? 46.5 : 48} ${y} h${arbre ? 7 : 4}`} stroke="#7a4a1d" strokeWidth="0.8" />)
  }
  for (let i = 0; i < nbPalmes; i++) {
    const a = -170 + (160 * (i + 0.5)) / nbPalmes
    const rad = (a * Math.PI) / 180
    const fx = 50 + Math.cos(rad) * longueur
    const fy = sommet + Math.sin(rad) * longueur * 0.8 + longueur * 0.25
    els.push(<path key={`p${i}`} d={`M50 ${sommet} Q${50 + Math.cos(rad) * longueur * 0.6} ${sommet + Math.sin(rad) * longueur * 0.9} ${fx} ${fy}`} stroke={i % 2 ? e.feuilleSombre : e.feuille} strokeWidth={arbre ? 3.2 : 2.2} fill="none" strokeLinecap="round" />)
  }
  if (stade === 7) els.push(<ellipse key="sp" cx="53" cy={sommet + 3} rx="2" ry={3 + croissance * 2} fill={e.fleur} />)
  if (stade === 8) [-1, 1].forEach((s) => els.push(<path key={`fl${s}`} d={`M${50 + s * 2} ${sommet + 2} l${s * 4} 6 m-${s * 2} -3 l${s * 4} 4`} stroke={e.fleur} strokeWidth="1.6" />))
  if (stade >= 9) {
    ;[-1, 1].forEach((s) => {
      for (let k = 0; k < 5; k++) els.push(<circle key={`d${s}${k}`} cx={50 + s * (3 + (k % 3) * 1.6)} cy={sommet + 4 + Math.floor(k / 2) * 2.4} r={arbre ? 1.6 : 1.2} fill={e.fruit} />)
    })
  }
  return <>{els}</>
}

/** Figuier de Barbarie : raquettes empilées, fleurs jaunes sur les bords, figues rouges. */
function Cactus({ stade, croissance, e }: { stade: number; croissance: number; e: Espece }) {
  if (stade <= 2) return <Buisson stade={stade} croissance={croissance} e={e} espece="figuier" />
  // Raquettes : position du centre, taille, rotation.
  const toutes: [number, number, number, number][] = [
    [50, SOL - 10, 1, 0],
    [42, SOL - 26, 0.9, -25],
    [58, SOL - 28, 0.9, 22],
    [50, SOL - 40, 0.85, 0],
    [34, SOL - 42, 0.8, -40],
    [66, SOL - 44, 0.8, 38],
    [42, SOL - 56, 0.75, -15],
    [58, SOL - 58, 0.75, 15],
    [50, SOL - 70, 0.7, 0],
  ]
  const nb = stade === 10 ? 9 : Math.min(8, stade - 2 + (croissance > 0.5 ? 1 : 0))
  const echelle = stade === 3 ? 0.4 + croissance * 0.3 : stade === 10 ? 1 + croissance * 0.15 : 0.75 + croissance * 0.15
  const els: ReactNode[] = []
  toutes.slice(0, nb).forEach(([x, y, k, a], i) => {
    const s = k * echelle
    const cy = SOL - (SOL - y) * echelle
    els.push(
      <g key={`r${i}`} transform={`translate(${x} ${cy}) rotate(${a})`}>
        <ellipse rx={8 * s} ry={11 * s} fill={i % 2 ? e.feuilleSombre : e.feuille} />
        {[-3, 0, 3].map((dx) => (
          <circle key={dx} cx={dx * s} cy={(dx === 0 ? -3 : 2) * s} r="0.5" fill="#f2f2d0" />
        ))}
      </g>,
    )
  })
  const bords = toutes.slice(0, nb).slice(-3)
  bords.forEach(([x, y, k], i) => {
    const cy = SOL - (SOL - y) * echelle - 10 * k * echelle
    if (stade === 7) els.push(bouton(x, cy, 2.2, e, i))
    if (stade === 8) els.push(fleur(x, cy, 3, e, i, 'figuier'))
    if (stade >= 9) els.push(<ellipse key={`fi${i}`} cx={x} cy={cy} rx="2" ry="2.8" fill={e.fruit} />)
  })
  return <>{els}</>
}

/** Le pot choisi au souk, posé sur la terre. */
function Pot({ pot }: { pot: string }) {
  const couleur = article(pot)?.apercu ?? '#c4693d'
  return (
    <g>
      <ellipse cx="50" cy={SOL} rx="22" ry="4" fill="#6b4226" />
      <path d={`M27 ${SOL} h46 l-5 24 a3 3 0 0 1-3 2.4 H35 a3 3 0 0 1-3-2.4z`} fill={couleur} />
      <rect x="25" y={SOL - 3} width="50" height="7" rx="2.5" fill={couleur} />
      <rect x="25" y={SOL - 3} width="50" height="7" rx="2.5" fill="#000" opacity="0.12" />
      {pot === 'safi' && <path d={`M35 ${SOL + 12} l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4`} fill="none" stroke="#f5e6b8" strokeWidth="1.6" />}
      {pot === 'cuivre' && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={36 + i * 7} cy={SOL + 10 + (i % 2) * 6} r="1.5" fill="#e8a46b" />)}
      {pot === 'tadelakt' && <path d={`M32 ${SOL + 8} q18 5 36 0`} fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.4" />}
    </g>
  )
}

interface PlanteProps {
  stade: number
  /** Avancement dans le niveau en cours (0 à 1). */
  avancement?: number
  espece?: string
  pot: string
  taille?: number
  /** Balancement doux (page « Mon jardin »). */
  vivante?: boolean
}

/** La plante seule, dans son pot. */
export function Plante({ stade, avancement = 1, espece = 'menthe', pot, taille = 56, vivante = false }: PlanteProps) {
  return (
    <svg viewBox="0 0 100 120" width={taille} height={taille * 1.2} role="img" aria-label={`Plante, stade ${stade} sur 10`}>
      <PlanteDessin stade={stade} avancement={avancement} espece={espece} vivante={vivante} />
      <Pot pot={pot} />
    </svg>
  )
}

function PlanteDessin({ stade, avancement, espece, vivante }: { stade: number; avancement: number; espece: string; vivante: boolean }) {
  const e = ESPECES[espece] ?? ESPECES.menthe
  const croissance = Math.min(1, Math.max(0, avancement))
  const n = Math.min(Math.max(stade, 1), 10)
  return (
    <g className={vivante ? 'plante-vivante' : undefined}>
      {/* Terre fraîche, quelques cailloux. */}
      <ellipse cx="50" cy={SOL} rx="20" ry="3" fill="#5a371f" />
      <circle cx="40" cy={SOL - 0.5} r="0.9" fill="#8a6a4f" />
      <circle cx="58" cy={SOL} r="0.7" fill="#8a6a4f" />
      {e.forme === 'palmier' ? (
        <Palmier stade={n} croissance={croissance} e={e} />
      ) : e.forme === 'cactus' ? (
        <Cactus stade={n} croissance={croissance} e={e} />
      ) : (
        <Buisson stade={n} croissance={croissance} e={e} espece={espece} />
      )}
    </g>
  )
}

/** Décor du fond de « Mon jardin » (boîte de 360 × 300, sol à y = 250). */
function Fond({ id }: { id: string }) {
  if (id === 'riad')
    return (
      <g>
        <rect width="360" height="300" fill="#f0e2c8" />
        <path d="M110 250 V120 a70 70 0 0 1 140 0 V250Z" fill="#e2cda8" />
        <path d="M125 250 V125 a55 55 0 0 1 110 0 V250Z" fill="#d6edf7" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 30} y="250" width="30" height="50" fill={i % 2 ? '#1d7a5f' : '#f7f2e6'} />
        ))}
        <rect y="250" width="360" height="4" fill="#c4693d" />
        <ellipse cx="55" cy="238" rx="28" ry="8" fill="#2f8fbf" />
        <rect x="47" y="214" width="16" height="24" rx="3" fill="#e2cda8" />
        <path d="M55 214 q-6 -12 0 -20 q6 8 0 20" fill="#9fd8f0" opacity="0.8" />
      </g>
    )
  if (id === 'ruelle')
    return (
      <g>
        <rect width="360" height="300" fill="#6b9fe0" />
        <rect x="0" y="0" width="360" height="250" fill="#5b8fd6" />
        <path d="M250 250 V110 a40 40 0 0 1 80 0 V250Z" fill="#3a6ea5" />
        <path d="M258 250 V114 a32 32 0 0 1 64 0 V250Z" fill="#8a5a35" />
        <circle cx="312" cy="190" r="3" fill="#e0b13c" />
        <rect x="30" y="80" width="40" height="50" rx="20" fill="#3a6ea5" opacity="0.6" />
        <rect y="250" width="360" height="50" fill="#a9c4ec" />
        <rect y="250" width="360" height="3" fill="#86a9de" />
      </g>
    )
  if (id === 'dunes')
    return (
      <g>
        <defs>
          <linearGradient id="couchant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6b26b" />
            <stop offset="1" stopColor="#f9d9a8" />
          </linearGradient>
        </defs>
        <rect width="360" height="300" fill="url(#couchant)" />
        <circle cx="280" cy="90" r="28" fill="#fff1c9" />
        <path d="M0 200 Q90 150 180 195 T360 180 V300 H0Z" fill="#e8954a" />
        <path d="M0 240 Q120 200 220 240 T360 230 V300 H0Z" fill="#d97c35" />
        <rect y="250" width="360" height="50" fill="#c96d2c" opacity="0.5" />
      </g>
    )
  return (
    <g>
      <defs>
        <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="1" stopColor="#eef7ff" />
        </linearGradient>
      </defs>
      <rect width="360" height="300" fill="url(#ciel)" />
      <ellipse cx="80" cy="60" rx="30" ry="10" fill="#fff" opacity="0.8" />
      <ellipse cx="270" cy="40" rx="24" ry="8" fill="#fff" opacity="0.7" />
      <rect y="250" width="360" height="50" fill="#a7d38b" />
      <rect y="250" width="360" height="3" fill="#8cc06e" />
    </g>
  )
}

/** Objets posés autour du pot. */
function Objet({ id }: { id: string }) {
  if (id === 'lanterne')
    return (
      <g transform="translate(96 186)">
        <path d="M0 0 h24 l-3 8 h-18z" fill="#b8860b" />
        <path d="M3 8 h18 l-2 40 h-14z" fill="#d4a017" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={8 + i * 4} cy={22 + (i % 2) * 8} r="1.6" fill="#fff4c2" />
        ))}
        <path d="M12 -8 v8" stroke="#b8860b" strokeWidth="2" />
        <rect x="2" y="48" width="20" height="4" rx="1" fill="#b8860b" />
        <circle cx="12" cy="-10" r="3" fill="#b8860b" />
      </g>
    )
  if (id === 'theiere')
    return (
      <g transform="translate(250 216)">
        <ellipse cx="18" cy="22" rx="18" ry="12" fill="#c0c0c8" />
        <path d="M34 18 q12 -2 14 -12" stroke="#a8a8b2" strokeWidth="3" fill="none" />
        <path d="M2 16 q-8 2 -6 10" stroke="#a8a8b2" strokeWidth="3" fill="none" />
        <path d="M8 10 q10 -12 20 0z" fill="#d6d6de" />
        <circle cx="18" cy="2" r="2.5" fill="#a8a8b2" />
        <rect x="6" y="32" width="24" height="3" rx="1.5" fill="#a8a8b2" />
        <path d="M40 30 h10 l-2 6 h-6z" fill="#c8e6c9" opacity="0.9" />
      </g>
    )
  if (id === 'cigogne')
    return (
      <g transform="translate(295 150)">
        <path d="M14 70 v30 M20 70 v30" stroke="#e8743b" strokeWidth="1.8" />
        <ellipse cx="17" cy="58" rx="16" ry="12" fill="#f8f8f8" />
        <path d="M5 58 q12 14 28 4 q-6 8 -20 6z" fill="#1c1c1e" />
        <path d="M24 50 q4 -16 2 -26" stroke="#f8f8f8" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="22" r="5" fill="#f8f8f8" />
        <path d="M30 22 l16 4 l-16 0z" fill="#e8743b" />
        <circle cx="27" cy="21" r="1" fill="#1c1c1e" />
      </g>
    )
  return null
}

/** Scène complète de « Mon jardin » : fond, objets et plante en grand. */
export function Jardin({ stade, avancement, espece, pot, fond, objets }: { stade: number; avancement: number; espece: string; pot: string; fond: string; objets: string[] }) {
  return (
    <svg viewBox="0 0 360 300" className="block h-auto w-full" role="img" aria-label={`Ton jardin : plante au stade ${stade} sur 10`}>
      <Fond id={fond} />
      {objets.map((o) => (
        <Objet key={o} id={o} />
      ))}
      {/* La plante, 2,1 fois sa taille : le bas du pot touche le sol. */}
      <g transform="translate(75 10) scale(2.1)">
        <PlanteDessin stade={stade} avancement={avancement} espece={espece} vivante />
        <Pot pot={pot} />
      </g>
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
  if (id === 'tetouan') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='30' viewBox='0 0 26 30'><path d='M13 1 L25 8 L25 22 L13 29 L1 22 L1 8 Z' fill='%231d7a5f' fill-opacity='0.85'/><path d='M13 8 L19 11.5 L19 18.5 L13 22 L7 18.5 L7 11.5 Z' fill='white'/></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  return undefined
}
