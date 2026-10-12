import { Headphones, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { Mot } from '../../data/types'
import { Bouton, Vide } from '../../ui/Boutons'
import { Page } from '../../ui/Page'
import { LecteurEcoute } from '../ecoute/LecteurEcoute'
import { FicheMot } from '../mots/FicheMot'
import { ListeMots } from '../mots/ListeMots'

interface Props {
  titre: string
  mots: Mot[]
  vide: { icone: React.ReactNode; titre: string; texte: string }
  onRetour: () => void
  onReviser: (mots: Mot[]) => void
}

/** Favoris ou mots difficiles : la liste, à réviser en session ou à écouter mains libres. */
export function ListeSpeciale({ titre, mots, vide, onRetour, onReviser }: Props) {
  const [mot, setMot] = useState<Mot | null>(null)
  const [ecoute, setEcoute] = useState(false)

  if (ecoute) return <LecteurEcoute titre={titre} mots={mots} options={{ repeter: true, francais: true }} onFermer={() => setEcoute(false)} />
  if (mot) return <FicheMot mot={mot} retour={{ libelle: titre, action: () => setMot(null) }} />

  return (
    <Page titre={titre} retour={{ libelle: 'Apprendre', action: onRetour }}>
      {mots.length === 0 ? (
        <Vide {...vide} />
      ) : (
        <>
          <div className="mb-[26px] flex gap-3">
            <Bouton grand className="flex-1" onClick={() => onReviser(mots)}>
              <RotateCcw className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Réviser
            </Bouton>
            <Bouton grand variante="teinte" className="flex-1" onClick={() => setEcoute(true)}>
              <Headphones className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Écouter
            </Bouton>
          </div>
          <ListeMots mots={mots} onChoisir={setMot} titre={`${mots.length} mot${mots.length > 1 ? 's' : ''}`} />
        </>
      )}
    </Page>
  )
}
