import { CircleX, Search } from 'lucide-react'

/** Champ de recherche iOS 26 : capsule de verre qui reste en haut pendant le défilement. */
export function ChampRecherche({ valeur, onChange, placeholder = 'Rechercher' }: { valeur: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+3.25rem+0.25rem)] z-[5] mb-6">
      <label className="verre verre-fin verre-epais flex h-11 items-center gap-2 rounded-full pl-3.5 pr-1 text-texte-2">
        <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
        <input
          data-sans-balayage
          type="search"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="t-corps h-full min-w-0 flex-1 bg-transparent text-texte outline-none placeholder:text-texte-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {valeur && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Effacer la recherche"
            className="pressable flex h-9 w-9 shrink-0 items-center justify-center"
          >
            <CircleX className="h-[18px] w-[18px]" fill="currentColor" stroke="var(--carte)" strokeWidth={2} aria-hidden />
          </button>
        )}
      </label>
    </div>
  )
}
