import { ONGLETS, type Onglet } from './onglets'

interface Props {
  actif: Onglet
  onChange: (onglet: Onglet) => void
}

export function BarreOnglets({ actif, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-orange-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
      <ul className="mx-auto flex max-w-xl">
        {ONGLETS.map((o) => (
          <li key={o.id} className="flex-1">
            <button
              type="button"
              onClick={() => onChange(o.id)}
              aria-current={o.id === actif ? 'page' : undefined}
              className={`flex w-full flex-col items-center gap-0.5 py-2 text-xs ${
                o.id === actif ? 'font-semibold text-orange-700 dark:text-orange-400' : 'text-stone-500'
              }`}
            >
              <span className="text-xl" aria-hidden>{o.icone}</span>
              {o.libelle}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
