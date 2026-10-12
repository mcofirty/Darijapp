import { Trophy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Etape } from '../../exercices/session'
import { useProfil } from '../../db/useProfil'
import { Bouton } from '../../ui/Boutons'
import { Page } from '../../ui/Page'
import { Session } from '../session/Session'
import { Chrono, type JeuChrono } from './Chrono'
import { preparerExpress, preparerQuiz, questionSons } from './lancer'

type EnCours =
  | { type: 'quiz'; etapes: Etape[]; numero: number }
  | { type: 'chrono'; jeu: JeuChrono; prochaine: (precedente: Etape | null) => Etape; numero: number }

function Carte({ surtitre, titre, texte, record, children }: { surtitre: string; titre: string; texte: string; record?: string; children: ReactNode }) {
  return (
    <section className="mb-[26px] rounded-carte bg-carte p-marge">
      <p className="t-note font-semibold uppercase text-accent">{surtitre}</p>
      <h2 className="t-titre-2 mt-1">{titre}</h2>
      <p className="t-sous-titre mt-1 text-texte-2">{texte}</p>
      {record !== undefined && (
        <p className="t-appel mt-3 flex items-center gap-1.5 font-semibold">
          <Trophy className="h-4 w-4 text-[#ff9500]" strokeWidth={2.5} aria-hidden />
          {record}
        </p>
      )}
      {children}
    </section>
  )
}

/** Onglet Quiz : quiz de 5 questions, Quiz express et Chasse aux sons (60 secondes chacun). */
export function Quiz() {
  const [enCours, setEnCours] = useState<EnCours | null>(null)
  const { recordExpress, recordSons } = useProfil()

  async function lancerQuiz() {
    const etapes = await preparerQuiz()
    setEnCours((e) => ({ type: 'quiz', etapes, numero: (e?.numero ?? 0) + 1 }))
  }

  async function lancerChrono(jeu: JeuChrono) {
    const prochaine = jeu === 'express' ? await preparerExpress() : questionSons
    setEnCours((e) => ({ type: 'chrono', jeu, prochaine, numero: (e?.numero ?? 0) + 1 }))
  }

  if (enCours?.type === 'quiz')
    return (
      <Session
        key={enCours.numero}
        etapes={enCours.etapes}
        nouveaux={0}
        entrainement
        quiz
        onFermer={() => setEnCours(null)}
        onEncore={() => void lancerQuiz()}
      />
    )

  if (enCours?.type === 'chrono')
    return (
      <Chrono
        key={enCours.numero}
        jeu={enCours.jeu}
        prochaine={enCours.prochaine}
        onFermer={() => setEnCours(null)}
        onEncore={() => void lancerChrono(enCours.jeu)}
      />
    )

  return (
    <Page titre="Quiz">
      <Carte
        surtitre="5 questions"
        titre="Contrôle tes acquis"
        texte="Écoute, traduction, sons et paires, sur les mots que tu connais le moins bien. Tes révisions ne changent pas."
      >
        <Bouton grand className="mt-4 w-full" onClick={() => void lancerQuiz()}>
          Commencer le quiz
        </Bouton>
      </Carte>

      <Carte
        surtitre="60 secondes"
        titre="Quiz express"
        texte="Un maximum de bonnes réponses avant la fin du chrono."
        record={
          recordExpress > 0
            ? `Record : ${recordExpress} bonne${recordExpress > 1 ? 's' : ''} réponse${recordExpress > 1 ? 's' : ''}`
            : 'Pas encore de record'
        }
      >
        <Bouton grand variante="teinte" className="mt-4 w-full" onClick={() => void lancerChrono('express')}>
          Lancer le chrono
        </Bouton>
      </Carte>

      <Carte
        surtitre="60 secondes · sons"
        titre="Chasse aux sons"
        texte="9elb ou kelb ? 7al ou khal ? Écoute et choisis le bon mot. À partir de 5 bonnes réponses d'affilée, chacune vaut 2 points."
        record={recordSons > 0 ? `Record : ${recordSons} point${recordSons > 1 ? 's' : ''}` : 'Pas encore de record'}
      >
        <Bouton grand variante="teinte" className="mt-4 w-full" onClick={() => void lancerChrono('sons')}>
          Lancer la chasse
        </Bouton>
      </Carte>
    </Page>
  )
}
