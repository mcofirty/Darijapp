import { Timer, Trophy, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sonReponse } from '../../audio/effets'
import type { Mot } from '../../data/types'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { lireProfil, modifierProfil } from '../../db/db'
import { DUREE_EXPRESS, apresExpress, questionExpress } from '../../exercices/quiz'
import type { Etape } from '../../exercices/session'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Tuile } from '../../ui/Liste'
import { Bilan } from '../session/Bilan'
import { Choix } from '../session/Choix'

interface Props {
  candidats: Mot[]
  tous: Mot[]
  onFermer: () => void
  onEncore: () => void
}

/** Délai pendant lequel la réponse reste affichée (vert ou rouge) avant la question suivante. */
const PAUSE_REPONSE = 450

/** Quiz express : 60 secondes pour enchaîner un maximum de bonnes réponses, sans bouton « Continuer ». */
export function Express({ candidats, tous, onFermer, onEncore }: Props) {
  const [question, setQuestion] = useState<Etape>(() => questionExpress(candidats, tous, null))
  const [numero, setNumero] = useState(0)
  const [bonnes, setBonnes] = useState(0)
  const [mauvaises, setMauvaises] = useState(0)
  const [restant, setRestant] = useState(DUREE_EXPRESS)
  const [confirmer, setConfirmer] = useState(false)
  const [fin, setFin] = useState<{ bilan: BilanSession; record: number; nouveauRecord: boolean } | null>(null)
  const fini = useRef(false)
  const score = useRef({ bonnes: 0, mauvaises: 0 })

  // Chrono calculé depuis l'heure de départ : il reste juste même si l'iPhone ralentit les minuteries.
  useEffect(() => {
    const depart = Date.now()
    const id = window.setInterval(() => {
      const reste = Math.max(0, DUREE_EXPRESS - (Date.now() - depart) / 1000)
      setRestant(reste)
      if (reste === 0) {
        window.clearInterval(id)
        void terminer()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [])

  async function terminer() {
    if (fini.current) return
    fini.current = true
    const { bonnes: b, mauvaises: m } = score.current
    const bilan = await enregistrerActivite('express', { bonnes: b, mauvaises: m })
    const resultat = apresExpress(b, (await lireProfil()).recordExpress)
    if (resultat.nouveauRecord) await modifierProfil({ recordExpress: resultat.record })
    setFin({ bilan, ...resultat })
  }

  function repondre(juste: boolean) {
    if (fini.current || question.type === 'paires' || question.type === 'decouverte') return
    sonReponse(juste)
    score.current[juste ? 'bonnes' : 'mauvaises']++
    if (juste) setBonnes((n) => n + 1)
    else setMauvaises((n) => n + 1)
    const precedent = question.mot.id
    window.setTimeout(() => {
      if (fini.current) return
      setQuestion(questionExpress(candidats, tous, precedent))
      setNumero((n) => n + 1)
    }, PAUSE_REPONSE)
  }

  if (fin)
    return (
      <Bilan
        titre={fin.nouveauRecord ? 'Nouveau record !' : 'Temps écoulé'}
        sousTitre={`${bonnes} bonne${bonnes > 1 ? 's' : ''} réponse${bonnes > 1 ? 's' : ''} en ${DUREE_EXPRESS} secondes`}
        xp={fin.bilan.xp}
        taux={bonnes + mauvaises > 0 ? bonnes / (bonnes + mauvaises) : undefined}
        lignes={
          <>
            <Ligne tuile={<Tuile icone={Zap} couleur="#ff9500" />} titre="Score" valeur={bonnes} />
            <Ligne tuile={<Tuile icone={Trophy} couleur="#ffcc00" />} titre="Record" valeur={fin.record} />
          </>
        }
        libelleEncore="Rejouer"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )

  const secondes = Math.ceil(restant)
  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="bord-flou visible absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge py-2">
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            aria-label="Quitter le Quiz express"
            className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          >
            <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          </button>
          <div className="verre verre-fin flex h-11 flex-1 items-center gap-3 rounded-full px-4">
            <Timer className={`h-5 w-5 shrink-0 ${secondes <= 10 ? 'text-rouge' : 'text-texte-2'}`} strokeWidth={2.4} aria-hidden />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
              <div
                className={`h-full rounded-full ${secondes <= 10 ? 'bg-rouge' : 'bg-accent'}`}
                style={{ width: `${(restant / DUREE_EXPRESS) * 100}%` }}
              />
            </div>
            <span className={`t-gras w-8 text-right tabular-nums ${secondes <= 10 ? 'text-rouge' : ''}`} role="timer" aria-label={`${secondes} secondes`}>
              {secondes}
            </span>
          </div>
          <div className="verre verre-fin t-gras flex h-11 shrink-0 items-center gap-1 rounded-full px-4 tabular-nums" aria-label={`Score : ${bonnes}`}>
            <Zap className="h-4 w-4 text-accent" strokeWidth={2.5} fill="currentColor" aria-hidden />
            {bonnes}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        {(question.type === 'ecoute' || question.type === 'traduis') && (
          <div key={numero} className="entree-droite">
            <Choix type={question.type} mot={question.mot} choix={question.choix} onRepondu={repondre} />
          </div>
        )}
      </div>

      {confirmer && (
        <Alerte
          titre="Quitter le Quiz express ?"
          message="Ce score ne sera pas compté."
          onAnnuler={() => setConfirmer(false)}
          actions={[
            { libelle: 'Continuer', role: 'annuler', action: () => setConfirmer(false) },
            { libelle: 'Quitter', role: 'destructif', action: onFermer },
          ]}
        />
      )}
    </div>
  )
}
