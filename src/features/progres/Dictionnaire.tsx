import { useState } from 'react'
import { chercherAvecProches } from '../../data'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { ChampRecherche } from '../../ui/ChampRecherche'
import { ResultatsAvecProches } from '../mots/ListeMots'

/** Champ de recherche et liste de tous les mots ; sous les résultats, les mots qui ressemblent à la recherche. */
export function Dictionnaire({ onChoisir }: { onChoisir: (mot: Mot) => void }) {
  const [requete, setRequete] = useState('')
  const { exacts, proches } = chercherAvecProches(useMots(), requete)
  return (
    <>
      <ChampRecherche valeur={requete} onChange={setRequete} />
      <ResultatsAvecProches exacts={exacts} proches={proches} onChoisir={onChoisir} />
    </>
  )
}
