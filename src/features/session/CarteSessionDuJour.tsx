import { useLiveQuery } from 'dexie-react-hooks'
import { MOTS } from '../../data'
import { planDeSession } from '../../db/apprentissage'
import { useResume } from '../../db/useResume'

/** Carte d'accueil : la session du jour, toujours accessible et sans limite. */
export function CarteSessionDuJour({ onCommencer }: { onCommencer: () => void }) {
  const { serie, sessionsAujourdhui, motsVus, xpAujourdhui } = useResume()
  const plan = useLiveQuery(() => planDeSession(), [sessionsAujourdhui])
  const faite = sessionsAujourdhui > 0

  const resume = plan
    ? [
        plan.nouveaux.length > 0 && `${plan.nouveaux.length} nouveaux mots`,
        plan.revisions.length > 0 && `${plan.revisions.length} à réviser`,
      ].filter(Boolean)
    : []

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 p-5 text-white shadow-md">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-100">
        {faite ? `Bravo · +${xpAujourdhui} XP aujourd'hui` : 'Session du jour'}
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        {faite ? '✓ Série sécurisée pour aujourd’hui' : serie.jours > 0 ? `🔥 ${serie.jours} jour${serie.jours > 1 ? 's' : ''} de suite` : 'C’est parti !'}
      </h2>
      <p className="mt-2 text-orange-50">
        {resume.length > 0 ? resume.join(' · ') : 'Entraînement libre sur les mots déjà vus'}
        {' · '}
        {motsVus.size}/{MOTS.length} mots vus
      </p>
      <button
        type="button"
        onClick={onCommencer}
        className="mt-4 min-h-14 w-full rounded-2xl border-b-4 border-orange-200 bg-white text-lg font-bold text-orange-700 active:translate-y-0.5"
      >
        {faite ? 'Encore une session' : 'Commencer'}
      </button>
    </section>
  )
}
