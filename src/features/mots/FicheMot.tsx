import { useEffect } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { BoutonAudio } from './BoutonAudio'

interface Props {
  mot: Mot
  onRetour: () => void
}

export function FicheMot({ mot, onRetour }: Props) {
  const { afficherArabe } = useProfil()
  const sons = sonsDuMot(mot.latin)

  // Lecture automatique à l'ouverture (l'ouverture vient d'un toucher, ce qu'exige iOS).
  useEffect(() => {
    window.scrollTo(0, 0)
    jouer(mot.audio, mot.arabe)
  }, [mot])

  return (
    <article className="space-y-4">
      <button type="button" onClick={onRetour} className="min-h-11 text-sm font-semibold text-orange-700 dark:text-orange-400">
        ← Retour
      </button>

      <div className="rounded-3xl p-6 text-center verre">
        <p className="text-4xl font-bold">{mot.latin}</p>
        {afficherArabe && (
          <p className="arabe mt-3 text-4xl text-stone-600 dark:text-stone-300" dir="rtl" lang="ar">
            {mot.arabe}
          </p>
        )}
        <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">{mot.fr}</p>
        <div className="mt-6 flex gap-3">
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" grand />
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" grand />
        </div>
      </div>

      <section className="rounded-3xl p-5 verre">
        <h3 className="font-semibold">Prononciation</h3>
        <p className="mt-2 text-stone-700 dark:text-stone-300">{mot.prononciation}</p>
        {sons.length > 0 && (
          <ul className="mt-4 space-y-2">
            {sons.map((s) => (
              <li key={s.latin} className="flex gap-3 rounded-2xl bg-orange-50 p-3 text-sm dark:bg-stone-800">
                <span className="w-12 shrink-0 text-center font-bold">
                  {s.latin}
                  <span className="arabe block text-lg font-normal" lang="ar">{s.arabe}</span>
                </span>
                <span className="text-stone-700 dark:text-stone-300">{s.explication}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl p-5 verre">
        <h3 className="font-semibold">Exemple</h3>
        <p className="mt-2 text-lg font-semibold">{mot.exemple.latin}</p>
        {afficherArabe && (
          <p className="arabe mt-1 text-xl text-stone-600 dark:text-stone-300" dir="rtl" lang="ar">
            {mot.exemple.arabe}
          </p>
        )}
        <p className="mt-1 text-stone-600 dark:text-stone-400">{mot.exemple.fr}</p>
        <div className="mt-3 flex gap-2">
          <BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} libelle="Écouter" />
          <BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} vitesse={0.75} libelle="Ralenti" />
        </div>
      </section>
    </article>
  )
}
