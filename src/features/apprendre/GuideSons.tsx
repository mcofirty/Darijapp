import { MOTS } from '../../data'
import { SONS } from '../../data/sons'
import { useProfil } from '../../db/useProfil'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { BoutonAudio } from '../mots/BoutonAudio'

/** Mini-module « Les sons du darija » : un mot exemple par son difficile. */
export function GuideSons({ onRetour }: { onRetour: () => void }) {
  const { afficherArabe } = useProfil()
  return (
    <Page titre="Les sons du darija" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <p className="t-appel mb-6 px-1 text-texte-2">
        En lettres latines, les Marocains écrivent avec des chiffres les sons qui n'existent pas en français.
      </p>
      {SONS.map((s) => {
        const mot = MOTS.find((m) => m.latin === s.exemple.latin)
        return (
          <Section key={s.latin} titre={`${s.latin} · ${s.arabe}`}>
            <Ligne tuile={<Tuile couleur="#af52de" texte={s.latin} />} titre={s.explication} />
            <Ligne
              titre={
                <span>
                  <span className="font-semibold">{s.exemple.latin}</span>
                  {afficherArabe && (
                    <span className="arabe ml-2 text-texte-2" lang="ar">
                      {s.exemple.arabe}
                    </span>
                  )}
                </span>
              }
              sousTitre={s.exemple.fr}
              fin={<BoutonAudio chemin={mot?.audio ?? ''} arabe={s.exemple.arabe} libelle="" />}
            />
          </Section>
        )
      })}
    </Page>
  )
}
