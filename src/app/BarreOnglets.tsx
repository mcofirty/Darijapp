import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { etirement, grossissement, ongletLePlusProche, positionSousLeDoigt } from './glisser'
import { IconeOnglet } from './icones'
import { ONGLETS, type Onglet } from './onglets'

interface Props {
  actif: Onglet
  onChange: (onglet: Onglet) => void
}

interface Glissement {
  pointeur: number
  departX: number
  derniereX: number
  derniereT: number
  a_bouge: boolean
}

const N = ONGLETS.length

/**
 * Barre d'onglets flottante façon « liquid glass » : une lentille de verre marque l'onglet actif.
 * On peut toucher un onglet ou faire glisser le doigt le long de la barre : la lentille suit,
 * s'étire avec la vitesse, grossit les icônes survolées, puis se cale sur l'onglet le plus proche.
 */
export function BarreOnglets({ actif, onChange }: Props) {
  const indexActif = ONGLETS.findIndex((o) => o.id === actif)
  const [position, setPosition] = useState(indexActif)
  const [etire, setEtire] = useState(1)
  const [glisse, setGlisse] = useState(false)
  const rail = useRef<HTMLUListElement>(null)
  const geste = useRef<Glissement | null>(null)

  useEffect(() => {
    if (!geste.current) setPosition(indexActif)
  }, [indexActif])

  function positionDe(x: number): number {
    const r = rail.current!.getBoundingClientRect()
    return positionSousLeDoigt(x, r.left, r.width, N)
  }

  function debut(e: PointerEvent<HTMLUListElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    geste.current = { pointeur: e.pointerId, departX: e.clientX, derniereX: e.clientX, derniereT: e.timeStamp, a_bouge: false }
  }

  function deplacement(e: PointerEvent<HTMLUListElement>) {
    const g = geste.current
    if (!g || g.pointeur !== e.pointerId) return
    if (!g.a_bouge && Math.abs(e.clientX - g.departX) < 8) return
    if (!g.a_bouge) {
      g.a_bouge = true
      setGlisse(true)
    }
    const r = rail.current!.getBoundingClientRect()
    const dt = Math.max(e.timeStamp - g.derniereT, 1)
    const vitesse = (e.clientX - g.derniereX) / (r.width / N) / dt
    g.derniereX = e.clientX
    g.derniereT = e.timeStamp
    setPosition(positionDe(e.clientX))
    setEtire(etirement(vitesse))
  }

  function fin(e: PointerEvent<HTMLUListElement>) {
    const g = geste.current
    if (!g || g.pointeur !== e.pointerId) return
    geste.current = null
    const cible = ongletLePlusProche(positionDe(e.clientX), N)
    setGlisse(false)
    setEtire(1)
    setPosition(cible)
    if (cible !== indexActif) onChange(ONGLETS[cible].id)
  }

  function annulation() {
    geste.current = null
    setGlisse(false)
    setEtire(1)
    setPosition(indexActif)
  }

  return (
    <nav
      aria-label="Navigation principale"
      data-sans-balayage
      className="verre fixed inset-x-[21px] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 mx-auto h-[62px] max-w-xl rounded-full px-[9px] py-1"
    >
      <ul
        ref={rail}
        className="relative flex h-full touch-none select-none"
        onPointerDown={debut}
        onPointerMove={deplacement}
        onPointerUp={fin}
        onPointerCancel={annulation}
      >
        {/* Lentille de verre */}
        <li
          aria-hidden
          className={`lentille pointer-events-none absolute inset-y-0 -left-[5px] rounded-full ${
            glisse ? 'lentille-goutte' : 'lentille-active lentille-ressort'
          }`}
          style={{
            width: `calc(${100 / N}% + 10px)`,
            transform: `translateX(calc(${position} * (100% - 10px))) scale(${etire}, ${glisse ? 1.08 / Math.sqrt(etire) : 1})`,
          }}
        />
        {ONGLETS.map((o, i) => {
          const estActif = glisse ? ongletLePlusProche(position, N) === i : i === indexActif
          return (
            <li key={o.id} className="relative flex flex-1">
              <button
                type="button"
                onClick={(e) => {
                  // Le clic clavier ou lecteur d'écran (sans pointeur) change d'onglet directement.
                  if (e.detail === 0) onChange(o.id)
                }}
                aria-current={i === indexActif ? 'page' : undefined}
                className={`flex w-full flex-col items-center justify-center gap-[2px] rounded-full text-[11px] font-medium leading-none tracking-[0.01em] transition-colors duration-200 ${
                  estActif ? 'font-semibold text-accent' : 'text-texte'
                }`}
              >
                <span
                  className={`transition-[transform,filter] duration-200 ${estActif && !glisse ? 'drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_45%,transparent)]' : ''}`}
                  style={{ transform: `scale(${glisse ? grossissement(i - position) : estActif ? 1.06 : 1})` }}
                >
                  <IconeOnglet onglet={o.id} />
                </span>
                {o.libelle}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
