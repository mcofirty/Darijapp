import type { BilanSession } from '../../db/apprentissage'
import { useResume } from '../../db/useResume'

interface Props {
  bilan: BilanSession
  taux: number
  onFermer: () => void
  onEncore: () => void
}

const COULEURS = ['#ea580c', '#f59e0b', '#16a34a', '#0ea5e9', '#e11d48']

/** Écran de fin de session, avec confettis. */
export function Bilan({ bilan, taux, onFermer, onEncore }: Props) {
  const { serie } = useResume()
  return (
    <div data-sans-balayage className="fond fixed inset-0 z-30 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${(i * 37) % 100}%`,
              background: COULEURS[i % COULEURS.length],
              animationDelay: `${(i % 9) * 0.12}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex h-full max-w-xl flex-col justify-center gap-6 px-6 pb-[env(safe-area-inset-bottom)] text-center">
        <p className="text-6xl" aria-hidden>🎉</p>
        <h2 className="text-3xl font-bold">Session terminée !</h2>
        <div className="grid grid-cols-3 gap-3">
          <Case valeur={`+${bilan.xp}`} libelle="XP" />
          <Case valeur={`${Math.round(taux * 100)} %`} libelle="Réussite" />
          <Case valeur={`🔥 ${serie.jours}`} libelle={serie.jours > 1 ? 'jours de suite' : 'jour'} />
        </div>
        {bilan.nouveaux > 0 && (
          <p className="text-stone-600 dark:text-stone-400">
            {bilan.nouveaux} nouveau{bilan.nouveaux > 1 ? 'x' : ''} mot{bilan.nouveaux > 1 ? 's' : ''} appris
          </p>
        )}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onEncore}
            className="verre-teinte verre-interactif min-h-14 w-full rounded-2xl text-lg font-bold"
          >
            Encore une session
          </button>
          <button type="button" onClick={onFermer} className="min-h-12 w-full font-semibold text-stone-600 dark:text-stone-300">
            Terminer
          </button>
        </div>
      </div>
    </div>
  )
}

function Case({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="rounded-2xl p-3 verre">
      <p className="text-2xl font-bold">{valeur}</p>
      <p className="text-xs text-stone-500">{libelle}</p>
    </div>
  )
}
