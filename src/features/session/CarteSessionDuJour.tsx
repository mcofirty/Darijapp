import { useLiveQuery } from 'dexie-react-hooks'
import { CircleCheck, Clock } from 'lucide-react'
import { planDeSession } from '../../db/apprentissage'
import { useResume } from '../../db/useResume'
import { dureeEstimee, situationDuPlan } from '../../exercices/situation'
import { OBJECTIF_MOTS } from '../../gamification/collection'
import { Anneau } from '../../ui/Anneau'
import { Bouton } from '../../ui/Boutons'
import { MotifEtoiles } from '../../ui/motif'

/** Mots repris en entraînement libre, quand rien n'est nouveau ni dû (voir lancer.ts). */
const MOTS_ENTRAINEMENT = 8

/**
 * Carte phare d'Apprendre : la session du jour, présentée par ce qu'elle permet de faire
 * (« Aujourd'hui, commande ton premier thé »), le nombre de mots et la durée en second.
 * Toujours accessible et sans limite.
 */
export function CarteSessionDuJour({ onCommencer }: { onCommencer: () => void }) {
  const { sessionsAujourdhui, motsVus, xpAujourdhui } = useResume()
  const plan = useLiveQuery(() => planDeSession(), [sessionsAujourdhui])
  const faite = sessionsAujourdhui > 0

  const situation = plan ? situationDuPlan(plan) : null
  const nouveaux = plan?.nouveaux.length ?? 0
  const revisions = plan?.revisions.length ?? 0
  const expressions = situation ? nouveaux + revisions : MOTS_ENTRAINEMENT
  const detail = [
    nouveaux > 0 && `${nouveaux} nouvelle${nouveaux > 1 ? 's' : ''}`,
    revisions > 0 && `${revisions} à revoir`,
  ].filter(Boolean)

  return (
    <section className="carte-phare relative mb-[26px] overflow-hidden rounded-carte p-marge text-white">
      <MotifEtoiles className="pointer-events-none absolute -right-8 -top-6 h-44 w-44 text-white opacity-20" />
      <div className="relative flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="t-note font-semibold uppercase tracking-wide text-white/85">
            {faite ? `Aujourd'hui · +${xpAujourdhui} XP` : 'Session du jour'}
          </p>
          {faite ? (
            <h2 className="t-titre-2 mt-1 flex items-center gap-2">
              <CircleCheck className="h-7 w-7 shrink-0" strokeWidth={2.5} aria-hidden />
              Série sécurisée
            </h2>
          ) : (
            <h2 className="t-titre-2 mt-1 text-balance">
              {situation ? (
                <>
                  Aujourd’hui, {situation.texte} <span aria-hidden>{situation.emoji}</span>
                </>
              ) : (
                'Entraîne-toi sur les mots déjà vus'
              )}
            </h2>
          )}
          {faite && situation && (
            <p className="t-appel mt-1 text-white/90">
              Ensuite : {situation.texte} <span aria-hidden>{situation.emoji}</span>
            </p>
          )}
        </div>
        <Anneau
          fraction={motsVus.size / OBJECTIF_MOTS}
          taille={58}
          epaisseur={9}
          couleur="#ffffff"
          piste="rgba(255, 255, 255, 0.28)"
          label={`${motsVus.size} mots vus sur l'objectif de ${OBJECTIF_MOTS}`}
        >
          <span className="t-gras tabular-nums">{motsVus.size}</span>
          <span className="mt-0.5 text-[9px] font-semibold text-white/85">/{OBJECTIF_MOTS}</span>
        </Anneau>
      </div>
      <p className="t-sous-titre relative mt-3 flex flex-wrap items-center gap-x-1.5 text-white/90">
        <span className="font-semibold text-white">
          {expressions} expression{expressions > 1 ? 's' : ''}
        </span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          environ {dureeEstimee(situation ? nouveaux : 0, situation ? revisions : MOTS_ENTRAINEMENT)} min
        </span>
        {detail.length > 1 && <span className="text-white/80">({detail.join(', ')})</span>}
      </p>
      <Bouton grand className="relative mt-4 w-full !bg-white !text-accent-plein shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)]" onClick={onCommencer}>
        {faite ? 'Encore une session' : 'C’est parti !'}
      </Bouton>
    </section>
  )
}
