import { Flame, Sparkles, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { useResume } from '../../db/useResume'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'

interface Props {
  titre: string
  sousTitre: string
  xp: number
  /** Taux de réussite, de 0 à 1 ; absent quand il n'a pas de sens (Quiz express). */
  taux?: number
  /** Lignes ajoutées en tête du bilan (score, record…). */
  lignes?: ReactNode
  libelleEncore: string
  onFermer: () => void
  onEncore: () => void
}

const COULEURS = ['#ff9500', '#ffcc00', '#34c759', '#007aff', '#ff2d55']

/** Écran de fin de session, de quiz ou de Quiz express, avec confettis. */
export function Bilan({ titre, sousTitre, xp, taux, lignes, libelleEncore, onFermer, onEncore }: Props) {
  const { serie } = useResume()
  return (
    <div data-sans-balayage className="fixed inset-0 z-30 overflow-y-auto bg-fond">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${(i * 37) % 100}%`,
              background: COULEURS[i % COULEURS.length],
              animationDelay: `${(i % 9) * 0.12}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col justify-center px-marge pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+9rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        <h2 className="t-grand-titre mb-1 text-center">{titre}</h2>
        <p className="t-appel mb-8 text-center text-texte-2">{sousTitre}</p>
        <Section>
          {lignes}
          <Ligne tuile={<Tuile icone={Sparkles} couleur="#af52de" />} titre="XP gagnés" valeur={`+${xp}`} />
          {taux !== undefined && (
            <Ligne tuile={<Tuile icone={Target} couleur="#34c759" />} titre="Réussite" valeur={`${Math.round(taux * 100)} %`} />
          )}
          <Ligne tuile={<Tuile icone={Flame} couleur="#ff3b30" />} titre="Série" valeur={`${serie.jours} jour${serie.jours > 1 ? 's' : ''}`} />
        </Section>
      </div>
      {/* Commandes dans un panneau en verre, comme le panneau « Continuer » de la session. */}
      <div className="fixed inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="verre mx-auto flex max-w-xl flex-col gap-2 rounded-panneau p-3">
          <Bouton grand className="w-full" onClick={onEncore}>
            {libelleEncore}
          </Bouton>
          <Bouton grand variante="gris" className="w-full" onClick={onFermer}>
            Terminer
          </Bouton>
        </div>
      </div>
    </div>
  )
}
