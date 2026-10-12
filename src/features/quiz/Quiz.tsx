import { Trophy } from 'lucide-react'
import { useState } from 'react'
import type { Mot } from '../../data/types'
import type { Etape } from '../../exercices/session'
import { useProfil } from '../../db/useProfil'
import { Bouton } from '../../ui/Boutons'
import { Page } from '../../ui/Page'
import { Session } from '../session/Session'
import { Express } from './Express'
import { preparerExpress, preparerQuiz } from './lancer'

type EnCours =
  | { type: 'quiz'; etapes: Etape[]; numero: number }
  | { type: 'express'; candidats: Mot[]; tous: Mot[]; numero: number }

/** Onglet Quiz : quiz de 5 questions et Quiz express de 60 secondes. */
export function Quiz() {
  const [enCours, setEnCours] = useState<EnCours | null>(null)
  const { recordExpress } = useProfil()

  async function lancerQuiz() {
    const etapes = await preparerQuiz()
    setEnCours((e) => ({ type: 'quiz', etapes, numero: (e?.numero ?? 0) + 1 }))
  }

  async function lancerExpress() {
    const mots = await preparerExpress()
    setEnCours((e) => ({ type: 'express', ...mots, numero: (e?.numero ?? 0) + 1 }))
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

  if (enCours?.type === 'express')
    return (
      <Express
        key={enCours.numero}
        candidats={enCours.candidats}
        tous={enCours.tous}
        onFermer={() => setEnCours(null)}
        onEncore={() => void lancerExpress()}
      />
    )

  return (
    <Page titre="Quiz">
      <section className="mb-[26px] rounded-carte bg-carte p-marge">
        <p className="t-note font-semibold uppercase text-accent">5 questions</p>
        <h2 className="t-titre-2 mt-1">Contrôle tes acquis</h2>
        <p className="t-sous-titre mt-1 text-texte-2">
          Écoute, traduction et paires, sur les mots que tu connais le moins bien. Tes révisions ne changent pas.
        </p>
        <Bouton grand className="mt-4 w-full" onClick={() => void lancerQuiz()}>
          Commencer le quiz
        </Bouton>
      </section>

      <section className="mb-[26px] rounded-carte bg-carte p-marge">
        <p className="t-note font-semibold uppercase text-accent">60 secondes</p>
        <h2 className="t-titre-2 mt-1">Quiz express</h2>
        <p className="t-sous-titre mt-1 text-texte-2">Un maximum de bonnes réponses avant la fin du chrono.</p>
        <p className="t-appel mt-3 flex items-center gap-1.5 font-semibold">
          <Trophy className="h-4 w-4 text-[#ff9500]" strokeWidth={2.5} aria-hidden />
          {recordExpress > 0 ? `Record : ${recordExpress} bonne${recordExpress > 1 ? 's' : ''} réponse${recordExpress > 1 ? 's' : ''}` : 'Pas encore de record'}
        </p>
        <Bouton grand variante="teinte" className="mt-4 w-full" onClick={() => void lancerExpress()}>
          Lancer le chrono
        </Bouton>
      </section>
    </Page>
  )
}
