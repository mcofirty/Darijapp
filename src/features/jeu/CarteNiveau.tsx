import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight } from 'lucide-react'
import { db } from '../../db/db'
import { useResume } from '../../db/useResume'
import { acquisVerifies } from '../../gamification/collection'
import { Anneau } from '../../ui/Anneau'

/**
 * Carte de niveau compacte : un seul anneau (l'avancée dans le niveau), puis deux mesures bien distinctes.
 * L'activité (XP, jours pratiqués) dit l'effort ; les acquis vérifiés (mots retrouvés lors d'une révision
 * ultérieure, boîte 3 ou plus) disent ce qui est vraiment retenu. Rien n'est dit « maîtrisé » après une seule
 * bonne réponse.
 */
export function CarteNiveau({ onClick }: { onClick?: () => void }) {
  const { niveau, xpTotal } = useResume()
  const mesures = useLiveQuery(async () => {
    const [sessions, progressions] = await Promise.all([db.sessions.toArray(), db.progression.toArray()])
    return { jours: new Set(sessions.map((s) => s.date)).size, acquis: acquisVerifies(progressions) }
  }, [])
  const reste = niveau.objectif - niveau.xp
  const contenu = (
    <>
      <div className="flex items-center gap-4">
        <Anneau
          fraction={niveau.xp / niveau.objectif}
          taille={68}
          epaisseur={9}
          couleur="var(--energie-plein)"
          label={`Niveau ${niveau.niveau} : ${niveau.xp} XP sur ${niveau.objectif}`}
        >
          <span className="text-[10px] font-semibold uppercase text-texte-2">Niv.</span>
          <span className="t-titre-2 tabular-nums">{niveau.niveau}</span>
        </Anneau>
        <div className="min-w-0 flex-1">
          <p className="t-titre-3 truncate">{niveau.nom}</p>
          <p className="t-sous-titre text-texte-2">
            {reste > 0 ? (
              <>
                Encore <span className="font-semibold text-energie">{reste} XP</span> avant le niveau {niveau.niveau + 1}
              </>
            ) : (
              'Dernier niveau atteint'
            )}
          </p>
        </div>
        {onClick && <ChevronRight className="h-5 w-5 shrink-0 text-texte-3" strokeWidth={2.4} aria-hidden />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] bg-carte-2 px-3 py-2.5">
          <p className="t-legende font-semibold uppercase tracking-wide text-texte-2">Activité</p>
          <p className="t-gras mt-0.5 tabular-nums">{xpTotal} XP</p>
          <p className="t-note text-texte-2">
            {mesures?.jours ?? 0} jour{(mesures?.jours ?? 0) > 1 ? 's' : ''} pratiqué{(mesures?.jours ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-[14px] bg-vert-doux px-3 py-2.5">
          <p className="t-legende font-semibold uppercase tracking-wide text-vert">Acquis vérifiés</p>
          <p className="t-gras mt-0.5 tabular-nums">
            {mesures?.acquis ?? 0} expression{(mesures?.acquis ?? 0) > 1 ? 's' : ''}
          </p>
          <p className="t-note text-texte-2">retrouvée{(mesures?.acquis ?? 0) > 1 ? 's' : ''} en révision</p>
        </div>
      </div>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="ligne-pressable block w-full p-marge text-left">
      {contenu}
    </button>
  ) : (
    <div className="p-marge">{contenu}</div>
  )
}
