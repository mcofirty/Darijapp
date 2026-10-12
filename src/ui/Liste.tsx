import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Section de liste groupée (style Réglages) : en-tête, cellules arrondies, note de bas. */
export function Section({ titre, note, children }: { titre?: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {titre && <h2 className="t-note mb-1.5 px-4 uppercase text-texte-2">{titre}</h2>}
      <div className="liste overflow-hidden rounded-liste bg-carte">
        {children}
      </div>
      {note && <p className="t-note mt-1.5 px-4 text-texte-2">{note}</p>}
    </section>
  )
}

/** Petite icône blanche sur fond de couleur, comme dans Réglages. */
export function Tuile({ icone: Icone, couleur, texte }: { icone?: LucideIcon; couleur: string; texte?: string }) {
  return (
    <span
      className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-tuile text-white"
      style={{ background: couleur }}
      aria-hidden
    >
      {Icone ? <Icone className="h-[18px] w-[18px]" strokeWidth={2.2} /> : <span className="t-appel font-bold">{texte}</span>}
    </span>
  )
}

interface LigneProps {
  titre: ReactNode
  sousTitre?: ReactNode
  tuile?: ReactNode
  valeur?: ReactNode
  /** Contenu interactif à droite (bouton lecture, interrupteur…), hors de la zone cliquable. */
  fin?: ReactNode
  chevron?: boolean
  onClick?: () => void
}

/** Cellule de liste : 44 pt minimum, retrait du séparateur aligné sur le texte. */
export function Ligne({ titre, sousTitre, tuile, valeur, fin, chevron, onClick }: LigneProps) {
  const contenu = (
    <>
      {tuile}
      <span className="min-w-0 flex-1 py-2.5">
        <span className="t-corps block">{titre}</span>
        {sousTitre && <span className="t-sous-titre mt-0.5 block text-texte-2">{sousTitre}</span>}
      </span>
      {valeur && <span className="t-corps shrink-0 text-texte-2">{valeur}</span>}
      {chevron && <ChevronRight className="h-5 w-5 shrink-0 text-texte-3" strokeWidth={2.4} aria-hidden />}
    </>
  )
  const style = { '--retrait': tuile ? '3.75rem' : '1rem' } as React.CSSProperties
  return (
    <div className="flex min-h-11 items-center" style={style}>
      {onClick ? (
        <button type="button" onClick={onClick} className="ligne-pressable flex min-h-11 min-w-0 flex-1 items-center gap-3 pl-4 pr-3 text-left">
          {contenu}
        </button>
      ) : (
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-3 pl-4 pr-3">{contenu}</div>
      )}
      {fin && <div className="shrink-0 pr-3">{fin}</div>}
    </div>
  )
}
