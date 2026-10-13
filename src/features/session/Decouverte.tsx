import { useEffect } from 'react'
import { jouerAuto } from '../../audio/lecteur'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { BoutonAudio } from '../mots/BoutonAudio'
import { BandeZellige, useZellige } from '../../ui/zellige'

/** Présentation d'un nouveau mot avant de l'exercer. */
export function Decouverte({ mot }: { mot: Mot }) {
  const { afficherArabe } = useProfil()
  const zellige = useZellige()
  const sons = sonsDuMot(mot.latin)

  useEffect(() => {
    jouerAuto(mot.audio, mot.arabe)
  }, [mot])

  return (
    <div>
      <p className="t-note mb-1 font-semibold uppercase text-accent">Nouveau mot</p>
      <h2 className="t-grand-titre mb-4">{mot.latin}</h2>
      <div className="mb-[26px] overflow-hidden rounded-liste bg-carte px-marge py-6 text-center">
        <BandeZellige z={zellige} className="-mx-marge -mt-6 mb-6 h-8" />
        {afficherArabe && (
          <p className="arabe text-[2.4rem] leading-tight" dir="rtl" lang="ar">
            {mot.arabe}
          </p>
        )}
        <p className="t-titre-3 mt-2 text-texte-2">{mot.fr}</p>
        <div className="mt-6 flex gap-3">
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" grand />
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" grand />
        </div>
      </div>
      {(mot.prononciation || sons.length > 0) && (
      <Section titre="Prononciation">
        {mot.prononciation && <div className="t-corps px-marge py-3">{mot.prononciation}</div>}
        {sons.map((s) => (
          <Ligne key={s.latin} tuile={<Tuile couleur="#af52de" texte={s.latin} />} titre={`${s.latin} · ${s.arabe}`} sousTitre={s.explication} />
        ))}
      </Section>
      )}
    </div>
  )
}
