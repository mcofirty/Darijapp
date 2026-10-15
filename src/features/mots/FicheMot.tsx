import { useLiveQuery } from 'dexie-react-hooks'
import { Flag, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { jouerAuto } from '../../audio/lecteur'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { db, type MotifSignalement } from '../../db/db'
import { changerFavori, signaler, useMarques } from '../../db/marques'
import { useProfil } from '../../db/useProfil'
import { MOTIFS } from '../../exercices/selections'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { ForceMot } from '../../ui/ForceMot'
import { PhraseTouchable } from '../../ui/PhraseTouchable'
import { Page } from '../../ui/Page'
import { BoutonAudio } from './BoutonAudio'

interface Props {
  mot: Mot
  retour: { libelle: string; action: () => void }
}

export function FicheMot({ mot, retour }: Props) {
  const { afficherArabe } = useProfil()
  const sons = sonsDuMot(mot.latin)
  const marque = useMarques().get(mot.id)
  const progression = useLiveQuery(() => db.progression.get(mot.id), [mot.id])
  const [choixMotif, setChoixMotif] = useState(false)

  // Lecture automatique à l'ouverture (l'ouverture vient d'un toucher, ce qu'exige iOS).
  useEffect(() => {
    window.scrollTo(0, 0)
    jouerAuto(mot.audio, mot.arabe)
  }, [mot])

  return (
    <Page titre={mot.latin} retour={retour}>
      <div className="mb-[26px] overflow-hidden rounded-liste bg-carte px-marge py-6 text-center">
        {afficherArabe && (
          <p className="arabe text-[2.4rem] leading-tight" dir="rtl" lang="ar">
            {mot.arabe}
          </p>
        )}
        <p className="t-titre-3 mt-2 text-texte-2">{mot.fr}</p>
        <p className="t-sous-titre mt-2 flex items-center justify-center gap-2 text-texte-2">
          <ForceMot boite={progression?.boite ?? 0} grande />
          {progression ? `Force ${progression.boite} sur 4 · revient le ${dateCourte(progression.prochaineRevision)}` : 'Pas encore appris'}
        </p>
        {mot.note && <p className="t-sous-titre mt-1 italic text-texte-2">{mot.note}</p>}
        <div className="mt-6 flex gap-3">
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" grand />
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" grand />
        </div>
      </div>

      {(mot.prononciation || sons.length > 0) && (
      <Section titre="Prononciation">
        {mot.prononciation && <div className="t-corps px-marge py-3">{mot.prononciation}</div>}
        {sons.map((s) => (
          <Ligne key={s.latin} tuile={<Tuile couleur="#af52de" texte={s.latin} />} titre={`${s.latin} · ${s.arabe}`} sousTitre={s.explication} />
        ))}
      </Section>
      )}

      {mot.exemple.latin && (
      <Section titre="Exemple">
        <Ligne
          titre={<PhraseTouchable latin={mot.exemple.latin} className="font-semibold" />}
          sousTitre={
            <>
              {afficherArabe && (
                <span className="arabe t-corps block text-texte" dir="rtl" lang="ar">
                  {mot.exemple.arabe}
                </span>
              )}
              {mot.exemple.fr}
            </>
          }
          fin={<BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} libelle="" />}
        />
        <Ligne
          titre="Écouter au ralenti"
          fin={<BoutonAudio chemin={mot.exemple.audio} arabe={mot.exemple.arabe} vitesse={0.75} libelle="" />}
        />
      </Section>
      )}

      <Section note={marque?.signale ? 'Merci : retrouve tes signalements dans Profil, pour me les transmettre.' : undefined}>
        <Ligne
          tuile={<Tuile icone={Star} couleur="#ffcc00" />}
          titre={marque?.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => void changerFavori(mot.id, !marque?.favori)}
        />
        <Ligne
          tuile={<Tuile icone={Flag} couleur="#ff9500" />}
          titre={marque?.signale ? 'Retirer le signalement' : 'Signaler une erreur'}
          sousTitre={marque?.signale ? `À vérifier : ${MOTIFS[marque.signale]}` : undefined}
          onClick={() => (marque?.signale ? void signaler(mot.id, null) : setChoixMotif(true))}
        />
      </Section>

      {choixMotif && (
        <Alerte
          titre="Qu’est-ce qui ne va pas ?"
          message={`${mot.latin} · ${mot.fr}`}
          onAnnuler={() => setChoixMotif(false)}
          actions={[
            ...(Object.keys(MOTIFS) as MotifSignalement[]).map((motif) => ({
              libelle: MOTIFS[motif].replace(/^./, (c) => c.toUpperCase()),
              role: 'choix' as const,
              action: () => {
                void signaler(mot.id, motif)
                setChoixMotif(false)
              },
            })),
            { libelle: 'Annuler', role: 'annuler' as const, action: () => setChoixMotif(false) },
          ]}
        />
      )}
    </Page>
  )
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** « 18 oct. » à partir de « 2026-10-18 ». */
function dateCourte(date: string): string {
  const [, m, j] = date.split('-').map(Number)
  return `${j} ${MOIS_COURTS[m - 1]}`
}
