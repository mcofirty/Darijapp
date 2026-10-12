import { CircleCheck, CircleX, Snail, Volume2 } from 'lucide-react'
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
    if (type === 'ecoute') jouer(mot.audio, mot.arabe)
  }, [mot, type])

  function choisir(c: Mot) {
    if (choisi) return
    setChoisi(c.id)
    onRepondu(c.id === mot.id)
  }

  return (
    <div>
      <h2 className="t-titre-2 mb-6">{type === 'ecoute' ? 'Écoute et choisis la traduction' : 'Comment dit-on en darija ?'}</h2>
      {type === 'ecoute' ? (
        <div className="mb-8 flex items-end justify-center gap-4">
          <button
            type="button"
            onClick={() => jouer(mot.audio, mot.arabe)}
            className="pressable flex h-24 w-24 items-center justify-center rounded-full bg-accent-plein text-white"
            aria-label="Réécouter"
          >
            <Volume2 className="h-10 w-10" strokeWidth={2.2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => jouer(mot.audio, mot.arabe, 0.75)}
            className="pressable flex h-14 w-14 items-center justify-center rounded-full bg-accent-doux text-accent"
            aria-label="Réécouter au ralenti"
          >
            <Snail className="h-6 w-6" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      ) : (
        <p className="t-titre-1 mb-8 rounded-[10px] bg-carte px-4 py-6 text-center">{mot.fr}</p>
      )}
      <ul className="space-y-3">
        {choix.map((c) => {
          const etat = !choisi ? 'neutre' : c.id === mot.id ? 'juste' : c.id === choisi ? 'faux' : 'eteint'
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={choisi !== null}
                onClick={() => choisir(c)}
                className={`pressable flex min-h-14 w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-colors ${
                  etat === 'juste'
                    ? 'bg-vert-doux text-vert'
                    : etat === 'faux'
                      ? 'bg-rouge-doux text-rouge'
                      : etat === 'eteint'
                        ? 'bg-carte opacity-50'
                        : 'bg-carte'
                }`}
              >
                <span className="t-gras min-w-0 flex-1">
                  {type === 'ecoute' ? (
                    c.fr
                  ) : (
                    <span className="flex items-baseline justify-between gap-3">
                      <span>{c.latin}</span>
                      {afficherArabe && (
                        <span className="arabe text-[1.15rem] font-normal opacity-70" dir="rtl" lang="ar">
                          {c.arabe}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                {etat === 'juste' && <CircleCheck className="h-6 w-6 shrink-0" strokeWidth={2.4} aria-label="Bonne réponse" />}
                {etat === 'faux' && <CircleX className="h-6 w-6 shrink-0" strokeWidth={2.4} aria-label="Mauvaise réponse" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
