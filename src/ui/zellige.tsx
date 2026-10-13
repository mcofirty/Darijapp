import type { CSSProperties } from 'react'
import { useProfil } from '../db/useProfil'

/** Motif de zellige choisi au souk : un carreau SVG répété (taille du carreau d'origine, en px). */
export interface Zellige {
  /** Adresse `data:` du carreau, pour une image SVG (`<pattern>`) ou un fond CSS. */
  uri: string
  largeur: number
  hauteur: number
}

/** Carreaux des zelliges du souk (« aucun » ou inconnu : pas de motif). */
const CARREAUX: Record<string, { svg: string; largeur: number; hauteur: number }> = {
  etoile: {
    largeur: 28,
    hauteur: 28,
    svg: `<g fill='none' stroke-width='1.6'><path d='M14 3 L17 11 L25 14 L17 17 L14 25 L11 17 L3 14 L11 11 Z' stroke='#c1272d'/><rect x='9' y='9' width='10' height='10' transform='rotate(45 14 14)' stroke='#006233'/></g>`,
  },
  fassi: {
    largeur: 24,
    hauteur: 24,
    svg: `<path d='M12 1 L23 12 L12 23 L1 12 Z' fill='#2563c9' fill-opacity='0.85'/><path d='M12 7 L17 12 L12 17 L7 12 Z' fill='white'/>`,
  },
  meknes: {
    largeur: 28,
    hauteur: 28,
    svg: `<path d='M9 1 h10 l8 8 v10 l-8 8 h-10 l-8 -8 v-10 z' fill='#d9822b' fill-opacity='0.85'/><rect x='10' y='10' width='8' height='8' fill='#2563c9'/>`,
  },
  rabat: {
    largeur: 24,
    hauteur: 16,
    svg: `<path d='M0 6 l6 -5 l6 5 l6 -5 l6 5 v4 l-6 -5 l-6 5 l-6 -5 l-6 5 z' fill='#1c1c1e'/>`,
  },
  tetouan: {
    largeur: 26,
    hauteur: 30,
    svg: `<path d='M13 1 L25 8 L25 22 L13 29 L1 22 L1 8 Z' fill='#1d7a5f' fill-opacity='0.85'/><path d='M13 8 L19 11.5 L19 18.5 L13 22 L7 18.5 L7 11.5 Z' fill='white'/>`,
  },
}

export function zellige(id: string): Zellige | undefined {
  const c = CARREAUX[id]
  if (!c) return undefined
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${c.largeur}' height='${c.hauteur}' viewBox='0 0 ${c.largeur} ${c.hauteur}'>${c.svg}</svg>`
  return { uri: `data:image/svg+xml,${encodeURIComponent(svg)}`, largeur: c.largeur, hauteur: c.hauteur }
}

/** Fond CSS du motif ; `taille` règle la largeur d'un carreau (px). */
export function fondZellige(z: Zellige, taille = z.largeur): CSSProperties {
  return { backgroundImage: `url("${z.uri}")`, backgroundSize: `${taille}px`, backgroundPosition: 'center', backgroundRepeat: 'repeat' }
}

/** Zellige choisi dans le profil, ou undefined (« Sans zellige »). */
export function useZellige(): Zellige | undefined {
  return zellige(useProfil().zellige)
}

/**
 * Bandeau de zellige en haut d'une carte (à placer en premier dans une carte à `overflow-hidden`), sur un
 * fond émaillé clair : sans lui, un motif sombre (chevrons de Rabat) disparaîtrait en mode sombre.
 */
export function BandeZellige({ z, className = 'h-10' }: { z: Zellige | undefined; className?: string }) {
  if (!z) return null
  return <div aria-hidden className={`opacity-80 ${className}`} style={{ ...fondZellige(z, 28), backgroundColor: 'var(--zellige-fond)' }} />
}

/**
 * Partie remplie d'une barre de progression : en zellige s'il y en a un (sur un fond clair, comme un
 * carreau émaillé), sinon couleur d'accent.
 */
export function RemplissageBarre({ fraction, duree = 'duration-500' }: { fraction: number; duree?: string }) {
  const z = useZellige()
  const largeur = `${Math.min(1, Math.max(0, fraction)) * 100}%`
  if (!z) return <div className={`h-full rounded-full bg-accent transition-[width] ${duree}`} style={{ width: largeur }} />
  return (
    <div
      className={`h-full rounded-full transition-[width] ${duree}`}
      style={{ width: largeur, ...fondZellige(z, 12), backgroundColor: 'var(--zellige-fond)', boxShadow: 'inset 0 0 0 1px var(--accent)' }}
    />
  )
}

/** Auvent d'échoppe en zellige, au bord festonné (étal du marchand). */
export function Auvent({ z }: { z: Zellige | undefined }) {
  if (!z) return null
  const feston = 'radial-gradient(circle at 50% 0, #000 6.5px, transparent 7px) bottom / 14px 7px repeat-x'
  const bande = 'linear-gradient(#000, #000) top / 100% calc(100% - 7px) no-repeat'
  return (
    <div
      aria-hidden
      className="h-9 opacity-90"
      style={{ ...fondZellige(z, 24), backgroundColor: 'var(--zellige-fond)', mask: `${bande}, ${feston}`, WebkitMask: `${bande}, ${feston}` }}
    />
  )
}

/**
 * Motif SVG (`<pattern>`) du zellige, pour remplir des formes d'un dessin : `fill="url(#id)"`.
 * Chaque forme reçoit `carreaux` × `carreaux` carreaux entiers, alignés sur ses bords.
 */
export function MotifSvg({ z, id, carreaux = 2 }: { z: Zellige; id: string; carreaux?: number }) {
  const c = 1 / carreaux
  return (
    <pattern id={id} width={c} height={c} patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox">
      <rect width={c} height={c} fill="var(--zellige-fond)" />
      <image href={z.uri} width={c} height={c} preserveAspectRatio="none" />
    </pattern>
  )
}
