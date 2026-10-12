import { Flag, Share } from 'lucide-react'
import { useState } from 'react'
import { useMarques } from '../../db/marques'
import { useMots } from '../../db/motsPerso'
import { MOTIFS, texteSignalements } from '../../exercices/selections'
import { Bouton, Vide } from '../../ui/Boutons'
import { Ligne, Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'

/** Liste des mots signalés, à envoyer (feuille de partage) ou copier pour les faire corriger. */
export function MotsSignales({ onRetour }: { onRetour: () => void }) {
  const mots = useMots()
  const marques = useMarques()
  const [copie, setCopie] = useState(false)
  const signales = [...marques.values()]
    .filter((m) => m.signale)
    .sort((a, b) => b.date - a.date)
    .map((m) => ({ id: m.id, motif: m.signale! }))
  const parId = new Map(mots.map((m) => [m.id, m]))

  async function envoyer() {
    const texte = texteSignalements(signales, mots)
    try {
      if (navigator.share) await navigator.share({ text: texte })
      else {
        await navigator.clipboard.writeText(texte)
        setCopie(true)
      }
    } catch {
      // Partage annulé : rien à faire.
    }
  }

  return (
    <Page titre="Mots signalés" retour={{ libelle: 'Profil', action: onRetour }}>
      {signales.length === 0 ? (
        <Vide
          icone={<Flag className="h-12 w-12" strokeWidth={1.6} />}
          titre="Aucun mot signalé"
          texte="Sur la fiche d’un mot, touche « Signaler une erreur » si une traduction ou une écriture te semble fausse."
        />
      ) : (
        <>
          <Bouton grand className="mb-[26px] w-full" onClick={() => void envoyer()}>
            <Share className="h-5 w-5" strokeWidth={2.4} aria-hidden /> {copie ? 'Liste copiée' : 'Envoyer la liste'}
          </Bouton>
          <Section
            titre={`${signales.length} mot${signales.length > 1 ? 's' : ''}`}
            note="Envoie-moi cette liste (par exemple dans une conversation avec Claude) pour corriger les mots dans l’appli."
          >
            {signales.map(({ id, motif }) => {
              const m = parId.get(id)
              return m ? <Ligne key={id} titre={<span className="font-semibold">{m.latin}</span>} sousTitre={`${m.fr} · à vérifier : ${MOTIFS[motif]}`} /> : null
            })}
          </Section>
        </>
      )}
    </Page>
  )
}
