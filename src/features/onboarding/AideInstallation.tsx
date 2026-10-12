import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Share, SquarePlus, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { doitProposerInstallation } from '../../app/installation'
import { lireProfil, modifierProfil } from '../../db/db'
import { Bouton } from '../../ui/Boutons'

const ETAPES: { icone?: LucideIcon; texte: string; detail?: string }[] = [
  {
    icone: Share,
    texte: 'Touche le bouton Partager',
    detail: 'En bas de Safari. Sur iOS 26, touche d’abord « ⋯ ».',
  },
  { icone: SquarePlus, texte: 'Touche « Sur l’écran d’accueil »', detail: 'Fais défiler si tu ne le vois pas.' },
  { texte: 'Touche « Ajouter »', detail: 'En haut à droite.' },
  { texte: 'Ouvre Darijaapp depuis sa nouvelle icône' },
]

function appliInstallee(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Fenêtre en verre qui explique comment installer l'appli sur l'écran d'accueil.
 * Affichée à l'ouverture dans Safari sur iPhone ou iPad, jusqu'à ce que « Ne plus afficher » soit coché.
 */
export function AideInstallation() {
  const profil = useLiveQuery(() => lireProfil(), [])
  const [fermee, setFermee] = useState(false)
  const [nePlusAfficher, setNePlusAfficher] = useState(false)

  const ouverte =
    profil !== undefined &&
    !fermee &&
    doitProposerInstallation(
      { userAgent: navigator.userAgent, pointsDeContact: navigator.maxTouchPoints, installee: appliInstallee() },
      profil.masquerAideInstallation,
    )

  function fermer() {
    if (nePlusAfficher) void modifierProfil({ masquerAideInstallation: true })
    setFermee(true)
  }

  useEffect(() => {
    if (!ouverte) return
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFermee(true)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [ouverte])

  if (!ouverte) return null

  return createPortal(
    <div data-sans-balayage className="fixed inset-0 z-50 flex items-end justify-center">
      <div aria-hidden className="voile-entree absolute inset-0 bg-[var(--voile)]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="installation-titre"
        className="verre verre-epais feuille-entree mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-xl flex-col rounded-[2.25rem]"
      >
        {/* Sur petit écran (iPhone SE), seules les explications défilent : « Compris » reste visible. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-6">
          <img src={`${import.meta.env.BASE_URL}logo-180.png`} alt="" className="mx-auto mb-2 h-12 w-12 rounded-[11px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]" />
          <h2 id="installation-titre" className="t-titre-2 text-center">
            Ajoute Darijaapp à ton écran d’accueil
          </h2>
          <p className="t-corps mt-2 text-center font-semibold text-accent">
            L’ajout à l’écran d’accueil enregistre ta progression. Dans Safari, elle peut être effacée.
          </p>
          <p className="t-sous-titre mt-1 text-center text-texte-2">
            Darijaapp s’ouvrira aussi en plein écran et marchera sans réseau.
          </p>

          <ol className="mt-4 space-y-2.5">
            {ETAPES.map(({ icone: Icone, texte, detail }, i) => (
              <li key={texte} className="flex items-start gap-3">
                <span className="t-appel flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-plein font-semibold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="t-gras block">
                    {texte}
                    {Icone && <Icone className="ml-1.5 inline-block h-[18px] w-[18px] align-[-3px] text-accent" strokeWidth={2.2} aria-hidden />}
                  </span>
                  {detail && <span className="t-sous-titre mt-0.5 block text-texte-2">{detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="px-5 pb-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={nePlusAfficher}
            onClick={() => setNePlusAfficher(!nePlusAfficher)}
            className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-full px-1"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                nePlusAfficher ? 'border-accent-plein bg-accent-plein text-white' : 'border-texte-3'
              }`}
              aria-hidden
            >
              {nePlusAfficher && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className="t-corps">Ne plus afficher</span>
          </button>

          <Bouton grand className="mt-2 w-full" onClick={fermer}>
            Compris
          </Bouton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
