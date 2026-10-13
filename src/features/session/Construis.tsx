import { Snail, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { jouer, jouerAuto } from '../../audio/lecteur'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { phraseJuste } from '../../exercices/phrases'
import { Bouton } from '../../ui/Boutons'

interface Props {
  mot: Mot
  morceaux: string[]
  onRepondu: (juste: boolean) => void
}

/** « Construis la phrase » : on entend l'exemple, on voit sa traduction et on remet ses mots dans l'ordre. */
export function Construis({ mot, morceaux, onRepondu }: Props) {
  const { afficherArabe } = useProfil()
  const ex = mot.exemple
  // Indices des morceaux choisis, dans l'ordre de la réponse.
  const [choisis, setChoisis] = useState<number[]>([])
  const [verdict, setVerdict] = useState<boolean | null>(null)

  useEffect(() => {
    jouerAuto(ex.audio, ex.arabe)
  }, [ex])

  function prendre(i: number) {
    if (verdict === null && !choisis.includes(i)) setChoisis([...choisis, i])
  }

  function rendre(i: number) {
    if (verdict === null) setChoisis(choisis.filter((c) => c !== i))
  }

  function verifier() {
    const juste = phraseJuste(
      choisis.map((i) => morceaux[i]),
      mot,
    )
    setVerdict(juste)
    onRepondu(juste)
  }

  const teinte = verdict === null ? 'bg-carte' : verdict ? 'bg-vert-doux text-vert' : 'bg-rouge-doux text-rouge'
  return (
    <div>
      <h2 className="t-titre-2 mb-6">Construis la phrase</h2>
      <div className="mb-6 flex items-center gap-3 rounded-liste bg-carte px-marge py-4">
        <button
          type="button"
          onClick={() => jouer(ex.audio, ex.arabe)}
          className="pressable flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-plein text-white"
          aria-label="Réécouter la phrase"
        >
          <Volume2 className="h-7 w-7" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => jouer(ex.audio, ex.arabe, 0.75)}
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent"
          aria-label="Réécouter au ralenti"
        >
          <Snail className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        </button>
        <p className="t-titre-3 min-w-0 flex-1">{ex.fr}</p>
      </div>

      {/* Réponse : les mots choisis, qu'un toucher renvoie dans la réserve. */}
      <div
        className="mb-6 flex min-h-[7.5rem] flex-wrap content-start gap-2 border-b border-separateur pb-4"
        aria-label="Ta phrase"
        aria-live="polite"
      >
        {choisis.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => rendre(i)}
            disabled={verdict !== null}
            className={`pressable t-gras min-h-11 rounded-reponse px-4 py-2 ${teinte}`}
          >
            {morceaux[i]}
          </button>
        ))}
      </div>
      {verdict !== null && afficherArabe && (
        <p className="arabe mb-4 text-center text-[1.5rem] leading-snug" dir="rtl" lang="ar">
          {ex.arabe}
        </p>
      )}

      {/* Réserve : un mot pris laisse sa place vide pour que les autres ne bougent pas. */}
      <div className="mb-6 flex flex-wrap justify-center gap-2" aria-label="Mots à placer">
        {morceaux.map((m, i) =>
          choisis.includes(i) ? (
            <span key={i} className="t-gras min-h-11 rounded-reponse bg-remplissage px-4 py-2 text-transparent" aria-hidden>
              {m}
            </span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => prendre(i)}
              disabled={verdict !== null}
              className="pressable t-gras min-h-11 rounded-reponse bg-carte px-4 py-2 shadow-[0_1px_0_var(--separateur)]"
            >
              {m}
            </button>
          ),
        )}
      </div>

      {verdict === null && (
        <Bouton grand className="w-full" disabled={choisis.length === 0} onClick={verifier}>
          Vérifier
        </Bouton>
      )}
    </div>
  )
}
