import { useState } from 'react'
import { chercherMots } from '../../data'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { ChampRecherche } from '../../ui/ChampRecherche'
import { ListeMots } from '../mots/ListeMots'

/** Champ de recherche et liste de tous les mots. */
export function Dictionnaire({ onChoisir }: { onChoisir: (mot: Mot) => void }) {
  const [requete, setRequete] = useState('')
  const resultats = chercherMots(useMots(), requete)
  return (
    <>
      <ChampRecherche valeur={requete} onChange={setRequete} />
      <ListeMots mots={resultats} onChoisir={onChoisir} titre={`${resultats.length} mot${resultats.length > 1 ? 's' : ''}`} />
    </>
  )
}
