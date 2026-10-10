import { MOTS } from '../../data'
import { SONS } from '../../data/sons'
import { BoutonAudio } from '../mots/BoutonAudio'

/** Mini-module « Les sons du darija » : un mot exemple par son difficile. */
export function GuideSons({ onRetour }: { onRetour: () => void }) {
  return (
    <section className="space-y-4">
      <button type="button" onClick={onRetour} className="min-h-11 text-sm font-semibold text-orange-700 dark:text-orange-400">
        ← Retour
      </button>
      <h2 className="text-2xl font-bold">Les sons du darija</h2>
      <p className="text-stone-600 dark:text-stone-400">
        En lettres latines, les Marocains écrivent avec des chiffres les sons qui n'existent pas en français.
      </p>
      <ul className="space-y-3">
        {SONS.map((s) => (
          <li key={s.latin} className="rounded-3xl bg-white p-4 shadow-sm dark:bg-stone-900">
            <div className="flex items-center gap-4">
              <span className="w-14 text-center text-3xl font-bold">
                {s.latin}
                <span className="arabe block text-2xl font-normal text-stone-500" lang="ar">{s.arabe}</span>
              </span>
              <p className="flex-1 text-sm text-stone-700 dark:text-stone-300">{s.explication}</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-orange-50 p-3 dark:bg-stone-800">
              <span>
                <span className="font-semibold">{s.exemple.latin}</span>{' '}
                <span className="arabe" lang="ar">{s.exemple.arabe}</span>
                <span className="block text-sm text-stone-500">{s.exemple.fr}</span>
              </span>
              <BoutonAudio
                chemin={MOTS.find((m) => m.latin === s.exemple.latin)?.audio ?? ''}
                arabe={s.exemple.arabe}
                libelle="Écouter"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
