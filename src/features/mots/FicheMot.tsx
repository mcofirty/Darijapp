import { useEffect } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { useProfil } from '../../db/useProfil'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { BoutonAudio } from './BoutonAudio'

interface Props {
  mot: Mot
  retour: { libelle: string; action: () => void }
}

export function FicheMot({ mot, retour }: Props) {
  const { afficherArabe } = useProfil()
  const sons = sonsDuMot(mot.latin)

  // Lecture automatique à l'ouverture (l'ouverture vient d'un toucher, ce qu'exige iOS).
  useEffect(() => {
    window.scrollTo(0, 0)
    jouer(mot.audio, mot.arabe)
  }, [mot])

  return (
    <Page titre={mot.latin} retour={retour}>
      <div className="mb-8 rounded-[10px] bg-carte px-4 py-6 text-center">
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
        {mot.prononciation && <div className="t-corps px-4 py-3">{mot.prononciation}</div>}
        {sons.map((s) => (
          <Ligne key={s.latin} tuile={<Tuile couleur="#af52de" texte={s.latin} />} titre={`${s.latin} · ${s.arabe}`} sousTitre={s.explication} />
        ))}
      </Section>
      )}

      {mot.exemple.latin && (
      <Section titre="Exemple">
        <Ligne
          titre={<span className="font-semibold">{mot.exemple.latin}</span>}
          sousTitre={
            <>
              {afficherArabe && (
                <span className="arabe t-corps block text-texte" dir="rtl" lang="ar">
                  {mot.exemple.arabe}
                </span>
              )}
              {mot.exemple.fr}
            </>
          }
          fin={<BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} libelle="" />}
        />
        <Ligne
          titre="Écouter au ralenti"
          fin={<BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} vitesse={0.75} libelle="" />}
        />
      </Section>
      )}
    </Page>
  )
}
