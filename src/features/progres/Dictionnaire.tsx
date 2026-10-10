import { useState } from 'react'
import { MOTS, chercherMots } from '../../data'
import type { Mot } from '../../data/types'
import { FicheMot } from '../mots/FicheMot'
import { ListeMots } from '../mots/ListeMots'

export function Dictionnaire() {
  const [requete, setRequete] = useState('')
  const [mot, setMot] = useState<Mot | null>(null)

  if (mot) return <FicheMot mot={mot} onRetour={() => setMot(null)} />

  const resultats = chercherMots(MOTS, requete)
  return (
    <section className="space-y-4">
      <input
        type="search"
        value={requete}
        onChange={(e) => setRequete(e.target.value)}
        placeholder="Chercher un mot"
        className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base dark:border-stone-700 dark:bg-stone-900"
      />
      <p className="text-sm text-stone-500">
        {resultats.length} mot{resultats.length > 1 ? 's' : ''}
      </p>
      <ListeMots mots={resultats} onChoisir={setMot} />
    </section>
  )
}
