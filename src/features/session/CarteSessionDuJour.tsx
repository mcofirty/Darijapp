import { useLiveQuery } from 'dexie-react-hooks'
import { CircleCheck } from 'lucide-react'
import { planDeSession } from '../../db/apprentissage'
import { useMots } from '../../db/motsPerso'
import { useResume } from '../../db/useResume'
import { Bouton } from '../../ui/Boutons'

/** Carte d'accueil : la session du jour, toujours accessible et sans limite. */
export function CarteSessionDuJour({ onCommencer }: { onCommencer: () => void }) {
  const { sessionsAujourdhui, motsVus, xpAujourdhui } = useResume()
  const MOTS = useMots()
  const plan = useLiveQuery(() => planDeSession(), [sessionsAujourdhui])
  const faite = sessionsAujourdhui > 0

  const contenu = plan
    ? [
        plan.nouveaux.length > 0 && `${plan.nouveaux.length} nouveaux mots`,
        plan.revisions.length > 0 && `${plan.revisions.length} à réviser`,
      ].filter(Boolean)
    : []

  return (
    <section className="mb-8 rounded-[10px] bg-carte p-4">
      <p className="t-note font-semibold uppercase text-accent">{faite ? `Aujourd'hui · +${xpAujourdhui} XP` : 'Session du jour'}</p>
      <h2 className="t-titre-2 mt-1 flex items-center gap-2">
        {faite && <CircleCheck className="h-6 w-6 text-vert" strokeWidth={2.5} aria-hidden />}
        {faite ? 'Série sécurisée' : 'Prêt pour ta session ?'}
      </h2>
      <p className="t-sous-titre mt-1 text-texte-2">
        {contenu.length > 0 ? contenu.join(' · ') : 'Entraînement libre sur les mots déjà vus'} · {motsVus.size}/{MOTS.length} mots vus
      </p>
      <Bouton grand className="mt-4 w-full" onClick={onCommencer}>
        {faite ? 'Encore une session' : 'Commencer'}
      </Bouton>
    </section>
  )
}
