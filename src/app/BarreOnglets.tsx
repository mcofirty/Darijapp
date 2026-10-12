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
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl rounded-[2.25rem] border border-white/70 bg-orange-50/70 p-1.5 shadow-[0_10px_30px_-8px_rgba(120,53,15,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-stone-900/70 dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <ul
        ref={rail}
        className="relative flex touch-none select-none"
        onPointerDown={debut}
        onPointerMove={deplacement}
        onPointerUp={fin}
        onPointerCancel={annulation}
      >
        {/* Lentille de verre */}
        <li
          aria-hidden
          className={`lentille pointer-events-none absolute inset-y-0 left-0 rounded-[1.75rem] border ${
            glisse
              ? 'border-white/80 bg-white/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(120,53,15,0.4)] backdrop-blur-[2px] dark:border-white/20 dark:bg-white/10'
              : 'border-white/60 bg-orange-200/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/10'
          } ${glisse ? '' : 'lentille-ressort'}`}
          style={{
            width: `${100 / N}%`,
            transform: `translateX(${position * 100}%) scale(${etire}, ${glisse ? 1.08 / Math.sqrt(etire) : 1})`,
          }}
        />
        {ONGLETS.map((o, i) => {
          const estActif = glisse ? ongletLePlusProche(position, N) === i : i === indexActif
          return (
            <li key={o.id} className="relative flex-1">
              <button
                type="button"
                onClick={(e) => {
                  // Le clic clavier ou lecteur d'écran (sans pointeur) change d'onglet directement.
                  if (e.detail === 0) onChange(o.id)
                }}
                aria-current={i === indexActif ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 rounded-[1.75rem] py-2 text-[0.72rem] font-semibold transition-colors duration-200 ${
                  estActif ? 'text-orange-700 dark:text-orange-400' : 'text-stone-900 dark:text-stone-100'
                }`}
              >
                <span
                  className="transition-transform duration-150"
                  style={{ transform: `scale(${glisse ? grossissement(i - position) : 1})` }}
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
