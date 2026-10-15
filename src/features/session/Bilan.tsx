import { Coins, RefreshCcw, Sparkles, Target } from 'lucide-react'
import { humeurDuBilan } from '../../gamification/mascotte'
import { MascotteBulle } from '../../ui/Mascotte'
import { useEffect, useState, type ReactNode } from 'react'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { croissance, etapesDeCroissance } from '../../gamification/jardin'
import { bonusPrecision, dirhamsDActivite } from '../../gamification/souk'
import { Plante } from '../jeu/Plante'
import { RappelSauvegarde } from '../profil/RappelSauvegarde'
import { useCroissanceAnimee } from '../jeu/useCroissanceAnimee'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { BandeZellige, useZellige } from '../../ui/zellige'
import { vibrer } from '../../ui/haptique'
import { Flamme } from '../../ui/recompenses'
import { nouveauPalierFlamme } from '../../gamification/serie'

interface Props {
  titre: string
  sousTitre: string
  xp: number
  /** Taux de réussite, de 0 à 1 ; absent quand il n'a pas de sens (Quiz express). */
  taux?: number
  /** Bonnes réponses et erreurs de l'activité, pour les dirhams gagnés. */
  activite?: { bonnes: number; mauvaises: number; xpAvant?: number; combo?: number; double?: boolean }
  /** Expressions déjà connues retrouvées sans erreur pendant la session (acquis vérifiés). */
  retrouvees?: number
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
  feuilles: { couleurs: ['#3fae5a', '#2f8f46', '#6cc76f', '#24733a'], classe: 'feuille' },
  pieces: { couleurs: ['#d4a017', '#e8b923', '#c99a14', '#f2cf4e'], classe: 'piece' },
}

/** La plante qui passe au stade suivant pendant l'activité : animée dans le bilan. */
function PlanteGrandie({ xpAvant, xp }: { xpAvant: number; xp: number }) {
  const { espece, pot } = useProfil()
  const [etapes] = useState(() => etapesDeCroissance(xpAvant, xpAvant + xp))
  const avant = croissance(xpAvant)
  const apres = croissance(xpAvant + xp)
  const plante = useCroissanceAnimee(etapes, apres, 1)
  return (
    <div className="celebration-pop mb-6 flex flex-col items-center text-center" role="status">
      <Plante stade={plante.stade} avancement={plante.avancement} espece={espece} pot={pot} taille={120} pop={plante.pop} vivante />
      <p className="t-titre-3 mt-2">Ta plante a grandi !</p>
      <p className="t-appel text-texte-2">
        {avant.nomPalier} → <span className="font-semibold text-vert">{apres.nomPalier}</span>
      </p>
    </div>
  )
}

/** Pluie de confettis (ceux du profil, ou ceux à essayer au souk) ; `classe` place la couche. */
export function PluieConfettis({ type, classe = 'fixed inset-0', nombre = 36 }: { type: string; classe?: string; nombre?: number }) {
  const style = CONFETTIS[type] ?? CONFETTIS.papiers
  return (
    <div aria-hidden className={`pointer-events-none ${classe}`}>
      {Array.from({ length: nombre }, (_, i) => (
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

/** Un vrai palier de série atteint (3, 7, 30 ou 100 jours) : la célébration spéciale du bilan. */
function PalierSerie({ jours, nom }: { jours: number; nom: string }) {
  return (
    <div className="celebration-pop mb-6 flex flex-col items-center text-center" role="status">
      <Flamme jours={jours} taille={84} />
      <p className="t-titre-2 mt-2">Nouveau palier : {nom} !</p>
      <p className="t-appel text-texte-2">{jours} jours d’affilée, ta flamme grandit.</p>
    </div>
  )
}

/**
 * Écran de fin de session, de quiz ou de Quiz express. Deux intensités : une fin d'activité (quelques
 * confettis, retour haptique) et un vrai palier (niveau de la plante, palier de série) fêté plus fort.
 */
export function Bilan({ titre, sousTitre, xp, taux, activite, retrouvees, lignes, libelleEncore, onFermer, onEncore }: Props) {
  const { serie, sessionsAujourdhui } = useResume()
  const { confettis } = useProfil()
  const zellige = useZellige()
  const dirhams = activite ? dirhamsDActivite(activite) : 0
  const bonus = activite && activite.bonnes > 0 ? bonusPrecision(activite.mauvaises) : 0
  const niveauMonte = activite?.xpAvant !== undefined && croissance(activite.xpAvant + xp).niveau > croissance(activite.xpAvant).niveau
  const palierSerie = nouveauPalierFlamme(serie.jours, sessionsAujourdhui === 1)
  const palier = niveauMonte || palierSerie !== null
  useEffect(() => {
    vibrer(palier ? 'palier' : 'succes')
  }, [palier])
  return (
    <div data-sans-balayage className="fixed inset-0 z-30 overflow-y-auto bg-fond">
      <BandeZellige
        z={zellige}
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(env(safe-area-inset-top)+7rem)] [mask-image:linear-gradient(#000_35%,transparent)]"
      />
      <PluieConfettis key={palier ? 'palier' : 'fin'} type={confettis} nombre={palier ? 64 : 24} />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col justify-center px-marge pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+9rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        <MascotteBulle humeur={humeurDuBilan(taux)} className="mb-4 justify-center" />
        <h2 className="t-grand-titre mb-1 text-center">{titre}</h2>
        <p className="t-appel mb-8 text-center text-texte-2">{sousTitre}</p>
        {niveauMonte && activite?.xpAvant !== undefined && <PlanteGrandie xpAvant={activite.xpAvant} xp={xp} />}
        {palierSerie && <PalierSerie jours={palierSerie.jours} nom={palierSerie.nom} />}
        <Section>
          {lignes}
          {retrouvees !== undefined && retrouvees > 0 && (
            <Ligne
              tuile={<Tuile icone={RefreshCcw} couleur="var(--vert-vif)" />}
              titre="Retrouvées en révision"
              sousTitre="sans erreur, des jours après les avoir vues"
              valeur={retrouvees}
            />
          )}
          <Ligne
            tuile={<Tuile icone={Sparkles} couleur="#af52de" />}
            titre="XP gagnés"
            sousTitre={
              [activite?.combo ? `dont +${activite.combo} de combo` : '', activite?.double ? 'doublés (théière ou trésor)' : ''].filter(Boolean).join(', ') || undefined
            }
            valeur={`+${xp}`}
          />
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
          <Ligne
            tuile={<Flamme jours={serie.jours} active={serie.aujourdhui} taille={29} />}
            titre="Série"
            valeur={`${serie.jours} jour${serie.jours > 1 ? 's' : ''}`}
          />
        </Section>
        <RappelSauvegarde />
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
