import type { ReactNode } from 'react'
import { palierDe } from '../../gamification/jardin'
import { article } from '../../gamification/souk'

/**
 * La plante de l'utilisateur, dessinée en SVG : 10 stades (Terreau, Graine, Germe, Pousse, Tige,
 * Feuilles, Bouton, Fleur, Fruit, Arbre) de 3 paliers chacun, une espèce et un pot choisis au souk.
 * `avancement` (0 à 1 dans le stade, un tiers par palier) la fait grandir petit à petit, et chaque
 * palier ajoute un détail visible (terre arrosée, graine qui se fend, crosse, coccinelle, tuteur…).
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
  jasmin: { feuille: '#2e7a36', feuilleSombre: '#24632b', tige: '#3d6b2a', fleur: '#ffffff', coeur: '#f7e7a6', fruit: '#2b2440', largeur: 0.38, forme: 'buisson', tronc: '#5a4a2e' },
  grenadier: { feuille: '#3f8f3a', feuilleSombre: '#2f7530', tige: '#6b4a2e', fleur: '#ef4a26', coeur: '#ffb02e', fruit: '#c0262d', largeur: 0.3, forme: 'buisson', tronc: '#6b4a2e' },
  arganier: { feuille: '#7fa03c', feuilleSombre: '#66862e', tige: '#6e5a3c', fleur: '#e8e3b0', coeur: '#c9c070', fruit: '#c8b23a', largeur: 0.28, forme: 'buisson', tronc: '#6e5a3c' },
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
  const palier = palierDe(croissance)
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
      els.push(espece === 'menthe' || espece === 'rosier' || espece === 'jasmin' ? fleur(x, y, espece === 'menthe' ? 3 : 4, e, `a${i}`, espece) : fruit(x, y, espece === 'olivier' ? 1.8 : 3, e, `a${i}`))
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
    // Un bouton, puis trois, puis celui du haut s'entrouvre.
    els.push(palier === 3 ? fleur(50, sommet - 3, 3.2, e, 1, espece) : bouton(50, sommet - 2, 3 + croissance * 1.5, e, 1))
    if (palier >= 2) els.push(bouton(35, SOL - h * 0.45 - 14, 2.5, e, 2))
    if (palier >= 2) els.push(bouton(65, SOL - h * 0.55 - 14, 2.5, e, 3))
  }
  if (stade === 8) {
    // Une fleur, puis la floraison complète.
    els.push(fleur(50, sommet - 3, 5 + croissance, e, 1, espece))
    if (palier >= 2) els.push(fleur(35, SOL - h * 0.45 - 15, 3.5, e, 2, espece))
    if (palier >= 2) els.push(fleur(65, SOL - h * 0.55 - 15, 3.5, e, 3, espece))
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
      {pot === 'tamegroute' && [0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${33 + i * 6.5} ${SOL + 3} q1.4 ${4 + (i % 3) * 3} 0 ${7 + (i % 3) * 3}`} stroke="#2f5216" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />)}
      {pot === 'berbere' && (
        <g fill="#a63a22">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${36 + i * 8} ${SOL + 18} l4 -7 l4 7z`} />
          ))}
          <rect x="31" y={SOL + 8} width="38" height="1.4" fill="#2b2b2b" />
        </g>
      )}
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
  /** Numéro du dernier changement de stade d'une animation : rebond et étincelles. */
  pop?: number
}

/** La plante seule, dans son pot. */
export function Plante({ stade, avancement = 1, espece = 'menthe', pot, taille = 56, vivante = false, pop = 0 }: PlanteProps) {
  return (
    <svg viewBox="0 0 100 120" width={taille} height={taille * 1.2} role="img" aria-label={`Plante, stade ${stade} sur 10, palier ${palierDe(avancement)} sur 3`}>
      <PlanteDessin stade={stade} avancement={avancement} espece={espece} vivante={vivante} pop={pop} />
      <Pot pot={pot} />
    </svg>
  )
}

