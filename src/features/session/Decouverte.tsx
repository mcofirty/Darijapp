import { useEffect } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { BoutonAudio } from '../mots/BoutonAudio'

/** Présentation d'un nouveau mot avant de l'exercer. */
export function Decouverte({ mot }: { mot: Mot }) {
  const { afficherArabe } = useProfil()
  const sons = sonsDuMot(mot.latin)

  useEffect(() => {
    jouer(mot.audio, mot.arabe)
  }, [mot])

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">Nouveau mot</p>
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-stone-900">
        <p className="text-4xl font-bold">{mot.latin}</p>
        {afficherArabe && (
          <p className="arabe mt-2 text-4xl text-stone-600 dark:text-stone-300" dir="rtl" lang="ar">{mot.arabe}</p>
        )}
        <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">{mot.fr}</p>
        <div className="mt-5 flex gap-3">
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" grand />
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" grand />
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5 text-stone-700 shadow-sm dark:bg-stone-900 dark:text-stone-300">
        <p>{mot.prononciation}</p>
        {sons.map((s) => (
          <p key={s.latin} className="mt-2 text-sm">
            <span className="font-bold">{s.latin} ({s.arabe})</span> : {s.explication}
          </p>
        ))}
      </div>
    </div>
  )
}
