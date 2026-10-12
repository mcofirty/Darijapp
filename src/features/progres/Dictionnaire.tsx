import { CircleX, Search } from 'lucide-react'
import { useState } from 'react'
import { chercherMots } from '../../data'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { ListeMots } from '../mots/ListeMots'

/** Champ de recherche et liste de tous les mots. */
export function Dictionnaire({ onChoisir }: { onChoisir: (mot: Mot) => void }) {
  const [requete, setRequete] = useState('')
  const resultats = chercherMots(useMots(), requete)
  return (
    <>
      {/* Champ de recherche iOS 26 : capsule de verre qui reste en haut pendant le défilement. */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+3.25rem+0.25rem)] z-[5] mb-6">
        <label className="verre verre-fin verre-epais flex h-11 items-center gap-2 rounded-full pl-3.5 pr-1 text-texte-2">
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
          <input
            data-sans-balayage
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Rechercher"
            className="t-corps h-full min-w-0 flex-1 bg-transparent text-texte outline-none placeholder:text-texte-2 [&::-webkit-search-cancel-button]:hidden"
          />
          {requete && (
            <button
              type="button"
              onClick={() => setRequete('')}
              aria-label="Effacer la recherche"
              className="pressable flex h-9 w-9 shrink-0 items-center justify-center"
            >
              <CircleX className="h-[18px] w-[18px]" fill="currentColor" stroke="var(--carte)" strokeWidth={2} aria-hidden />
            </button>
          )}
        </label>
      </div>
      <ListeMots mots={resultats} onChoisir={onChoisir} titre={`${resultats.length} mot${resultats.length > 1 ? 's' : ''}`} />
    </>
  )
}
