import { BellRing, Download, ShieldCheck, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { choisirFichier, donnerFichier } from '../../app/fichiers'
import { stockagePersistant } from '../../app/stockage'
import { modifierProfil } from '../../db/db'
import { importer } from '../../db/sauvegarde'
import { useProfil } from '../../db/useProfil'
import { fichierIcs } from '../../sauvegarde/rappel'
import { ageSauvegarde, lireSauvegarde, resumeSauvegarde, type Sauvegarde } from '../../sauvegarde/sauvegarde'
import { dateLocale } from '../../srs/dates'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { sauvegarderProgression } from './sauvegarder'

const ADRESSE = 'https://mcofirty.github.io/Darijapp/'

/** Rappel quotidien (.ics pour Calendrier) et sauvegarde de la progression (export / import). */
export function RappelEtSauvegarde() {
  const { heureRappel, derniereSauvegarde } = useProfil()
  const [aImporter, setAImporter] = useState<Sauvegarde | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [protege, setProtege] = useState<boolean | null>(null)
  useEffect(() => {
    void stockagePersistant().then(setProtege)
  }, [])

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
        note="Ta progression reste sur ce téléphone. Exporte-la dans Fichiers (iCloud Drive) : tu pourras la réimporter si les données de l’appli sont effacées, ou sur un autre appareil. Le bilan te le rappelle tous les 7 jours."
      >
        {protege !== null && (
          <Ligne
            tuile={<Tuile icone={ShieldCheck} couleur={protege ? '#34c759' : '#8e8e93'} />}
            titre="Données protégées"
            sousTitre={protege ? 'L’iPhone ne les effacera pas pour faire de la place' : 'L’iPhone pourrait les effacer : exporte-les régulièrement'}
            valeur={protege ? 'Oui' : 'Non'}
          />
        )}
        <Ligne
          tuile={<Tuile icone={Download} couleur="#007aff" />}
          titre="Exporter ma progression"
          sousTitre={ageSauvegarde(derniereSauvegarde, Date.now())}
          chevron
          onClick={() => void sauvegarderProgression()}
        />
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
