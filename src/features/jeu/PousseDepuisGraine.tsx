import { RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProfil } from '../../db/useProfil'
import { PALIERS, croissance, etapesDeCroissance } from '../../gamification/jardin'
import { NOMS_PALIERS, PALIERS_PAR_STADE } from '../../gamification/xp'
import { Bouton } from '../../ui/Boutons'
import { Jardin } from './Plante'
import { useCroissanceAnimee } from './useCroissanceAnimee'

/** Palier (1 à 30) montré pendant l'animation, d'après le stade et l'avancement dans le stade. */
function niveauAffiche(stade: number, avancement: number): number {
  const palier = Math.min(PALIERS_PAR_STADE, Math.max(1, Math.floor(avancement * PALIERS_PAR_STADE + 1e-9) + 1))
  return Math.min(PALIERS, (stade - 1) * PALIERS_PAR_STADE + palier)
}

/**
 * « Revoir sa pousse depuis la graine » : écran plein de la plante, qui repousse de la graine
 * jusqu'à l'XP actuel, palier par palier, avec le nom de chacun. Un toucher sur la scène passe l'animation.
 */
export function PousseDepuisGraine({ xp, onFermer }: { xp: number; onFermer: () => void }) {
  const { espece, pot, fond, objets } = useProfil()
  const [cle, setCle] = useState(0)
  const etapes = useMemo(() => etapesDeCroissance(0, xp), [xp])
  const fin = croissance(xp)
  // La clé démarre à 0 (plante montrée graine) puis passe à 1 juste après l'ouverture.
  const plante = useCroissanceAnimee(cle > 0 ? etapes : [], cle > 0 ? fin : croissance(0), cle)
  useEffect(() => {
    const t = window.setTimeout(() => setCle(1), 350)
    return () => window.clearTimeout(t)
  }, [])

  const termine = cle > 0 && !plante.enCours
  const niveau = termine ? fin.niveau : niveauAffiche(plante.stade, plante.avancement)

  return createPortal(
    <div data-sans-balayage className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-fond" role="dialog" aria-modal aria-label="Ta plante depuis la graine">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <p className="t-appel flex-1 text-center font-semibold">Depuis la graine</p>
        <span className="w-11 shrink-0" aria-hidden />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-marge pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div
          className={`overflow-hidden rounded-carte bg-carte ${plante.enCours ? 'cursor-pointer' : ''}`}
          onClick={plante.enCours ? plante.passer : undefined}
        >
          <Jardin stade={plante.stade} avancement={plante.avancement} espece={espece} pot={pot} fond={fond} objets={objets} pop={plante.pop} />
        </div>
        <div className="mt-5 text-center" aria-live="polite">
          <p className="t-note font-semibold uppercase text-accent">
            Niveau {niveau} sur {PALIERS}
          </p>
          <h2 className="t-titre-1 mt-1">{NOMS_PALIERS[niveau - 1]}</h2>
          <p className="t-sous-titre mt-2 text-texte-2">
            {termine ? `${xp} XP depuis ta première graine. Continue, elle n’a pas fini de pousser !` : 'Touche la plante pour passer.'}
          </p>
        </div>
        <div className={`mt-6 flex flex-col gap-2 ${termine ? '' : 'invisible'}`}>
          <Bouton grand className="w-full" onClick={onFermer}>
            Retour à mon jardin
          </Bouton>
          <Bouton grand variante="gris" className="w-full" onClick={() => setCle((c) => c + 1)}>
            <RotateCcw className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Revoir
          </Bouton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
