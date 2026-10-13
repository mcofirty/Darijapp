import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useProfil } from '../../db/useProfil'
import { croissance, etapesDeCroissance } from '../../gamification/jardin'
import { Plante } from './Plante'
import { useCroissanceAnimee } from './useCroissanceAnimee'

/** Durée de la scène, en ms : la théière arrive, verse, repart, puis tout s'efface. */
const DUREE = 3800
/** Moment où le thé touche la terre : la plante commence à pousser. */
const ARROSE = 1300

const sansAnimation = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * La théière-coffre arrose la plante : fenêtre flottante sans fond, au-dessus de la page.
 * La plante pousse avec l'XP gagné (de `xpAvant` à `xpAvant + gain`). Un toucher la ferme.
 */
export function Arrosage({ xpAvant, gain, onFin }: { xpAvant: number; gain: number; onFin: () => void }) {
  const { espece, pot } = useProfil()
  const [arrose, setArrose] = useState(false)
  const etapes = useMemo(() => etapesDeCroissance(xpAvant, xpAvant + gain), [xpAvant, gain])
  const avant = croissance(xpAvant)
  const apres = croissance(xpAvant + gain)
  const plante = useCroissanceAnimee(arrose ? etapes : [], arrose ? apres : avant, arrose ? 1 : 0)
  const reduit = sansAnimation()

  useEffect(() => {
    const t1 = window.setTimeout(() => setArrose(true), reduit ? 0 : ARROSE)
    const t2 = window.setTimeout(onFin, reduit ? 1800 : DUREE)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onFin} role="status" aria-label={`La théière arrose ta plante : +${gain} XP`}>
      {/* Scène agrandie d'un tiers ; sans fond, un halo de la couleur de la page garde le texte lisible. */}
      <div className="scale-[1.35]">
      <div className={`relative ${reduit ? '' : 'arrosage-scene'}`}>
        <p className="gain-xp t-titre-1 absolute inset-x-0 top-2 text-center font-bold text-vert [text-shadow:0_0_6px_var(--fond),0_0_3px_var(--fond),0_0_1px_var(--fond)]">
          +{gain} XP
        </p>
        {/* La plante dans son pot, sous la théière (même repère de 240 × 260). */}
        <div className="absolute left-[60px] top-[96px] drop-shadow-xl">
          <Plante stade={plante.stade} avancement={plante.avancement} espece={espece} pot={pot} pop={plante.pop} taille={120} />
        </div>
        <svg viewBox="0 0 240 260" width="240" height="260" className="relative drop-shadow-xl" aria-hidden>
          {!reduit && (
            <>
              {/* Filet de thé, puis gouttes qui tombent sur la terre. */}
              <path className="arrosage-filet" d="M148 71 C141 110 133 150 127 196" fill="none" stroke="#b5651d" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} className="arrosage-goutte" cx={124 + (i % 2) * 6} cy="190" r="2.6" fill="#c97a2b" style={{ animationDelay: `${1150 + i * 180}ms` }} />
              ))}
              {/* La théière, penchée pour verser (bec à gauche). */}
              <g className="arrosage-theiere">
                <g transform="translate(196 62) rotate(-35)">
                  <path d="M-22 -4 C-32 -8 -38 -14 -44 -20" stroke="#a8a8b2" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <ellipse cx="0" cy="0" rx="26" ry="19" fill="#c8c8d0" />
                  <ellipse cx="-6" cy="-6" rx="9" ry="5" fill="#fff" opacity="0.5" />
                  <path d="M22 -8 q16 2 12 18 q-4 8 -12 4" stroke="#a8a8b2" strokeWidth="5" fill="none" />
                  <path d="M-14 -16 q14 -16 28 0z" fill="#dcdce4" />
                  <circle cx="0" cy="-24" r="4" fill="#a8a8b2" />
                  <rect x="-16" y="16" width="32" height="5" rx="2.5" fill="#a8a8b2" />
                </g>
              </g>
            </>
          )}
        </svg>
      </div>
      </div>
    </div>,
    document.body,
  )
}