/** Étincelles qui jaillissent quand la plante change de stade (repère de la plante). */
function Etincelles() {
  return (
    <g aria-hidden>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * 2 * Math.PI
        return (
          <circle
            key={i}
            className="etincelle"
            cx="50"
            cy="55"
            r={i % 2 ? 1.6 : 2.4}
            fill={i % 3 === 0 ? '#ffcc00' : i % 3 === 1 ? '#ffffff' : '#7ed957'}
            style={{ '--dx': `${Math.cos(a) * 34}px`, '--dy': `${Math.sin(a) * 30}px`, animationDelay: `${(i % 3) * 60}ms` } as React.CSSProperties}
          />
        )
      })}
    </g>
  )
}

function PlanteDessin({ stade, avancement, espece, vivante, pop = 0 }: { stade: number; avancement: number; espece: string; vivante: boolean; pop?: number }) {
  const e = ESPECES[espece] ?? ESPECES.menthe
  const croissance = Math.min(1, Math.max(0, avancement))
  const n = Math.min(Math.max(stade, 1), 10)
  return (
    <>
      <g key={pop} className={pop > 0 ? 'plante-pop' : undefined}>
        <PlanteVivante stade={n} croissance={croissance} e={e} espece={espece} vivante={vivante} />
      </g>
      {pop > 0 && <Etincelles key={`e${pop}`} />}
    </>
  )
}

