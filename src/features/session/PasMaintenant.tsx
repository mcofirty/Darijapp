import { MicOff, VolumeX } from 'lucide-react'
import { MINUTES_DE_PAUSE } from '../../exercices/modes'

/**
 * « Je ne peux pas parler / écouter maintenant » (façon Duolingo) : passe l'exercice sans le compter
 * et coupe ce type d'exercice pendant 15 min, sans toucher aux réglages du Profil.
 */
export function PasMaintenant({ mode, onClick }: { mode: 'parler' | 'ecouter'; onClick: () => void }) {
  const Icone = mode === 'parler' ? MicOff : VolumeX
  return (
    <div className="mt-8 text-center">
      <button type="button" onClick={onClick} className="pressable t-appel inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold text-accent">
        <Icone className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        {mode === 'parler' ? 'Je ne peux pas parler maintenant' : 'Je ne peux pas écouter maintenant'}
      </button>
      <p className="t-note text-texte-2">Pendant {MINUTES_DE_PAUSE} min, sans compter cet exercice.</p>
    </div>
  )
}
