import { useEffect, useMemo, useRef, useState } from 'react'
import { useMots } from '../db/motsPerso'
import { glossaire, motsTouchables } from '../exercices/glossaire'

/**
 * Une phrase en darija dont chaque mot connu est souligné en pointillés : le toucher montre sa traduction
 * dans une bulle (indice au toucher, façon Duolingo). `trou` remplace un mot par un trait.
 */
export function PhraseTouchable({ latin, className = '', trou, remplacement }: { latin: string; className?: string; trou?: number; remplacement?: React.ReactNode }) {
  const mots = useMots()
  const g = useMemo(() => glossaire(mots), [mots])
  const morceaux = motsTouchables(latin, g)
  const [ouvert, setOuvert] = useState<number | null>(null)
  const racine = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ouvert === null) return
    const fermer = (e: PointerEvent) => {
      if (!racine.current?.contains(e.target as Node)) setOuvert(null)
    }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [ouvert])

  return (
    <span ref={racine} className={className}>
      {morceaux.map((m, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {i === trou ? (
            (remplacement ?? <span className="inline-block min-w-[3.5em] border-b-2 border-[var(--texte-2)] align-baseline">&nbsp;</span>)
          ) : m.fr ? (
            <span className="relative inline-block">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOuvert(ouvert === i ? null : i)
                }}
                className="cursor-help underline decoration-[var(--texte-3)] decoration-dotted decoration-2 underline-offset-[5px]"
                aria-expanded={ouvert === i}
                aria-label={`${m.mot} : voir la traduction`}
              >
                {m.mot}
              </button>
              {ouvert === i && (
                <span
                  role="tooltip"
                  className="t-sous-titre absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[14rem] -translate-x-1/2 rounded-xl bg-[var(--texte)] px-3 py-1.5 text-center font-normal text-[var(--fond)] shadow-lg"
                >
                  {m.fr}
                </span>
              )}
            </span>
          ) : (
            m.mot
          )}
        </span>
      ))}
    </span>
  )
}
