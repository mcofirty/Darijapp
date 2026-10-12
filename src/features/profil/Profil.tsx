import { Languages } from 'lucide-react'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { Interrupteur } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'

export function Profil() {
  const profil = useProfil()
  return (
    <Page titre="Profil">
      <Section titre="Affichage" note="Les autres réglages (prénom, objectif, rappel, sauvegarde) arrivent aux jalons suivants.">
        <Ligne
          tuile={<Tuile icone={Languages} couleur="#34c759" />}
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
    </Page>
  )
}
