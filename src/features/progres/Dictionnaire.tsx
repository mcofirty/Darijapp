import { Search } from 'lucide-react'
import { useState } from 'react'
import { MOTS, chercherMots } from '../../data'
import type { Mot } from '../../data/types'
import { ListeMots } from '../mots/ListeMots'

/** Champ de recherche et liste de tous les mots. */
export function Dictionnaire({ onChoisir }: { onChoisir: (mot: Mot) => void }) {
  const [requete, setRequete] = useState('')
  const resultats = chercherMots(MOTS, requete)
  return (
    <>
      <label className="mb-6 flex h-9 items-center gap-1.5 rounded-[10px] bg-remplissage px-2 text-texte-2">
        <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
        <input
          data-sans-balayage
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Rechercher"
          className="t-corps h-full min-w-0 flex-1 bg-transparent text-texte outline-none placeholder:text-texte-2"
        />
      </label>
      <ListeMots mots={resultats} onChoisir={onChoisir} titre={`${resultats.length} mot${resultats.length > 1 ? 's' : ''}`} />
    </>
  )
}
