import { useEffect, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'

interface Props {
  type: 'ecoute' | 'traduis'
  mot: Mot
  choix: Mot[]
  onRepondu: (juste: boolean) => void
}

/** « Écoute et choisis » (audio → français) ou « Traduis » (français → darija). */
export function Choix({ type, mot, choix, onRepondu }: Props) {
  const { afficherArabe } = useProfil()
  const [choisi, setChoisi] = useState<string | null>(null)

  useEffect(() => {
    setChoisi(null)
    if (type === 'ecoute') jouer(mot.audio, mot.arabe)
  }, [mot, type, choix])

  function choisir(c: Mot) {
    if (choisi) return
    setChoisi(c.id)
    onRepondu(c.id === mot.id)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{type === 'ecoute' ? 'Écoute et choisis la traduction' : 'Comment dit-on en darija ?'}</h2>
      {type === 'ecoute' ? (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => jouer(mot.audio, mot.arabe)}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-600 text-4xl text-white shadow-md active:scale-95"
            aria-label="Réécouter"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={() => jouer(mot.audio, mot.arabe, 0.75)}
            className="flex h-24 w-16 items-center justify-center self-end rounded-3xl bg-orange-100 text-2xl shadow-sm active:scale-95 dark:bg-stone-800"
            aria-label="Réécouter au ralenti"
          >
            🐢
          </button>
        </div>
      ) : (
        <p className="rounded-3xl bg-white p-6 text-center text-2xl font-semibold shadow-sm dark:bg-stone-900">{mot.fr}</p>
      )}
      <ul className="grid gap-3">
        {choix.map((c) => {
          const etat = !choisi ? 'neutre' : c.id === mot.id ? 'juste' : c.id === choisi ? 'faux' : 'neutre'
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={choisi !== null}
                onClick={() => choisir(c)}
                className={`w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-lg font-semibold active:translate-y-0.5 ${
                  etat === 'juste'
                    ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
                    : etat === 'faux'
                      ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
                }`}
              >
                {type === 'ecoute' ? (
                  c.fr
                ) : (
                  <span className="flex items-baseline justify-between gap-3">
                    <span>{c.latin}</span>
                    {afficherArabe && <span className="arabe text-xl font-normal text-stone-500" dir="rtl" lang="ar">{c.arabe}</span>}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
