import { useLiveQuery } from 'dexie-react-hooks'
import { CircleCheck, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db, lireProfil } from '../../db/db'
import { ageSauvegarde, sauvegardeConseillee } from '../../sauvegarde/sauvegarde'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { sauvegarderProgression } from './sauvegarder'

/** Dans le bilan : propose d'exporter la progression quand la dernière sauvegarde a plus de 7 jours. */
export function RappelSauvegarde() {
  const donnees = useLiveQuery(async () => ({ derniere: (await lireProfil()).derniereSauvegarde, nb: await db.sessions.count() }), [])
  // Décidé une fois, à l'ouverture du bilan : après l'export, la carte reste avec une coche.
  const [conseillee, setConseillee] = useState<boolean | null>(null)
  const [faite, setFaite] = useState(false)
  useEffect(() => {
    if (donnees && conseillee === null) setConseillee(sauvegardeConseillee(donnees.derniere, Date.now(), donnees.nb))
  }, [donnees, conseillee])
  if (!conseillee || !donnees) return null
  return (
    <Section note="Ta progression n’existe que sur ce téléphone : garde-en une copie dans Fichiers (iCloud Drive).">
      {faite ? (
        <Ligne tuile={<Tuile icone={CircleCheck} couleur="#34c759" />} titre="Progression sauvegardée" />
      ) : (
        <Ligne
          tuile={<Tuile icone={Download} couleur="#007aff" />}
          titre={<span className="text-accent">Sauvegarder ma progression</span>}
          sousTitre={ageSauvegarde(donnees.derniere, Date.now())}
          onClick={() => void sauvegarderProgression().then((ok) => ok && setFaite(true))}
        />
      )}
    </Section>
  )
}