/** Mélange deux couleurs #rrggbb (t = 0 : la première, 1 : la seconde). */
function melange(a: string, b: string, t: number): string {
  const c = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2].map((i) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t).toString(16).padStart(2, '0')).join('')}`
}

/** Hauteur approximative de la plante (repère du buisson), pour placer les visiteurs. */
function hauteur(stade: number, croissance: number): number {
  return 6 + (stade - 3 + croissance) * 8.5
}

/** Terreau : terre sèche et fissurée, puis arrosée, puis creusée pour la graine. */
function Terreau({ palier, t }: { palier: number; t: number }) {
  if (palier === 1)
    return (
      <g stroke="#6e4e33" strokeWidth="0.5" fill="none" strokeLinecap="round">
        <path d="M38 88 l4 -0.6 l2 0.8 l3 -0.5" />
        <path d="M53 87.6 l3 0.7 l2 -0.6 l4 0.5" />
        <path d="M46 89.2 l2 -0.5 l3 0.4" />
      </g>
    )
  if (palier === 2)
    return (
      <g>
        {/* Terre mouillée qui brille, et les dernières gouttes. */}
        <ellipse cx="46" cy={SOL - 0.6} rx="7" ry="1" fill="#fff" opacity="0.18" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${44 + i * 6} ${SOL - 14 + ((t * 30 + i * 7) % 10)} q-1.4 2.4 0 3.2 q1.4 -0.8 0 -3.2z`} fill="#7cc3f0" opacity="0.85" />
        ))}
      </g>
    )
  return (
    <g>
      {/* Un petit trou creusé au doigt, la terre repoussée sur le côté. */}
      <ellipse cx="50" cy={SOL - 0.3} rx={2.6 + t} ry="1.1" fill="#2e1a0d" />
      <path d={`M${45 - t} ${SOL - 0.6} q2 -1.6 3.4 -0.4`} stroke="#7a5232" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** Graine : posée sur la terre, puis enfouie sous une petite bosse, puis fendue avec sa racine. */
function Graine({ palier, t, e }: { palier: number; t: number; e: Espece }) {
  if (palier === 1)
    return (
      <g>
        <ellipse cx="50" cy={SOL - 2.4} rx="3.4" ry="2.2" fill="#8b5a2b" transform={`rotate(-15 50 ${SOL - 2.4})`} />
        <ellipse cx="49" cy={SOL - 3.2} rx="1.2" ry="0.6" fill="#fff" opacity="0.4" />
      </g>
    )
  if (palier === 2)
    return (
      <g>
        <ellipse cx="50" cy={SOL - 1.2} rx={5 + t} ry={2.4 + t * 0.6} fill="#5a371f" />
        <ellipse cx="51" cy={SOL - 2.2} rx="2.6" ry="1.6" fill="#8b5a2b" />
      </g>
    )
  return (
    <g>
      <ellipse cx="50" cy={SOL - 1.2} rx="6" ry="2.6" fill="#5a371f" />
      {/* Les deux moitiés de la graine s'écartent : une racine blanche descend, une pointe verte monte. */}
      <ellipse cx="48.3" cy={SOL - 2.2} rx="2.2" ry="1.6" fill="#8b5a2b" transform={`rotate(-20 48.3 ${SOL - 2.2})`} />
      <ellipse cx="52" cy={SOL - 2.2} rx="2.2" ry="1.6" fill="#8b5a2b" transform={`rotate(25 52 ${SOL - 2.2})`} />
      <path d={`M49.5 ${SOL - 1} q-2 ${2 + t * 2} 1 ${3 + t * 3}`} stroke="#f3ead8" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d={`M50.2 ${SOL - 3} q0.6 ${-1.5 - t * 2} 1.8 ${-2 - t * 2}`} stroke={e.tige} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity={0.4 + t * 0.6} />
    </g>
  )
}

/** Germe, avant ses feuilles : la terre se soulève et se fend, puis une crosse sort, tête en bas. */
function Emergence({ palier, t, e }: { palier: number; t: number; e: Espece }) {
  if (palier === 1)
    return (
      <g>
        <path d={`M43 ${SOL} q7 ${-4 - t * 2} 14 0z`} fill="#5a371f" />
        <path d={`M48 ${SOL - 2.5} l1.5 1.4 l1.4 -1.6 l1.6 1.2`} stroke="#2e1a0d" strokeWidth="0.6" fill="none" />
        <path d={`M50 ${SOL - 2.6} q0.4 ${-1 - t * 2} 1.6 ${-1.6 - t * 2}`} stroke={e.feuille} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
    )
  const h = 5 + t * 5
  return (
    <g>
      <path d={`M43 ${SOL} q7 -3 14 0z`} fill="#5a371f" />
      <path d={`M48 ${SOL - 1} C48 ${SOL - h} 54 ${SOL - h - 1.5} 54 ${SOL - h + 3}`} stroke={e.tige} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="54.2" cy={SOL - h + 4} rx="1.6" ry="2.2" fill={e.feuille} />
    </g>
  )
}

/** Petits visiteurs des paliers : coccinelle, escargot, papillon, abeille, oiseau et son nid. */
function Visiteurs({ stade, palier, croissance, e }: { stade: number; palier: number; croissance: number; e: Espece }) {
  const h = hauteur(stade, croissance)
  const els: ReactNode[] = []
  if (stade === 4 && palier === 3)
    els.push(
      <g key="coccinelle" transform={`translate(58 ${SOL - h * 0.55})`}>
        <circle r="2.4" fill="#e0282e" />
        <path d="M0 -2.4 V2.4" stroke="#1c1c1e" strokeWidth="0.4" />
        <circle cx="-2.2" r="1.2" fill="#1c1c1e" />
        <circle cx="0.9" cy="-1" r="0.5" fill="#1c1c1e" />
        <circle cx="1" cy="1" r="0.5" fill="#1c1c1e" />
        <circle cx="-0.9" cy="0.4" r="0.45" fill="#1c1c1e" />
      </g>,
    )
  if (stade === 5 && palier >= 2)
    els.push(
      <g key="tuteur">
        <rect x="41.6" y={SOL - h * 0.85} width="1.6" height={h * 0.85} rx="0.8" fill="#d9b26f" />
        <path d={`M42.4 ${SOL - h * 0.6} q4 -1 7.6 0`} stroke="#f2e6c9" strokeWidth="0.8" fill="none" />
      </g>,
    )
  if (stade === 5 && palier === 3)
    els.push(
      <g key="escargot" transform={`translate(33 ${SOL - 6.4})`}>
        <path d="M-3 2 h9 q1 0 1 -1 l-1 -2" fill="#c8b48a" />
        <circle cx="0" cy="-0.6" r="2.8" fill="#a0662b" />
        <path d="M0 -0.6 m-1.6 0 a1.6 1.6 0 1 1 1.6 1.6" stroke="#6b4423" strokeWidth="0.5" fill="none" />
        <path d="M6 1 l1 -2.6 M6.6 1 l1.8 -2" stroke="#c8b48a" strokeWidth="0.5" />
      </g>,
    )
  if (stade === 6 && palier === 3)
    els.push(
      <g key="papillon" transform={`translate(70 ${SOL - h - 2})`}>
        <g className="visiteur-vol">
        <ellipse cx="-2.2" cy="-1.4" rx="2.6" ry="2" fill="#ff9f1c" transform="rotate(-25 -2.2 -1.4)" />
        <ellipse cx="2.2" cy="-1.4" rx="2.6" ry="2" fill="#ff9f1c" transform="rotate(25 2.2 -1.4)" />
        <ellipse cx="-1.6" cy="1.6" rx="1.6" ry="1.3" fill="#ffbf69" />
        <ellipse cx="1.6" cy="1.6" rx="1.6" ry="1.3" fill="#ffbf69" />
        <rect x="-0.35" y="-2.6" width="0.7" height="5" rx="0.35" fill="#1c1c1e" />
        </g>
      </g>,
    )
  if (stade === 8 && palier === 3)
    els.push(
      <g key="abeille" transform={`translate(62 ${SOL - h - 4})`}>
        <g className="visiteur-vol">
        <ellipse cx="-0.6" cy="-2" rx="1.4" ry="1" fill="#fff" opacity="0.85" />
        <ellipse cx="1" cy="-2" rx="1.4" ry="1" fill="#fff" opacity="0.85" />
        <ellipse rx="2.6" ry="1.7" fill="#ffcc00" />
        <path d="M-0.8 -1.6 v3.2 M0.9 -1.6 v3.2" stroke="#1c1c1e" strokeWidth="0.7" />
        </g>
      </g>,
    )
  if (stade === 9 && palier === 3) els.push(fruit(36, SOL - 6, 2.2, e, 'tombe'))
  if (stade === 10 && palier === 3) {
    const r = 22 + 8 * croissance
    const haut = SOL - 34 - 10 * croissance
    els.push(
      <g key="nid" transform={`translate(${50 + r * 0.55} ${haut - r * 0.55})`}>
        <path d="M-5 0 q5 4 10 0 z" fill="#8a5a35" />
        <path d="M-5 0 q5 2 10 0" stroke="#5c3b20" strokeWidth="0.5" fill="none" />
        <circle cx="1" cy="-3" r="2.4" fill="#7a8fa6" />
        <circle cx="3.2" cy="-5" r="1.6" fill="#7a8fa6" />
        <path d="M4.6 -5 l1.8 0.4 l-1.8 0.6z" fill="#f2a900" />
        <circle cx="3.6" cy="-5.3" r="0.35" fill="#1c1c1e" />
      </g>,
    )
  }
  return <>{els}</>
}

function PlanteVivante({ stade: n, croissance, e, espece, vivante }: { stade: number; croissance: number; e: Espece; espece: string; vivante: boolean }) {
  const palier = palierDe(croissance)
  // Avancement dans le palier (0 à 1), pour les détails propres à chaque palier.
  const t = Math.min(1, Math.max(0, croissance * 3 - (palier - 1)))
  // Fruits verts, puis qui mûrissent, puis mûrs.
  const fruitMur = n === 9 && palier < 3 ? melange('#8bc34a', e.fruit, palier === 1 ? 0 : 0.5 + t * 0.4) : e.fruit
  const ep = fruitMur === e.fruit ? e : { ...e, fruit: fruitMur }
  // Terre sèche au premier palier, mouillée au deuxième, puis terre fraîche.
  const terre = n === 1 && palier === 1 ? '#9a7650' : n === 1 && palier === 2 ? '#3f2414' : '#5a371f'
  // Le germe de l'espèce n'apparaît qu'au 3e palier du stade 3 : il pousse alors sur ce seul tiers.
  const especeDessin = n === 3 ? Math.max(0, croissance * 3 - 2) : croissance
  return (
    <g className={vivante ? 'plante-vivante' : undefined}>
      {/* Terre bombée au-dessus du rebord du pot (sèche, mouillée ou fraîche), quelques cailloux. */}
      <path d={`M27 ${SOL - 2.5} Q50 ${SOL - 8.5} 73 ${SOL - 2.5}Z`} fill={terre} />
      <circle cx="40" cy={SOL - 4.6} r="0.9" fill="#8a6a4f" />
      <circle cx="61" cy={SOL - 4} r="0.7" fill="#8a6a4f" />
      {n <= 2 || (n === 3 && palier < 3) ? (
        // Les tout premiers paliers se jouent au ras de la terre : dessinés plus grands, sur la terre bombée.
        <g transform={`translate(50 ${SOL - 5.4}) scale(1.7) translate(-50 ${-SOL})`}>
          {n === 1 ? <Terreau palier={palier} t={t} /> : n === 2 ? <Graine palier={palier} t={t} e={e} /> : <Emergence palier={palier} t={t} e={e} />}
        </g>
      ) : e.forme === 'palmier' ? (
        <Palmier stade={n} croissance={especeDessin} e={ep} />
      ) : e.forme === 'cactus' ? (
        <Cactus stade={n} croissance={especeDessin} e={ep} />
      ) : (
        <Buisson stade={n} croissance={especeDessin} e={ep} espece={espece} />
      )}
      <Visiteurs stade={n} palier={palier} croissance={croissance} e={ep} />
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
 if (id === 'montagnes')
    return (
      <g>
        <rect width="360" height="300" fill="#cfe2f5" />
        <path d="M0 200 L70 110 L120 160 L190 70 L260 150 L310 105 L360 160 V250 H0Z" fill="#8aa1b8" />
        <path d="M190 70 L172 93 L182 90 L190 100 L200 88 L210 94Z M70 110 L58 126 L70 122 L80 128Z M310 105 L298 120 L312 117 L320 122Z" fill="#ffffff" />
        <path d="M0 225 Q90 190 180 220 T360 210 V250 H0Z" fill="#6f8f5a" />
        <g fill="#c98e5c">
          <rect x="20" y="206" width="30" height="20" />
          <rect x="44" y="198" width="22" height="28" />
          <rect x="300" y="200" width="34" height="24" />
        </g>
        <g fill="#7a4f2c">
          <rect x="28" y="212" width="5" height="6" />
          <rect x="52" y="206" width="5" height="6" />
          <rect x="312" y="208" width="5" height="6" />
        </g>
        <rect y="250" width="360" height="50" fill="#b9a27e" />
        <rect y="250" width="360" height="3" fill="#a08a66" />
      </g>
    )
  if (id === 'port')
    return (
      <g>
        <rect width="360" height="300" fill="#bfe3f7" />
        <circle cx="300" cy="55" r="20" fill="#fff6c8" />
        <rect y="160" width="360" height="90" fill="#3d8fc4" />
        <path d="M0 175 q15 -4 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#7cc3e8" strokeWidth="2" fill="none" />
        <path d="M0 160 V120 h14 v-10 h12 v10 h20 v-10 h12 v10 h22 V160Z" fill="#d9c3a0" />
        {[[200, 205], [255, 222], [150, 228]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 0 h42 l-7 10 h-28z" fill="#1f5fa8" />
            <rect x="0" y="-2" width="42" height="3" fill="#f2f2f2" />
            <path d="M20 -2 v-20 l12 18z" fill="#ffffff" opacity={i === 0 ? 1 : 0} />
          </g>
        ))}
        <path d="M60 80 q6 -5 12 0 q6 -5 12 0" stroke="#f8f8f8" strokeWidth="2" fill="none" />
        <rect y="250" width="360" height="50" fill="#e7d6b4" />
        <rect y="250" width="360" height="3" fill="#d4c09a" />
      </g>
    )
  if (id === 'nuitetoilee')
    return (
      <g>
        <defs>
          <linearGradient id="nuit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f1838" />
            <stop offset="1" stopColor="#2c3c78" />
          </linearGradient>
        </defs>
        <rect width="360" height="300" fill="url(#nuit)" />
        <circle cx="290" cy="60" r="22" fill="#fff6d5" />
        <circle cx="300" cy="54" r="20" fill="#1a2550" />
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 350 + 5} cy={(i * 53) % 190 + 8} r={i % 4 === 0 ? 1.6 : 0.9} fill="#ffffff" opacity={0.5 + (i % 3) * 0.2} />
        ))}
        <rect y="250" width="360" height="50" fill="#2f4a3a" />
        <rect y="250" width="360" height="3" fill="#3f5f4a" />
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

