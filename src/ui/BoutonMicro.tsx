import { Loader2, Mic } from 'lucide-react'

/**
 * Gros bouton micro de Dis-le. Vide (contour) quand il faut appuyer avant de parler ; plein, avec un halo
 * qui suit la voix, quand il faut parler ; plein avec une roue pendant l'analyse.
 */
export function BoutonMicro({
  etat,
  niveau,
  taille = 'h-24 w-24',
  onClick,
}: {
  etat: 'pret' | 'ecoute' | 'analyse'
  /** Volume de la voix (0 à 1), pendant l'écoute. */
  niveau: number
  taille?: string
  onClick: () => void
}) {
  const plein = etat !== 'pret'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={etat === 'analyse'}
      aria-label={etat === 'ecoute' ? 'Arrêter l’enregistrement' : 'Parler'}
      className={`pressable relative flex ${taille} items-center justify-center rounded-full transition-colors duration-200 ${
        plein ? 'bg-accent-plein text-white' : 'border-[3px] border-[var(--accent)] bg-carte text-accent'
      }`}
    >
      {/* Halo qui suit le volume de la voix, et onde qui bat pour dire « parle maintenant ». */}
      {etat === 'ecoute' && (
        <>
          <span className="micro-onde absolute inset-0 rounded-full bg-accent-plein" aria-hidden />
          <span
            className="absolute inset-0 rounded-full bg-accent-plein opacity-30 transition-transform duration-100"
            style={{ transform: `scale(${1 + niveau * 0.6})` }}
            aria-hidden
          />
        </>
      )}
      {etat === 'analyse' ? (
        <Loader2 className="relative h-10 w-10 animate-spin" strokeWidth={2.2} aria-hidden />
      ) : (
        <Mic className="relative h-10 w-10" strokeWidth={2.2} fill={plein ? 'currentColor' : 'none'} aria-hidden />
      )}
    </button>
  )
}
