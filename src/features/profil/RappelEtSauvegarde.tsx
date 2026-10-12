import { BellRing, Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { choisirFichier, donnerFichier } from '../../app/fichiers'
import { modifierProfil } from '../../db/db'
import { exporter, importer } from '../../db/sauvegarde'
import { useProfil } from '../../db/useProfil'
import { fichierIcs } from '../../sauvegarde/rappel'
import { lireSauvegarde, nomDuFichier, resumeSauvegarde, type Sauvegarde } from '../../sauvegarde/sauvegarde'
import { dateLocale } from '../../srs/dates'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Section, Tuile } from '../../ui/Liste'

const ADRESSE = 'https://mcofirty.github.io/Darijapp/'

/** Rappel quotidien (.ics pour Calendrier) et sauvegarde de la progression (export / import). */
export function RappelEtSauvegarde() {
  const { heureRappel } = useProfil()
  const [aImporter, setAImporter] = useState<Sauvegarde | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function exporterProgression() {
    const sauvegarde = await exporter()
    await donnerFichier(nomDuFichier(dateLocale()), 'application/json', JSON.stringify(sauvegarde))
  }

  async function choisirSauvegarde() {
    const texte = await choisirFichier('application/json,.json')
    if (texte === null) return
    const s = lireSauvegarde(texte)
    if (typeof s === 'string') setMessage(s)
    else setAImporter(s)
  }

  return (
    <>
      <Section titre="Rappel" note="Ajoute un rendez-vous quotidien à ton Calendrier : il te prévient à l’heure choisie. Aucune notification ne passe par un serveur.">
        <Ligne
          tuile={<Tuile icone={BellRing} couleur="#ff3b30" />}
          titre="Heure du rappel"
          fin={
            <input
              type="time"
              value={heureRappel}
              onChange={(e) => e.target.value && void modifierProfil({ heureRappel: e.target.value })}
              className="t-corps rounded-full bg-remplissage px-3 py-1.5 text-texte"
              aria-label="Heure du rappel"
            />
          }
        />
        <Ligne
          titre={<span className="text-accent">Ajouter au Calendrier</span>}
          onClick={() => void donnerFichier('darijaapp-rappel.ics', 'text/calendar', fichierIcs(heureRappel, dateLocale(), ADRESSE), false)}
        />
      </Section>

      <Section
        titre="Sauvegarde"
        note="Ta progression reste sur ce téléphone. Exporte-la de temps en temps dans Fichiers : tu pourras la réimporter si les données de l’appli sont effacées, ou sur un autre appareil."
      >
        <Ligne tuile={<Tuile icone={Download} couleur="#007aff" />} titre="Exporter ma progression" chevron onClick={() => void exporterProgression()} />
        <Ligne tuile={<Tuile icone={Upload} couleur="#34c759" />} titre="Importer une sauvegarde" chevron onClick={() => void choisirSauvegarde()} />
      </Section>

      {aImporter && (
        <Alerte
          titre="Remplacer ta progression ?"
          message={`La sauvegarde (${resumeSauvegarde(aImporter)}) remplacera toute ta progression actuelle sur ce téléphone.`}
          onAnnuler={() => setAImporter(null)}
          actions={[
            { libelle: 'Annuler', role: 'annuler', action: () => setAImporter(null) },
            {
              libelle: 'Remplacer',
              role: 'destructif',
              action: () => {
                const s = aImporter
                setAImporter(null)
                void importer(s).then(
                  () => setMessage('Sauvegarde importée.'),
                  () => setMessage('L’import a échoué : ta progression n’a pas changé.'),
                )
              },
            },
          ]}
        />
      )}
      {message && <Alerte titre={message} onAnnuler={() => setMessage(null)} actions={[{ libelle: 'OK', action: () => setMessage(null) }]} />}
    </>
  )
}
