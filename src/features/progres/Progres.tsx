import { useState } from 'react'
import { Dictionnaire } from './Dictionnaire'

export function Progres() {
  const [vue, setVue] = useState<'tableau' | 'dictionnaire'>('tableau')

  return (
    <section className="space-y-4">
      <div className="verre flex rounded-2xl p-1">
        {(['tableau', 'dictionnaire'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVue(v)}
            className={`min-h-10 flex-1 rounded-xl text-sm font-semibold ${
              vue === v ? 'verre-teinte' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {v === 'tableau' ? 'Tableau de bord' : 'Dictionnaire'}
          </button>
        ))}
      </div>
      {vue === 'dictionnaire' ? (
        <Dictionnaire />
      ) : (
        <p className="rounded-3xl p-6 text-center text-stone-500 verre">
          Le tableau de bord (XP, quêtes, série, statistiques) arrive au jalon 4.
        </p>
      )}
    </section>
  )
}
