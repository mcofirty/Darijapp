import { Trophy, VolumeX } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Etape } from '../../exercices/session'
import { useModes, useProfil } from '../../db/useProfil'
import { TOUS_LES_MODES } from '../../exercices/modes'
import { Bouton } from '../../ui/Boutons'
import { Page } from '../../ui/Page'
import { Session } from '../session/Session'
import { Chrono, type JeuChrono } from './Chrono'
import { Marchandage } from './Marchandage'
import { Taxi } from './Taxi'
import { preparerExpress, preparerQuiz, questionSons } from './lancer'
import { BandeZellige, useZellige } from '../../ui/zellige'

type EnCours =
  | { type: 'quiz'; etapes: Etape[]; numero: number }
  | { type: 'chrono'; jeu: JeuChrono; prochaine: (precedente: Etape | null) => Etape; numero: number }
  | { type: 'marchandage' | 'taxi'; numero: number }

/** Sans écoute, les jeux qui se jouent à l'oreille restent visibles mais ne se lancent pas. */
function DemandeDEcouter() {
  return (
    <p className="t-sous-titre mt-3 flex items-center gap-1.5 text-texte-2">
      <VolumeX className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
      Demande d’écouter : exercices d’écoute coupés (Profil).
    </p>
  )
}

function Carte({ surtitre, titre, texte, record, children }: { surtitre: string; titre: string; texte: string; record?: string; children: ReactNode }) {
  const zellige = useZellige()
  return (
    <section className="mb-[26px] overflow-hidden rounded-carte bg-carte p-marge">
      <BandeZellige z={zellige} className="-mx-marge -mt-marge mb-marge h-8" />
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

/** Onglet Quiz : quiz de 5 questions, jeux contre la montre (Quiz express, Chasse aux sons) et mini-jeux (souk, taxi). */
export function Quiz() {
  const [enCours, setEnCours] = useState<EnCours | null>(null)
  const { recordExpress, recordSons } = useProfil()
  const modes = useModes() ?? TOUS_LES_MODES
  const sourd = !modes.ecouter

  async function lancerQuiz() {
    const etapes = await preparerQuiz(modes)
    setEnCours((e) => ({ type: 'quiz', etapes, numero: (e?.numero ?? 0) + 1 }))
  }

  async function lancerChrono(jeu: JeuChrono) {
    const prochaine = jeu === 'express' ? await preparerExpress(modes) : questionSons
    setEnCours((e) => ({ type: 'chrono', jeu, prochaine, numero: (e?.numero ?? 0) + 1 }))
  }

  if (enCours?.type === 'quiz')
    return (
      <Session
        key={enCours.numero}
        etapes={enCours.etapes}
        nouveaux={0}
        entrainement
        activite="quiz"
        onFermer={() => setEnCours(null)}
        onEncore={() => void lancerQuiz()}
      />
    )

  const rejouer = (type: 'marchandage' | 'taxi') => setEnCours((e) => ({ type, numero: (e?.numero ?? 0) + 1 }))
  if (enCours?.type === 'marchandage')
    return <Marchandage key={enCours.numero} onFermer={() => setEnCours(null)} onEncore={() => rejouer('marchandage')} />
  if (enCours?.type === 'taxi') return <Taxi key={enCours.numero} onFermer={() => setEnCours(null)} onEncore={() => rejouer('taxi')} />

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
    <Page zellige titre="Quiz">
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
        {sourd && <DemandeDEcouter />}
        <Bouton grand variante="teinte" className="mt-4 w-full" disabled={sourd} onClick={() => void lancerChrono('sons')}>
          Lancer la chasse
        </Bouton>
      </Carte>
      <Carte
        surtitre="Mini-jeu · chiffres et prix"
        titre="Marchandage au souk"
        texte="Le marchand annonce ses prix en darija : comprends-les, dis que c’est trop cher et repars avec une bonne affaire."
      >
        {sourd && <DemandeDEcouter />}
        <Bouton grand variante="teinte" className="mt-4 w-full" disabled={sourd} onClick={() => rejouer('marchandage')}>
          Aller au souk
        </Bouton>
      </Carte>

      <Carte
        surtitre="Mini-jeu · directions"
        titre="Le taxi"
        texte="Tu conduis : le passager te guide en darija (à droite, à gauche, tout droit, arrête-toi). Choisis la bonne direction."
      >
        {sourd && <DemandeDEcouter />}
        <Bouton grand variante="teinte" className="mt-4 w-full" disabled={sourd} onClick={() => rejouer('taxi')}>
          Prendre le volant
        </Bouton>
      </Carte>
    </Page>
  )
}
