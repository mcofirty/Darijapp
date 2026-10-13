import { useRef, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react'
import { ongletLePlusProche, positionSousLeDoigt } from '../app/glisser'

type Variante = 'plein' | 'teinte' | 'gris'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  grand?: boolean
  children: ReactNode
}

const STYLES: Record<Variante, string> = {
  plein: 'bg-accent-plein text-white',
  teinte: 'bg-accent-doux text-accent',
  gris: 'bg-remplissage text-texte',
}

/** Bouton iOS en capsule : plein (action principale), teinté ou gris. */
export function Bouton({ variante = 'plein', grand = false, className = '', children, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`pressable inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-40 ${
        grand ? 't-gras min-h-[50px] px-6' : 't-appel min-h-11 px-4'
      } ${STYLES[variante]} ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Contrôle segmenté iOS 26 : curseur en verre ; on touche un segment ou on fait glisser le curseur.
 * Pendant le geste, il devient une goutte de verre qui suit le doigt, puis se cale avec un rebond.
 */
export function Segmente<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { id: T; libelle: string }[]
  valeur: T
  onChange: (id: T) => void
}) {
  const n = options.length
  const indexActif = Math.max(options.findIndex((o) => o.id === valeur), 0)
  const rail = useRef<HTMLDivElement>(null)
  const departX = useRef<number | null>(null)
  const [position, setPosition] = useState<number | null>(null)

  function positionDe(x: number) {
    const r = rail.current!.getBoundingClientRect()
    return positionSousLeDoigt(x, r.left, r.width, n)
  }

  function debut(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    departX.current = e.clientX
    // Appui sur le segment actif : le curseur devient tout de suite une goutte de verre.
    if (ongletLePlusProche(positionDe(e.clientX), n) === indexActif) setPosition(indexActif)
  }

  function deplacement(e: PointerEvent<HTMLDivElement>) {
    if (departX.current === null) return
    if (position === null && Math.abs(e.clientX - departX.current) < 6) return
    setPosition(positionDe(e.clientX))
  }

  function fin(e: PointerEvent<HTMLDivElement>) {
    if (departX.current === null) return
    departX.current = null
    const cible = ongletLePlusProche(positionDe(e.clientX), n)
    setPosition(null)
    if (cible !== indexActif) onChange(options[cible].id)
  }

  function annulation() {
    departX.current = null
    setPosition(null)
  }

  const glisse = position !== null
  const affiche = glisse ? ongletLePlusProche(position, n) : indexActif
  return (
    <div className="rounded-full bg-remplissage p-0.5">
      <div
        ref={rail}
        role="tablist"
        data-sans-balayage
        className="relative flex touch-pan-y select-none"
        onPointerDown={debut}
        onPointerMove={deplacement}
        onPointerUp={fin}
        onPointerCancel={annulation}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 rounded-full ${
            glisse ? 'lentille-goutte' : 'verre verre-curseur lentille-ressort'
          }`}
          style={{
            width: `${100 / n}%`,
            transform: `translateX(${(position ?? indexActif) * 100}%) scale(${glisse ? '1.06, 1.25' : '1'})`,
          }}
        />
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={valeur === o.id}
            onClick={(e) => {
              // Clavier ou lecteur d'écran (sans pointeur) : changement direct.
              if (e.detail === 0) onChange(o.id)
            }}
            className={`t-sous-titre relative min-h-8 flex-1 whitespace-nowrap rounded-full px-1 text-[clamp(12px,3.5vw,0.882rem)] font-semibold transition-transform duration-150 ${
              glisse && affiche === i ? 'scale-105' : ''
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Interrupteur iOS 26 (64 × 28 pt, pastille en capsule). Pendant l'appui, la pastille grossit et
 * devient une goutte de verre.
 */
export function Interrupteur({ actif, onChange, libelle }: { actif: boolean; onChange: (v: boolean) => void; libelle: string }) {
  const [appui, setAppui] = useState(false)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={() => onChange(!actif)}
      onPointerDown={() => setAppui(true)}
      onPointerUp={() => setAppui(false)}
      onPointerLeave={() => setAppui(false)}
      onPointerCancel={() => setAppui(false)}
      className={`relative h-[28px] w-[64px] shrink-0 rounded-full transition-colors duration-200 ${actif ? 'bg-vert-vif' : 'bg-remplissage'}`}
    >
      <span
        className={`lentille-ressort absolute left-[2px] top-[2px] h-[24px] w-[38px] rounded-full ${
          appui ? 'lentille-goutte' : 'bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]'
        }`}
        style={{ transform: `translateX(${actif ? 22 : 0}px) scale(${appui ? '1.3, 1.45' : '1'})` }}
      />
    </button>
  )
}

/** État vide (équivalent de ContentUnavailableView). */
export function Vide({ icone, titre, texte }: { icone: ReactNode; titre: string; texte: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-3 text-texte-3">{icone}</div>
      <p className="t-titre-3">{titre}</p>
      <p className="t-sous-titre mt-1 text-texte-2">{texte}</p>
    </div>
  )
}
