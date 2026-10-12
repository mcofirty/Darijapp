import { CircleCheck } from 'lucide-react'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { Ligne, Section } from '../../ui/Liste'
import { BoutonAudio } from './BoutonAudio'

interface Props {
  mots: Mot[]
  onChoisir: (mot: Mot) => void
  titre?: string
}

export function ListeMots({ mots, onChoisir, titre }: Props) {
  const { afficherArabe } = useProfil()
  const { motsVus } = useResume()
  return (
    <Section titre={titre}>
      {mots.map((m) => (
        <Ligne
          key={m.id}
          onClick={() => onChoisir(m)}
          titre={
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">{m.latin}</span>
              {motsVus.has(m.id) && <CircleCheck className="h-4 w-4 text-vert" strokeWidth={2.5} aria-label="déjà vu" />}
            </span>
          }
          sousTitre={m.fr}
          valeur={
            afficherArabe && (
              <span className="arabe text-[1.15rem]" dir="rtl" lang="ar">
                {m.arabe}
              </span>
            )
          }
          fin={<BoutonAudio chemin={m.audio} arabe={m.arabe} libelle="" />}
        />
      ))}
    </Section>
  )
}
