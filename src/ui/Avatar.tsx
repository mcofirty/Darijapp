/** Visages et couleurs de l'avatar (Profil > Moi). */
export const VISAGES = ['🧑', '👩', '👨', '🧕', '👳', '🧔', '👧', '👦', '👵', '👴', '🦊', '🐪', '🦁', '🐢', '🐈', '🦉']
export const FONDS = ['#c1272d', '#006233', '#1e50c8', '#c8792b', '#ff2d55', '#5856d6', '#a2845e', '#30b0c7']

/** L'avatar : un visage (emoji) dans un rond de couleur. */
export function Avatar({ visage, fond, taille = 56 }: { visage: string; fond: string; taille?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: taille, height: taille, background: fond, fontSize: taille * 0.58, lineHeight: 1 }}
      aria-hidden
    >
      {visage}
    </span>
  )
}
