import { jouer } from '../../audio/lecteur'

interface Props {
  chemin: string
  arabe: string
  vitesse?: number
  libelle: string
  grand?: boolean
}

export function BoutonAudio({ chemin, arabe, vitesse = 1, libelle, grand = false }: Props) {
  return (
    <button
      type="button"
      aria-label={libelle || "Écouter"}
      onClick={(e) => {
        e.stopPropagation()
        jouer(chemin, arabe, vitesse)
      }}
      className={`flex items-center justify-center gap-2 rounded-2xl font-semibold active:scale-95 ${
        grand
          ? 'min-h-16 flex-1 bg-orange-600 px-4 text-lg text-white'
          : 'min-h-11 bg-orange-100 px-3 text-sm text-orange-800 dark:bg-stone-800 dark:text-orange-300'
      }`}
    >
      <span aria-hidden>{vitesse < 1 ? '🐢' : '🔊'}</span>
      {libelle}
    </button>
  )
}
