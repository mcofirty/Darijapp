import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { BoutonAudio } from './BoutonAudio'

interface Props {
  mots: Mot[]
  onChoisir: (mot: Mot) => void
}

export function ListeMots({ mots, onChoisir }: Props) {
  const { afficherArabe } = useProfil()
  const { motsVus } = useResume()
  return (
    <ul className="space-y-2">
      {mots.map((m) => (
        <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-sm dark:bg-stone-900">
          <button type="button" onClick={() => onChoisir(m)} className="min-h-12 flex-1 text-left">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                {m.latin}
                {motsVus.has(m.id) && (
                  <span className="ml-2 text-xs font-bold text-green-600" aria-label="déjà vu">
                    ✓
                  </span>
                )}
              </span>
              {afficherArabe && (
                <span className="arabe text-lg text-stone-500" dir="rtl" lang="ar">{m.arabe}</span>
              )}
            </span>
            <span className="block text-sm text-stone-500">{m.fr}</span>
          </button>
          <BoutonAudio chemin={m.audio} arabe={m.arabe} libelle="" />
        </li>
      ))}
    </ul>
  )
}
