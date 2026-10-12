import { useMemo, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import type { Mot } from '../../data/types'
import { melanger } from '../../exercices/session'

interface Props {
  mots: Mot[]
  onErreur: (motId: string) => void
  onTermine: () => void
}

/** « Associe les paires » : relier chaque mot darija à sa traduction. */
export function Paires({ mots, onErreur, onTermine }: Props) {
  const gauche = useMemo(() => melanger(mots), [mots])
  const droite = useMemo(() => melanger(mots), [mots])
  const [trouves, setTrouves] = useState<Set<string>>(new Set())
  const [selection, setSelection] = useState<string | null>(null)
  const [rate, setRate] = useState<string | null>(null)

  function toucherGauche(m: Mot) {
    setSelection(m.id)
    jouer(m.audio, m.arabe)
  }

  function toucherDroite(m: Mot) {
    if (!selection) return
    if (m.id === selection) {
      const nouveaux = new Set(trouves).add(m.id)
      setTrouves(nouveaux)
      setSelection(null)
      sonReponse(true)
      if (nouveaux.size === mots.length) onTermine()
    } else {
      onErreur(selection)
      sonReponse(false)
      setRate(m.id)
      setTimeout(() => setRate(null), 400)
    }
  }

  const style = (id: string, actif: boolean) =>
    trouves.has(id)
      ? 'verre-vert scale-95 opacity-40'
      : rate === id
        ? 'verre-rouge'
        : actif
          ? 'verre ring-2 ring-orange-500'
          : 'verre'

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Associe les paires</h2>
      <div className="grid grid-cols-2 gap-3">
        <ul className="space-y-3">
          {gauche.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={trouves.has(m.id)}
                onClick={() => toucherGauche(m)}
                className={`verre-interactif min-h-14 w-full rounded-2xl px-3 py-2 font-semibold ${style(m.id, selection === m.id)}`}
              >
                {m.latin}
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {droite.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={trouves.has(m.id)}
                onClick={() => toucherDroite(m)}
                className={`verre-interactif min-h-14 w-full rounded-2xl px-3 py-2 text-sm font-semibold ${style(m.id, false)}`}
              >
                {m.fr}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
