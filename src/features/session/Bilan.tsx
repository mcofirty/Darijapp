import { Flame, Sparkles, Target } from 'lucide-react'
import type { BilanSession } from '../../db/apprentissage'
import { useResume } from '../../db/useResume'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'

interface Props {
  bilan: BilanSession
  taux: number
  onFermer: () => void
  onEncore: () => void
}

const COULEURS = ['#ff9500', '#ffcc00', '#34c759', '#007aff', '#ff2d55']

/** Écran de fin de session, avec confettis. */
export function Bilan({ bilan, taux, onFermer, onEncore }: Props) {
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
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col justify-center px-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+9rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        <h2 className="t-grand-titre mb-1 text-center">Session terminée</h2>
        <p className="t-appel mb-8 text-center text-texte-2">
          {bilan.nouveaux > 0
            ? `${bilan.nouveaux} nouveau${bilan.nouveaux > 1 ? 'x' : ''} mot${bilan.nouveaux > 1 ? 's' : ''} appris`
            : 'Révision terminée'}
        </p>
        <Section>
          <Ligne tuile={<Tuile icone={Sparkles} couleur="#af52de" />} titre="XP gagnés" valeur={`+${bilan.xp}`} />
          <Ligne tuile={<Tuile icone={Target} couleur="#34c759" />} titre="Réussite" valeur={`${Math.round(taux * 100)} %`} />
          <Ligne tuile={<Tuile icone={Flame} couleur="#ff3b30" />} titre="Série" valeur={`${serie.jours} jour${serie.jours > 1 ? 's' : ''}`} />
        </Section>
      </div>
      {/* Commandes dans un panneau en verre, comme le panneau « Continuer » de la session. */}
      <div className="fixed inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="verre mx-auto flex max-w-xl flex-col gap-2 rounded-[2rem] p-3">
          <Bouton grand className="w-full" onClick={onEncore}>
            Encore une session
          </Bouton>
          <Bouton grand variante="gris" className="w-full" onClick={onFermer}>
            Terminer
          </Bouton>
        </div>
      </div>
    </div>
  )
}
