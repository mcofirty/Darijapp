import { Flag, Languages, SunMoon } from 'lucide-react'
import { useState } from 'react'
import { modifierProfil, type Apparence } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { Interrupteur, Segmente } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { useMarques } from '../../db/marques'
import { Page } from '../../ui/Page'
import { MotsSignales } from './MotsSignales'
import { RappelEtSauvegarde } from './RappelEtSauvegarde'

const APPARENCES: { id: Apparence; libelle: string }[] = [
  { id: 'systeme', libelle: 'Automatique' },
  { id: 'clair', libelle: 'Clair' },
  { id: 'sombre', libelle: 'Sombre' },
]

export function Profil() {
  const profil = useProfil()
  const [signales, setSignales] = useState(false)
  const nbSignales = [...useMarques().values()].filter((m) => m.signale).length
  if (signales) return <MotsSignales onRetour={() => setSignales(false)} />
  return (
    <Page titre="Profil">
      <Section titre="Apparence" arrondi="rounded-segmente" note="Automatique suit le réglage clair ou sombre de l'iPhone.">
        <Ligne tuile={<Tuile icone={SunMoon} couleur="#5856d6" />} titre="Thème" />
        <div className="sans-separateur px-marge pb-marge">
          <Segmente options={APPARENCES} valeur={profil.apparence} onChange={(v) => void modifierProfil({ apparence: v })} />
        </div>
      </Section>
      <Section titre="Affichage">
        <Ligne
          tuile={<Tuile icone={Languages} couleur="#006233" />}
          titre="Écriture arabe"
          sousTitre="À côté des lettres latines"
          fin={
            <Interrupteur
              libelle="Afficher l'écriture arabe"
              actif={profil.afficherArabe}
              onChange={(v) => void modifierProfil({ afficherArabe: v })}
            />
          }
        />
      </Section>
      <RappelEtSauvegarde />
      <Section titre="Contenu">
        <Ligne
          tuile={<Tuile icone={Flag} couleur="#ff9500" />}
          titre="Mots signalés"
          valeur={nbSignales}
          chevron
          onClick={() => setSignales(true)}
        />
      </Section>
    </Page>
  )
}
