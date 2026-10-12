import type { ButtonHTMLAttributes, ReactNode } from 'react'

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

/** Contrôle segmenté iOS. */
export function Segmente<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { id: T; libelle: string }[]
  valeur: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex rounded-[9px] bg-remplissage p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={valeur === o.id}
          onClick={() => onChange(o.id)}
          className={`t-sous-titre min-h-8 flex-1 rounded-[7px] font-semibold transition-colors ${
            valeur === o.id ? 'bg-carte shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] dark:bg-[#636366]' : ''
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}

/** Interrupteur iOS (51 × 31 pt). */
export function Interrupteur({ actif, onChange, libelle }: { actif: boolean; onChange: (v: boolean) => void; libelle: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={() => onChange(!actif)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${actif ? 'bg-vert-vif' : 'bg-remplissage'}`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-transform duration-200 ${
          actif ? 'translate-x-5' : ''
        }`}
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
