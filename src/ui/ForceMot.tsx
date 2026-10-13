/** Force d'un mot : 4 crans, un par boîte de la répétition espacée (0 = jamais vu). */
export function ForceMot({ boite, grande = false }: { boite: number; grande?: boolean }) {
  const couleur = boite >= 4 ? 'bg-[#e0a800]' : boite >= 3 ? 'bg-vert-plein' : boite >= 2 ? 'bg-[#34c759]' : 'bg-[#ff9500]'
  return (
    <span className={`inline-flex items-end ${grande ? 'gap-1' : 'gap-[2px]'}`} role="img" aria-label={`Force du mot : ${boite} sur 4`}>
      {[1, 2, 3, 4].map((c) => (
        <span
          key={c}
          className={`block rounded-full ${grande ? 'w-2' : 'w-[3px]'} ${c <= boite ? couleur : 'bg-remplissage'}`}
          style={{ height: `${(grande ? 6 : 4) + c * (grande ? 4 : 2.5)}px` }}
        />
      ))}
    </span>
  )
}
