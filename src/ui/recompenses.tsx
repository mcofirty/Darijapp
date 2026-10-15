import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { COULEURS_RANG } from '../gamification/collection'
import { palierFlamme, type PalierFlamme } from '../gamification/serie'

/** Dégradé de chaque palier de flamme : extérieur, cœur, et lueur portée (aucune pour la flamme éteinte). */
const TEINTES: Record<PalierFlamme, { bas: string; haut: string; coeur: string; lueur: string | null }> = {
  eteinte: { bas: '#9c958f', haut: '#c9c3bd', coeur: '#e6e1dc', lueur: null },
  braise: { bas: '#f0652d', haut: '#ff9a4a', coeur: '#ffd27a', lueur: null },
  flamme: { bas: '#ec4a1f', haut: '#ff8a2a', coeur: '#ffe066', lueur: 'rgba(255, 120, 40, 0.45)' },
  brasier: { bas: '#d6301b', haut: '#ff6a1a', coeur: '#ffd23f', lueur: 'rgba(240, 80, 30, 0.55)' },
  soleil: { bas: '#d6301b', haut: '#ffa514', coeur: '#fff1a8', lueur: 'rgba(255, 170, 20, 0.6)' },
  legende: { bas: '#6a3df0', haut: '#ff4fa3', coeur: '#ffe066', lueur: 'rgba(160, 80, 255, 0.55)' },
}

/**
 * Flamme de série en léger relief : son dégradé et sa lueur évoluent avec la série (braise, flamme,
 * brasier, soleil, légende). Ternie tant que la série n'est pas sécurisée aujourd'hui.
 */
export function Flamme({ jours, active = true, taille = 20 }: { jours: number; active?: boolean; taille?: number }) {
  const id = useId()
  const palier = palierFlamme(jours)
  const t = TEINTES[palier]
  return (
    <svg
      viewBox="0 0 24 28"
      width={taille}
      height={(taille * 28) / 24}
      aria-hidden
      className={`shrink-0 ${active ? '' : 'opacity-55 saturate-[0.35]'}`}
      style={t.lueur && active ? { filter: `drop-shadow(0 1px 3px ${t.lueur})` } : undefined}
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0.3" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor={t.bas} />
          <stop offset="1" stopColor={t.haut} />
        </linearGradient>
        <radialGradient id={`${id}-c`} cx="0.5" cy="0.7" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor={t.coeur} />
          <stop offset="1" stopColor={t.haut} />
        </radialGradient>
      </defs>
      {palier === 'soleil' || palier === 'legende' ? (
        <g stroke={t.haut} strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
          <path d="M2 9l2 1.2M22 9l-2 1.2M1.5 16h2.2M22.5 16h-2.2" />
        </g>
      ) : null}
      <path
        d="M12 1.5c.9 3.6 3.6 5.6 5.6 8.3 1.9 2.5 2.9 5 2.9 7.6 0 5-3.8 9.1-8.5 9.1S3.5 22.4 3.5 17.4c0-3.2 1.6-5.9 3.6-7.6.2 1.9 1 3.3 2.4 4.2-.4-4.7.6-9 2.5-12.5Z"
        fill={`url(#${id}-f)`}
      />
      <path d="M12 13.2c1.7 2.1 3.8 3.7 3.8 6.4a3.8 3.8 0 0 1-7.6 0c0-1.5.6-2.7 1.7-3.6.2.9.7 1.6 1.4 1.9-.3-1.7 0-3.4.7-4.7Z" fill={`url(#${id}-c)`} />
      {/* Reflet : le relief vient d'une lumière en haut à gauche. */}
      <path d="M8.2 12.5c-.9 1.3-1.4 2.8-1.3 4.3" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/**
 * Théière en laiton martelé : chaque quête faite allume une perle de menthe sur sa panse ; les trois
 * allumées, la vapeur monte ; ouverte, elle brille d'or.
 */
export function Theiere({ faites, total, ouverte, taille = 52 }: { faites: number; total: number; ouverte: boolean; taille?: number }) {
  const id = useId()
  const prete = faites >= total
  return (
    <svg viewBox="0 0 48 48" width={taille} height={taille} aria-hidden className="shrink-0" style={{ filter: 'drop-shadow(0 3px 4px var(--ombre-relief))' }}>
      <defs>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ouverte ? '#fff2b0' : '#f4dc8a'} />
          <stop offset="0.5" stopColor={ouverte ? '#e8b923' : '#c99a2e'} />
          <stop offset="1" stopColor={ouverte ? '#a8780a' : '#8a6420'} />
        </linearGradient>
      </defs>
      {prete && (
        <g className="vapeur" stroke="var(--texte-3)" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M20 9c-2-2 2-3 0-6" />
          <path d="M26 9c-2-2 2-3 0-6" />
        </g>
      )}
      {/* Bec, anse, couvercle et panse. */}
      <path d="M36 25c4-1 6-5 8-9-1 5-2 10-7 13" fill={`url(#${id}-l)`} />
      <path d="M12 22c-6 0-7 9-1 11" fill="none" stroke={`url(#${id}-l)`} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17 13h14l-2-3h-10Z" fill={`url(#${id}-l)`} />
      <circle cx="24" cy="9" r="1.8" fill={`url(#${id}-l)`} />
      <path d="M13 22c0-6 5-9 11-9s11 3 11 9c0 9-4 14-11 14S13 31 13 22Z" fill={`url(#${id}-l)`} />
      <path d="M15 40h18l-2-4H17Z" fill={`url(#${id}-l)`} />
      <path d="M16 19c1.5-2.5 4-3.5 6.5-3.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {Array.from({ length: total }, (_, i) => (
        <circle
          key={i}
          cx={24 + (i - (total - 1) / 2) * 6}
          cy="26"
          r="2.3"
          fill={i < faites ? 'var(--vert-vif)' : 'rgba(0, 0, 0, 0.18)'}
          stroke="#ffffff"
          strokeOpacity={i < faites ? 0.8 : 0.3}
          strokeWidth="0.8"
        />
      ))}
    </svg>
  )
}

/**
 * Médaille d'un badge : obtenue, elle est en relief (dégradé, reflet, ombre) avec un anneau qui monte en
 * gamme selon le rang (bronze, argent, or, platine) ; sinon un disque plat et gris.
 */
export function Medaille({
  icone: Icone,
  couleur,
  rang,
  obtenu,
  taille = 56,
}: {
  icone: LucideIcon
  couleur: string
  rang: 0 | 1 | 2 | 3
  obtenu: boolean
  taille?: number
}) {
  if (!obtenu)
    return (
      <span className="flex items-center justify-center rounded-full bg-remplissage text-texte-3" style={{ width: taille, height: taille }} aria-hidden>
        <Icone className="h-7 w-7" strokeWidth={2.2} />
      </span>
    )
  const anneau = COULEURS_RANG[rang]
  return (
    <span
      className="medaille relative flex items-center justify-center rounded-full text-white"
      style={{
        width: taille,
        height: taille,
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${couleur} 55%, #ffffff) 0%, ${couleur} 55%, color-mix(in srgb, ${couleur} 70%, #000000) 100%)`,
        boxShadow: `0 0 0 3px ${anneau}, 0 0 0 4px rgba(0, 0, 0, 0.12), 0 6px 12px -4px var(--ombre-relief), inset 0 2px 2px rgba(255, 255, 255, 0.45), inset 0 -3px 4px rgba(0, 0, 0, 0.2)`,
      }}
      aria-hidden
    >
      <Icone className="h-7 w-7 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" strokeWidth={2.2} />
    </span>
  )
}
