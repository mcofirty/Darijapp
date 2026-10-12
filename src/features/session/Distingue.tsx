import { CircleCheck, CircleX, Snail, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import type { MotSon, PaireSons } from '../../data/pairesSons'
import { useProfil } from '../../db/useProfil'

interface Props {
  paire: PaireSons
  cible: MotSon
  onRepondu: (juste: boolean) => void
}

/** « Distingue les sons » : on entend un mot (9elb ou kelb ?) et on choisit lequel. */
export function Distingue({ paire, cible, onRepondu }: Props) {
  const { afficherArabe } = useProfil()
  const [choisi, setChoisi] = useState<string | null>(null)
  // Ordre d'affichage tiré une fois : la bonne réponse n'est pas toujours au même endroit.
  const choix = useMemo(() => (Math.random() < 0.5 ? [paire.a, paire.b] : [paire.b, paire.a]), [paire])
  const [sonA, sonB] = paire.sons

  useEffect(() => {
    jouer(cible.audio, cible.arabe)
  }, [cible])

  function choisir(m: MotSon) {
    if (choisi) return
    setChoisi(m.id)
    onRepondu(m.id === cible.id)
  }

  return (
    <div>
      <h2 className="t-titre-2">Quel mot entends-tu ?</h2>
      <p className="t-appel mb-6 mt-1 text-texte-2">
        Écoute bien : {sonA} ou {sonB === 'rien' ? 'sans ce son' : sonB} ?
      </p>
      <div className="mb-8 flex items-end justify-center gap-4">
        <button
          type="button"
          onClick={() => jouer(cible.audio, cible.arabe)}
          className="pressable flex h-24 w-24 items-center justify-center rounded-full bg-accent-plein text-white"
          aria-label="Réécouter"
        >
          <Volume2 className="h-10 w-10" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => jouer(cible.audio, cible.arabe, 0.75)}
          className="pressable flex h-14 w-14 items-center justify-center rounded-full bg-accent-doux text-accent"
          aria-label="Réécouter au ralenti"
        >
          <Snail className="h-6 w-6" strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {choix.map((m) => {
          const etat = !choisi ? 'neutre' : m.id === cible.id ? 'juste' : m.id === choisi ? 'faux' : 'eteint'
          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={choisi !== null}
                onClick={() => choisir(m)}
                className={`pressable relative flex min-h-32 w-full flex-col items-center justify-center rounded-liste px-3 py-4 text-center transition-colors ${
                  etat === 'juste'
                    ? 'bg-vert-doux text-vert'
                    : etat === 'faux'
                      ? 'bg-rouge-doux text-rouge'
                      : etat === 'eteint'
                        ? 'bg-carte opacity-50'
                        : 'bg-carte'
                }`}
              >
                <span className="t-titre-1">{m.latin}</span>
                {afficherArabe && (
                  <span className="arabe mt-1 text-[1.3rem] opacity-70" dir="rtl" lang="ar">
                    {m.arabe}
                  </span>
                )}
                {/* La traduction n'apparaît qu'après la réponse : avant, elle donnerait un indice sans écoute. */}
                <span className={`t-sous-titre mt-1 ${choisi ? 'opacity-80' : 'invisible'}`}>{m.fr}</span>
                {etat === 'juste' && (
                  <CircleCheck className="absolute right-3 top-3 h-5 w-5" strokeWidth={2.4} aria-label="Bonne réponse" />
                )}
                {etat === 'faux' && <CircleX className="absolute right-3 top-3 h-5 w-5" strokeWidth={2.4} aria-label="Mauvaise réponse" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
