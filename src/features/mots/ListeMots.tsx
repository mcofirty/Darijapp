import { CircleCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

/** Lignes affichées d'emblée, puis ajoutées par tranches en approchant du bas (1 682 mots d'un coup ralentissaient). */
export const PREMIERE_TRANCHE = 60
const TRANCHE = 120

export function ListeMots({ mots, onChoisir, titre }: Props) {
  const { afficherArabe } = useProfil()
  const { motsVus } = useResume()
  const [limite, setLimite] = useState(PREMIERE_TRANCHE)
  const repere = useRef<HTMLDivElement>(null)

  // Nouvelle liste (recherche, autre thème) : on repart de la première tranche.
  useEffect(() => setLimite(PREMIERE_TRANCHE), [mots.length, mots[0]?.id])

  const reste = mots.length > limite
  useEffect(() => {
    const el = repere.current
    if (!el || !reste) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setLimite((l) => l + TRANCHE)
      },
      { rootMargin: '800px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reste, limite])

  return (
    <>
      <Section titre={titre}>
        {mots.slice(0, limite).map((m) => (
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
      {reste && <div ref={repere} aria-hidden className="h-px" />}
    </>
  )
}
