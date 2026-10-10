import { useState } from 'react'
import { motsDuTheme } from '../../data'
import { THEMES } from '../../data/themes'
import type { Mot } from '../../data/types'
import { FicheMot } from '../mots/FicheMot'
import { ListeMots } from '../mots/ListeMots'
import { GuideSons } from './GuideSons'

type Vue = { type: 'themes' } | { type: 'sons' } | { type: 'theme'; themeId: string }

export function Apprendre() {
  const [vue, setVue] = useState<Vue>({ type: 'themes' })
  const [mot, setMot] = useState<Mot | null>(null)

  if (mot) return <FicheMot mot={mot} onRetour={() => setMot(null)} />
  if (vue.type === 'sons') return <GuideSons onRetour={() => setVue({ type: 'themes' })} />

  if (vue.type === 'theme') {
    const theme = THEMES.find((t) => t.id === vue.themeId)!
    return (
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setVue({ type: 'themes' })}
          className="min-h-11 text-sm font-semibold text-orange-700 dark:text-orange-400"
        >
          ← Thèmes
        </button>
        <h2 className="text-2xl font-bold">
          {theme.icone} {theme.titre}
        </h2>
        <ListeMots mots={motsDuTheme(theme.id)} onChoisir={setMot} />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Apprendre</h2>
      <button
        type="button"
        onClick={() => setVue({ type: 'sons' })}
        className="flex w-full items-center gap-4 rounded-3xl bg-orange-600 p-4 text-left text-white shadow-sm active:scale-[0.98]"
      >
        <span className="text-3xl" aria-hidden>🗣️</span>
        <span>
          <span className="block font-semibold">Les sons du darija</span>
          <span className="text-sm text-orange-100">3, 7, 9, kh, gh, ch : comment les prononcer</span>
        </span>
      </button>
      <ul className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setVue({ type: 'theme', themeId: t.id })}
              className="flex h-full w-full flex-col items-start gap-2 rounded-3xl bg-white p-4 text-left shadow-sm active:scale-[0.98] dark:bg-stone-900"
            >
              <span className="text-3xl" aria-hidden>{t.icone}</span>
              <span className="font-semibold leading-tight">{t.titre}</span>
              <span className="text-sm text-stone-500">{motsDuTheme(t.id).length} mots</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
