import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BandeZellige, useZellige } from './zellige'

interface Props {
  titre: string
  /** Bouton retour en haut à gauche, façon barre de navigation iOS. */
  retour?: { libelle: string; action: () => void }
  /** Élément à droite du grand titre (ex. série). */
  accessoire?: ReactNode
  /** Onglet principal : le zellige choisi au souk s'efface en haut, derrière le grand titre. */
  zellige?: boolean
  children: ReactNode
}

/**
 * Écran avec grand titre iOS 26 : le titre s'affiche en grand ; au défilement, le contenu s'efface
 * sous un bord flou et le titre passe en petit au centre. Les commandes de la barre (retour,
 * accessoire) flottent dans des boutons en verre.
 */
export function Page({ titre, retour, accessoire, zellige, children }: Props) {
  const z = useZellige()
  const repere = useRef<HTMLHeadingElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = repere.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="relative">
      {zellige && (
        <BandeZellige
          z={z}
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(env(safe-area-inset-top)+5.5rem)] !opacity-40 [mask-image:linear-gradient(#000_25%,transparent)]"
        />
      )}
      <header className={`bord-flou fixed inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)] ${compact ? 'visible' : ''}`}>
        <div className="mx-auto flex h-[3.25rem] max-w-xl items-center px-marge">
          <div className="flex min-w-0 flex-1">
            {retour && (
              <button
                type="button"
                onClick={retour.action}
                aria-label={`Retour : ${retour.libelle}`}
                className="verre verre-fin pressable flex h-11 w-11 items-center justify-center rounded-full"
              >
                <ChevronLeft className="h-6 w-6 -translate-x-px" strokeWidth={2.4} aria-hidden />
              </button>
            )}
          </div>
          <p
            className={`t-gras max-w-[55%] truncate text-center transition-opacity duration-200 ${compact ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={!compact}
          >
            {titre}
          </p>
          <div className="flex flex-1 justify-end">
            {compact && accessoire && <div className="verre verre-fin flex h-11 items-center rounded-full px-1">{accessoire}</div>}
          </div>
        </div>
      </header>
      <div className="relative mx-auto max-w-xl px-marge pt-[calc(env(safe-area-inset-top)+3.25rem)]">
        <div className="flex items-end justify-between gap-3 pb-2 pt-1">
          <h1 ref={repere} className="t-grand-titre">
            {titre}
          </h1>
          {accessoire && <div className="mb-1.5 rounded-full bg-carte">{accessoire}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
