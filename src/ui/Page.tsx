import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  titre: string
  /** Bouton retour en haut à gauche, façon barre de navigation iOS. */
  retour?: { libelle: string; action: () => void }
  /** Élément à droite du grand titre (ex. série). */
  accessoire?: ReactNode
  children: ReactNode
}

/**
 * Écran avec grand titre iOS : le titre s'affiche en grand, puis une barre de navigation
 * compacte en verre apparaît quand il sort de l'écran au défilement.
 */
export function Page({ titre, retour, accessoire, children }: Props) {
  const repere = useRef<HTMLHeadingElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = repere.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-44px 0px 0px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div>
      <header
        className={`fixed inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-200 ${
          compact ? 'verre !border-x-0 !border-t-0 !shadow-none' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-11 max-w-xl items-center px-2">
          <div className="flex min-w-0 flex-1">
            {retour && (
              <button
                type="button"
                onClick={retour.action}
                className="pressable flex min-h-11 items-center gap-0.5 pr-2 text-accent"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={2.4} aria-hidden />
                <span className="t-corps truncate">{retour.libelle}</span>
              </button>
            )}
          </div>
          <p
            className={`t-gras max-w-[55%] truncate text-center transition-opacity duration-200 ${compact ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={!compact}
          >
            {titre}
          </p>
          <div className="flex flex-1 justify-end pr-2">{compact && accessoire}</div>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+2.75rem)]">
        <div className="flex items-end justify-between gap-3 pb-2 pt-1">
          <h1 ref={repere} className="t-grand-titre">
            {titre}
          </h1>
          {accessoire && <div className="pb-1.5">{accessoire}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
