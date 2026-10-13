import { Coins, Flame, Sparkles, Target } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { croissance, etapesDeCroissance } from '../../gamification/jardin'
import { bonusPrecision, dirhamsDActivite } from '../../gamification/souk'
import { Plante } from '../jeu/Plante'
import { useCroissanceAnimee } from '../jeu/useCroissanceAnimee'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'

interface Props {
  titre: string
  sousTitre: string
  xp: number
  /** Taux de réussite, de 0 à 1 ; absent quand il n'a pas de sens (Quiz express). */
  taux?: number
  /** Bonnes réponses et erreurs de l'activité, pour les dirhams gagnés. */
  activite?: { bonnes: number; mauvaises: number; xpAvant?: number }
  /** Lignes ajoutées en tête du bilan (score, record…). */
  lignes?: ReactNode
  libelleEncore: string
  onFermer: () => void
  onEncore: () => void
}

/** Couleurs des confettis choisis au souk. */
export const CONFETTIS: Record<string, { couleurs: string[]; classe: string }> = {
  papiers: { couleurs: ['#ff9500', '#ffcc00', '#34c759', '#007aff', '#ff2d55'], classe: '' },
  petales: { couleurs: ['#e2445c', '#f06b84', '#c2185b', '#ff9fb2'], classe: 'petale' },
  etoiles: { couleurs: ['#ffcc00', '#f2c14e', '#ffd966', '#e0a800'], classe: 'etoile' },
}

/** La plante qui passe au stade suivant pendant l'activité : animée dans le bilan. */
function PlanteGrandie({ xpAvant, xp }: { xpAvant: number; xp: number }) {
  const { espece, pot } = useProfil()
  const [etapes] = useState(() => etapesDeCroissance(xpAvant, xpAvant + xp))
  const avant = croissance(xpAvant)
  const apres = croissance(xpAvant + xp)
  const plante = useCroissanceAnimee(etapes, apres, 1)
  return (
    <div className="mb-6 flex flex-col items-center text-center" role="status">
      <Plante stade={plante.stade} avancement={plante.avancement} espece={espece} pot={pot} taille={120} pop={plante.pop} vivante />
      <p className="t-titre-3 mt-2">Ta plante a grandi !</p>
      <p className="t-appel text-texte-2">
        {avant.nom} → <span className="font-semibold text-vert">{apres.nom}</span>
      </p>
    </div>
  )
}

/** Pluie de confettis (ceux du profil, ou ceux à essayer au souk) ; `classe` place la couche. */
export function PluieConfettis({ type, classe = 'fixed inset-0' }: { type: string; classe?: string }) {
  const style = CONFETTIS[type] ?? CONFETTIS.papiers
  return (
    <div aria-hidden className={`pointer-events-none ${classe}`}>
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className={`confetti ${style.classe}`}
          style={{
            left: `${(i * 37) % 100}%`,
            background: style.couleurs[i % style.couleurs.length],
            animationDelay: `${(i % 9) * 0.12}s`,
            animationDuration: `${2.2 + (i % 5) * 0.3}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Écran de fin de session, de quiz ou de Quiz express, avec confettis. */
export function Bilan({ titre, sousTitre, xp, taux, activite, lignes, libelleEncore, onFermer, onEncore }: Props) {
  const { serie } = useResume()
  const { confettis } = useProfil()
  const dirhams = activite ? dirhamsDActivite(activite) : 0
  const bonus = activite && activite.bonnes > 0 ? bonusPrecision(activite.mauvaises) : 0
  return (
    <div data-sans-balayage className="fixed inset-0 z-30 overflow-y-auto bg-fond">
      <PluieConfettis type={confettis} />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col justify-center px-marge pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+9rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        <h2 className="t-grand-titre mb-1 text-center">{titre}</h2>
        <p className="t-appel mb-8 text-center text-texte-2">{sousTitre}</p>
        {activite?.xpAvant !== undefined && croissance(activite.xpAvant + xp).stade > croissance(activite.xpAvant).stade && (
          <PlanteGrandie xpAvant={activite.xpAvant} xp={xp} />
        )}
        <Section>
          {lignes}
          <Ligne tuile={<Tuile icone={Sparkles} couleur="#af52de" />} titre="XP gagnés" valeur={`+${xp}`} />
          {activite && (
            <Ligne
              tuile={<Tuile icone={Coins} couleur="#ffcc00" />}
              titre="Dirhams gagnés"
              sousTitre={
                bonus > 0
                  ? `dont +${bonus} DH de précision (${activite.mauvaises === 0 ? 'sans faute' : `${activite.mauvaises} erreur${activite.mauvaises > 1 ? 's' : ''}`})`
                  : 'Moins d’erreurs, plus de dirhams'
              }
              valeur={`+${dirhams} DH`}
            />
          )}
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
