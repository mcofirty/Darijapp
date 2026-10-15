import { Snail, Volume2 } from 'lucide-react'
import { jouer } from '../../audio/lecteur'
import { Bouton } from '../../ui/Boutons'
import { useLegendaire } from '../../ui/legendaire'

interface Props {
  chemin: string
  arabe: string
  vitesse?: number
  libelle: string
  grand?: boolean
}

/** Bouton de lecture : capsule avec libellé, ou rond compact quand le libellé est vide. */
export function BoutonAudio({ chemin, arabe, vitesse = 1, libelle, grand = false }: Props) {
  // Épreuve légendaire : pas de ralenti.
  const legendaire = useLegendaire()
  if (legendaire && vitesse < 1) return null
  const Icone = vitesse < 1 ? Snail : Volume2
  const lire = (e: React.MouseEvent) => {
    e.stopPropagation()
    jouer(chemin, arabe, vitesse)
  }
  if (!libelle) {
    return (
      <button
        type="button"
        onClick={lire}
        aria-label="Écouter"
        className="pressable flex h-11 w-11 items-center justify-center rounded-full text-accent"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-doux">
          <Icone className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
        </span>
      </button>
    )
  }
  return (
    <Bouton variante={vitesse < 1 ? 'teinte' : 'plein'} grand={grand} onClick={lire} className={grand ? 'flex-1' : ''}>
      <Icone className="h-5 w-5" strokeWidth={2.4} aria-hidden />
      {libelle}
    </Bouton>
  )
}
