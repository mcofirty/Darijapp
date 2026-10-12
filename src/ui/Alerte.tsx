import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ActionAlerte {
  libelle: string
  /** « annuler » : bouton gris qui reçoit le focus ; « destructif » : texte rouge. */
  role?: 'annuler' | 'destructif'
  action: () => void
}

interface Props {
  titre: string
  message?: string
  actions: ActionAlerte[]
  /** Échap ou toucher le voile. */
  onAnnuler: () => void
}

const STYLES = {
  annuler: 'bg-remplissage text-texte',
  destructif: 'bg-remplissage text-rouge',
  defaut: 'bg-accent-plein text-white',
}

/** Alerte iOS 26 en Liquid Glass : titre, message et boutons en capsules, sur un voile assombri. */
export function Alerte({ titre, message, actions, onAnnuler }: Props) {
  const annuler = useRef(onAnnuler)
  annuler.current = onAnnuler
  const focus = useRef<HTMLButtonElement>(null)
  const indexFocus = Math.max(actions.findIndex((a) => a.role === 'annuler'), 0)

  useEffect(() => {
    focus.current?.focus()
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') annuler.current()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  return createPortal(
    <div data-sans-balayage className="fixed inset-0 z-50 flex items-center justify-center px-8">
      <div aria-hidden className="voile-entree absolute inset-0 bg-[var(--voile)]" onClick={() => annuler.current()} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alerte-titre"
        aria-describedby={message ? 'alerte-message' : undefined}
        className="verre verre-fin verre-epais alerte-entree w-full max-w-[19rem] rounded-alerte p-4 pt-5 text-center"
      >
        <h2 id="alerte-titre" className="t-gras px-2">
          {titre}
        </h2>
        {message && (
          <p id="alerte-message" className="t-sous-titre mt-1 px-2 text-texte-2">
            {message}
          </p>
        )}
        <div className={`mt-4 flex gap-2 ${actions.length === 2 ? 'flex-row' : 'flex-col'}`}>
          {actions.map((a, i) => (
            <button
              key={a.libelle}
              ref={i === indexFocus ? focus : undefined}
              type="button"
              onClick={a.action}
              className={`pressable t-gras min-h-11 flex-1 rounded-full px-3 ${STYLES[a.role ?? 'defaut']}`}
            >
              {a.libelle}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
