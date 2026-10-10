import { useState } from 'react'
import { Dictionnaire } from './Dictionnaire'

export function Progres() {
  const [vue, setVue] = useState<'tableau' | 'dictionnaire'>('tableau')

  return (
    <section className="space-y-4">
      <div className="flex rounded-2xl bg-orange-100 p-1 dark:bg-stone-800">
        {(['tableau', 'dictionnaire'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVue(v)}
            className={`min-h-10 flex-1 rounded-xl text-sm font-semibold ${
              vue === v ? 'bg-white shadow-sm dark:bg-stone-900' : 'text-stone-500'
            }`}
          >
            {v === 'tableau' ? 'Tableau de bord' : 'Dictionnaire'}
          </button>
        ))}
      </div>
      {vue === 'dictionnaire' ? (
        <Dictionnaire />
      ) : (
        <p className="rounded-3xl bg-white p-6 text-center text-stone-500 shadow-sm dark:bg-stone-900">
          Le tableau de bord (XP, quêtes, série, statistiques) arrive au jalon 4.
        </p>
      )}
    </section>
  )
}
