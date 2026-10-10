/** En-tête commun : niveau, barre d'XP et série (valeurs fixes en attendant le jalon 4). */
export function EnTete() {
  const xp = 0
  const xpNiveau = 120
  return (
    <header className="sticky top-0 z-10 border-b border-orange-200 bg-orange-50/95 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="flex items-center gap-3 text-sm font-semibold">
        <span>Niveau 1</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-orange-200 dark:bg-stone-800" aria-label={`${xp} XP sur ${xpNiveau}`}>
          <div className="h-full bg-orange-600" style={{ width: `${(xp / xpNiveau) * 100}%` }} />
        </div>
        <span className="tabular-nums">{xp}/{xpNiveau} XP</span>
        <span aria-label="Série en cours">🔥 0</span>
      </div>
    </header>
  )
}
