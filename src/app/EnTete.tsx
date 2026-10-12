import { useResume } from '../db/useResume'

/** En-tête commun : niveau, barre d'XP et série. */
export function EnTete() {
  const { niveau, serie } = useResume()
  return (
    <header className="sticky top-0 z-10 border-b border-orange-200 bg-orange-50/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-xl items-center gap-3 text-sm font-semibold">
        <span title={`Niveau ${niveau.niveau}`}>
          Niv. {niveau.niveau} · {niveau.nom}
        </span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-orange-200 dark:bg-stone-800"
          aria-label={`${niveau.xp} XP sur ${niveau.objectif}`}
        >
          <div className="h-full bg-orange-600 transition-[width] duration-700" style={{ width: `${(niveau.xp / niveau.objectif) * 100}%` }} />
        </div>
        <span className="tabular-nums">
          {niveau.xp}/{niveau.objectif}
        </span>
        <span aria-label={`Série : ${serie.jours} jours`} className={serie.aujourdhui ? '' : 'opacity-50'}>
          🔥 {serie.jours}
        </span>
      </div>
    </header>
  )
}
