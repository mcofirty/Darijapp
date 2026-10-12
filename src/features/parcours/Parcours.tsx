import { Map as IconeCarte } from 'lucide-react'
import { Vide } from '../../ui/Boutons'
import { Page } from '../../ui/Page'

export function Parcours() {
  return (
    <Page titre="Parcours">
      <Vide icone={<IconeCarte className="h-12 w-12" strokeWidth={1.6} />} titre="Bientôt disponible" texte="Le chemin de leçons arrive au jalon 4." />
    </Page>
  )
}
