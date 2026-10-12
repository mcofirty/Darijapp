import { Brain } from 'lucide-react'
import { Vide } from '../../ui/Boutons'
import { Page } from '../../ui/Page'

export function Quiz() {
  return (
    <Page titre="Quiz">
      <Vide icone={<Brain className="h-12 w-12" strokeWidth={1.6} />} titre="Bientôt disponible" texte="Le quiz de 5 questions arrive bientôt." />
    </Page>
  )
}