/** Ordre de dessin des objets et animaux, du fond vers l'avant. */
const PROFONDEUR = ['moineaux', 'dromadaire', 'cigogne', 'lanterne', 'fennec', 'tapis', 'theiere', 'chat', 'tajine', 'poule', 'tortue']

/** Objets et animaux posés autour du pot. */
function Objet({ id }: { id: string }) {
  if (id === 'moineaux')
    return (
      <g fill="#6b4f36">
        {[
          [34, 52, 1],
          [66, 40, 0.8],
        ].map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
            <path d="M-9 -2 q5 -6 9 0 q4 -6 9 0 q-4 -1 -9 3 q-5 -4 -9 -3z" />
            <circle cx="0" cy="1" r="2.2" />
          </g>
        ))}
      </g>
    )
  if (id === 'dromadaire')
    return (
      <g transform="translate(6 208) scale(0.45)" fill="#c8955a" opacity="0.9">
        <path d="M10 30 q4 -22 20 -22 q8 -14 18 0 q10 0 12 14 h6 q2 -14 10 -18 l3 4 q-6 6 -6 18 q-2 8 -8 8 h-50z" />
        {[16, 24, 50, 58].map((x) => (
          <rect key={x} x={x} y="36" width="3.4" height="24" rx="1.5" />
        ))}
        <circle cx="76" cy="16" r="1" fill="#3a2a1a" />
      </g>
    )
  if (id === 'fennec')
    return (
      <g transform="translate(52 214)">
        <path d="M6 30 q-10 -2 -6 -12 q4 6 10 6z" fill="#e8b77a" />
        <ellipse cx="22" cy="28" rx="13" ry="9" fill="#e8b77a" />
        <circle cx="30" cy="16" r="7" fill="#efc48c" />
        <path d="M24 12 l-4 -14 l8 9z M34 11 l6 -13 l-1 12z" fill="#efc48c" />
        <path d="M25 9 l-3 -8 l5 6z M34 9 l4 -8 l-1 7z" fill="#f5a7a0" />
        <circle cx="28" cy="16" r="1" fill="#2a1a0a" />
        <circle cx="33" cy="16" r="1" fill="#2a1a0a" />
        <circle cx="31" cy="20" r="1.2" fill="#2a1a0a" />
      </g>
    )
  if (id === 'poule')
    return (
      <g transform="translate(316 252)">
        <path d="M2 14 q-6 -10 2 -16 q2 6 8 6z" fill="#7a3a1a" />
        <ellipse cx="16" cy="16" rx="12" ry="9" fill="#a0522d" />
        <circle cx="26" cy="7" r="5" fill="#a0522d" />
        <path d="M24 2 q2 -4 4 0 q2 -3 3 1z" fill="#e0282e" />
        <path d="M31 8 l4 1.5 l-4 1.5z" fill="#f2a900" />
        <path d="M29 11 q1 3 -1 4" fill="#e0282e" />
        <circle cx="27.5" cy="6.5" r="0.8" fill="#1c1c1e" />
        <path d="M13 24 v6 M19 24 v6" stroke="#f2a900" strokeWidth="1.4" />
      </g>
    )
  if (id === 'tortue')
    return (
      <g transform="translate(104 266)">
        <ellipse cx="34" cy="10" rx="5" ry="3.6" fill="#9aa64a" />
        <circle cx="35.5" cy="9" r="0.7" fill="#1c1c1e" />
        {[6, 22].map((x) => (
          <ellipse key={x} cx={x} cy="14" rx="3" ry="2.2" fill="#9aa64a" />
        ))}
        <path d="M2 13 q12 -18 28 0z" fill="#7a6a2a" />
        <path d="M8 12 l4 -6 l6 0 l4 6 M12 6 l3 -3 l3 3" stroke="#c8b46a" strokeWidth="0.9" fill="none" />
      </g>
    )
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
  if (id === 'tapis')
    return (
      <g transform="translate(92 246)">
        <path d="M8 0 h160 l14 16 h-188z" fill="#b3262e" />
        <path d="M14 3 h148 l9 10 h-166z" fill="none" stroke="#f2e2c4" strokeWidth="1.4" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${34 + i * 28} 8 l7 -4 l7 4 l-7 4z`} fill="#1c1c1e" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`f${i}`} d={`M${-2 + i * 16.5} 16 v4`} stroke="#f2e2c4" strokeWidth="1.2" />
        ))}
      </g>
    )
  if (id === 'tajine')
    return (
      <g transform="translate(18 236)">
        <ellipse cx="26" cy="24" rx="26" ry="6" fill="#8a3f1d" />
        <path d="M6 22 Q26 -10 46 22z" fill="#b65a2c" />
        <path d="M14 17 q12 -6 24 0" stroke="#f2d0a0" strokeWidth="1.4" fill="none" />
        <circle cx="26" cy="2" r="3" fill="#8a3f1d" />
      </g>
    )
  if (id === 'chat')
    return (
      <g transform="translate(262 222)">
        <path d="M44 26 q14 -2 10 -16" stroke="#e09a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="30" cy="22" rx="18" ry="9" fill="#e09a4a" />
        <circle cx="12" cy="14" r="9" fill="#e09a4a" />
        <path d="M5 8 l1 -8 l6 5z M15 6 l5 -6 l2 8z" fill="#e09a4a" />
        <path d="M7 14 q2 1.5 4 0 M14 14 q2 1.5 4 0" stroke="#5a3a1a" strokeWidth="1" fill="none" />
        <path d="M26 16 q4 4 0 8 M34 15 q4 4 0 8" stroke="#c0782f" strokeWidth="1.4" fill="none" />
        <text x="22" y="2" fontSize="8" fill="#8a8a8e">z</text>
        <text x="28" y="-5" fontSize="6" fill="#8a8a8e">z</text>
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
export function Jardin({
  stade,
  avancement,
  espece,
  pot,
  fond,
  objets,
  pop = 0,
}: {
  stade: number
  avancement: number
  espece: string
  pot: string
  fond: string
  objets: string[]
  pop?: number
}) {
  return (
    <svg viewBox="0 0 360 300" className="block h-auto w-full" role="img" aria-label={`Ton jardin : plante au stade ${stade} sur 10`}>
      <Fond id={fond} />
      {/* Du plus loin au plus proche : le dromadaire et les moineaux derrière, la tortue devant. */}
      {[...objets]
        .sort((a, b) => PROFONDEUR.indexOf(a) - PROFONDEUR.indexOf(b))
        .map((o) => (
          <Objet key={o} id={o} />
        ))}
      {/* La plante, 2,1 fois sa taille : le bas du pot touche le sol. */}
      <g transform="translate(75 10) scale(2.1)">
        <PlanteDessin stade={stade} avancement={avancement} espece={espece} vivante pop={pop} />
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
  if (id === 'meknes') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M9 1 h10 l8 8 v10 l-8 8 h-10 l-8 -8 v-10 z' fill='%23d9822b' fill-opacity='0.85'/><rect x='10' y='10' width='8' height='8' fill='%232563c9'/></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  if (id === 'rabat') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='16' viewBox='0 0 24 16'><path d='M0 6 l6 -5 l6 5 l6 -5 l6 5 v4 l-6 -5 l-6 5 l-6 -5 l-6 5 z' fill='%231c1c1e'/></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  if (id === 'tetouan') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='30' viewBox='0 0 26 30'><path d='M13 1 L25 8 L25 22 L13 29 L1 22 L1 8 Z' fill='%231d7a5f' fill-opacity='0.85'/><path d='M13 8 L19 11.5 L19 18.5 L13 22 L7 18.5 L7 11.5 Z' fill='white'/></svg>`
    return `url("data:image/svg+xml,${svg}")`
  }
  return undefined
}
