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
            className="verre-teinte verre-interactif flex h-24 w-24 items-center justify-center rounded-3xl text-4xl"
            aria-label="Réécouter"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={() => jouer(mot.audio, mot.arabe, 0.75)}
            className="verre verre-interactif flex h-24 w-16 items-center justify-center self-end rounded-3xl text-2xl"
            aria-label="Réécouter au ralenti"
          >
            🐢
          </button>
        </div>
      ) : (
        <p className="rounded-3xl p-6 text-center text-2xl font-semibold verre">{mot.fr}</p>
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
                className={`verre-interactif w-full rounded-2xl px-4 py-3.5 text-left text-lg font-semibold ${
                  etat === 'juste'
                    ? 'verre-vert text-green-800 dark:text-green-300'
                    : etat === 'faux'
                      ? 'verre-rouge text-red-700 dark:text-red-300'
                      : 'verre'
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
