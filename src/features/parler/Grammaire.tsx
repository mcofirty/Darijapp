import { BookOpenText } from 'lucide-react'
import { useState } from 'react'
import { useProfil } from '../../db/useProfil'
import { LECONS_GRAMMAIRE, QUESTIONS_PAR_LECON, composerLecon, type FormeGrammaire, type LeconGrammaire } from '../../exercices/grammaire'
import type { Etape } from '../../exercices/session'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { BoutonAudio } from '../mots/BoutonAudio'
import { Session } from '../session/Session'

/** Couleurs des tuiles des leçons, dans l'ordre. */
const COULEURS = ['#ff3b30', '#ff9500', '#34c759', '#007aff', '#5856d6', '#af52de']

/** Grammaire orale : 6 fiches courtes (règle, formes à écouter), chacune avec 5 questions. */
export function Grammaire({ onRetour }: { onRetour: () => void }) {
  const [lecon, setLecon] = useState<LeconGrammaire | null>(null)
  const [entrainement, setEntrainement] = useState<{ etapes: Etape[]; numero: number } | null>(null)

  function ouvrir(l: LeconGrammaire | null) {
    setLecon(l)
    window.scrollTo(0, 0)
  }

  function sEntrainer(l: LeconGrammaire) {
    setEntrainement((e) => ({ etapes: composerLecon(l), numero: (e?.numero ?? 0) + 1 }))
  }

  if (lecon && entrainement)
    return (
      <Session
        key={entrainement.numero}
        etapes={entrainement.etapes}
        nouveaux={0}
        entrainement
        activite="grammaire"
        onFermer={() => setEntrainement(null)}
        onEncore={() => sEntrainer(lecon)}
      />
    )

  if (lecon) return <FicheGrammaire lecon={lecon} onRetour={() => ouvrir(null)} onEntrainer={() => sEntrainer(lecon)} />

  return (
    <Page titre="Grammaire orale" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <Section note="Juste ce qu’il faut pour faire des phrases : chaque fiche se lit en une minute, puis 5 questions pour s’entraîner.">
        {LECONS_GRAMMAIRE.map((l, i) => (
          <Ligne
            key={l.id}
            tuile={<Tuile icone={BookOpenText} couleur={COULEURS[i % COULEURS.length]} />}
            titre={l.titre}
            sousTitre={l.sousTitre}
            chevron
            onClick={() => ouvrir(l)}
          />
        ))}
      </Section>
    </Page>
  )
}

function FicheGrammaire({ lecon, onRetour, onEntrainer }: { lecon: LeconGrammaire; onRetour: () => void; onEntrainer: () => void }) {
  return (
    <Page titre={lecon.titre} retour={{ libelle: 'Grammaire', action: onRetour }}>
      <Section titre="La règle">
        <div className="space-y-3 px-marge py-4">
          {lecon.regle.map((p) => (
            <p key={p} className="t-corps">
              {p}
            </p>
          ))}
        </div>
      </Section>
      <Section titre="À écouter et répéter">
        {lecon.formes.map((f) => (
          <LigneForme key={f.id} forme={f} />
        ))}
      </Section>
      <Bouton grand className="mb-[26px] w-full" onClick={onEntrainer}>
        S’entraîner ({QUESTIONS_PAR_LECON} questions)
      </Bouton>
    </Page>
  )
}

function LigneForme({ forme }: { forme: FormeGrammaire }) {
  const { afficherArabe } = useProfil()
  return (
    <Ligne
      titre={
        <span className="block">
          <span className="block font-semibold">{forme.latin}</span>
          {afficherArabe && (
            <span className="arabe block text-left text-[1.15rem] text-texte-2" dir="rtl" lang="ar">
              {forme.arabe}
            </span>
          )}
        </span>
      }
      sousTitre={forme.fr}
      fin={<BoutonAudio chemin={forme.audio} arabe={forme.arabe} libelle="" />}
    />
  )
}
