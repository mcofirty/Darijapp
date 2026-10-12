import { Flame, Timer, Trophy, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sonReponse } from '../../audio/effets'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { lireProfil, modifierProfil } from '../../db/db'
import { DUREE_EXPRESS, apresExpress, pointsDeReponse } from '../../exercices/quiz'
import type { Etape } from '../../exercices/session'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Tuile } from '../../ui/Liste'
import { Bilan } from '../session/Bilan'
import { Choix } from '../session/Choix'
import { Distingue } from '../session/Distingue'

/** Jeux contre la montre : Quiz express (vocabulaire) et Chasse aux sons (Distingue les sons, avec combo). */
export type JeuChrono = 'express' | 'sons'

const JEUX: Record<JeuChrono, { nom: string; record: 'recordExpress' | 'recordSons'; combo: boolean }> = {
  express: { nom: 'le Quiz express', record: 'recordExpress', combo: false },
  sons: { nom: 'la Chasse aux sons', record: 'recordSons', combo: true },
}

interface Props {
  jeu: JeuChrono
  /** Question suivante, différente de la précédente. */
  prochaine: (precedente: Etape | null) => Etape
  onFermer: () => void
  onEncore: () => void
}

/** Délai pendant lequel la réponse reste affichée (vert ou rouge) avant la question suivante. */
const PAUSE_REPONSE = 450

/** 60 secondes pour enchaîner un maximum de bonnes réponses, sans bouton « Continuer ». */
export function Chrono({ jeu, prochaine, onFermer, onEncore }: Props) {
  const { nom, record: champRecord, combo: avecCombo } = JEUX[jeu]
  const [question, setQuestion] = useState<Etape>(() => prochaine(null))
  const [numero, setNumero] = useState(0)
  const [bonnes, setBonnes] = useState(0)
  const [mauvaises, setMauvaises] = useState(0)
  const [points, setPoints] = useState(0)
  const [combo, setCombo] = useState(0)
  const [restant, setRestant] = useState(DUREE_EXPRESS)
  const [confirmer, setConfirmer] = useState(false)
  const [fin, setFin] = useState<{ bilan: BilanSession; record: number; nouveauRecord: boolean } | null>(null)
  const fini = useRef(false)
  const score = useRef({ bonnes: 0, mauvaises: 0, points: 0, combo: 0 })

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
    const { bonnes: b, mauvaises: m, points: pts } = score.current
    const bilan = await enregistrerActivite(jeu, { bonnes: b, mauvaises: m })
    const resultat = apresExpress(pts, (await lireProfil())[champRecord])
    if (resultat.nouveauRecord) await modifierProfil({ [champRecord]: resultat.record })
    setFin({ bilan, ...resultat })
  }

  function repondre(juste: boolean) {
    if (fini.current) return
    sonReponse(juste)
    const s = score.current
    s[juste ? 'bonnes' : 'mauvaises']++
    s.combo = juste ? s.combo + 1 : 0
    s.points += juste ? pointsDeReponse(avecCombo ? s.combo : 0) : 0
    setBonnes(s.bonnes)
    setMauvaises(s.mauvaises)
    setPoints(s.points)
    setCombo(s.combo)
    const precedente = question
    window.setTimeout(() => {
      if (fini.current) return
      setQuestion(prochaine(precedente))
      setNumero((n) => n + 1)
    }, PAUSE_REPONSE)
  }

  if (fin)
    return (
      <Bilan
        titre={fin.nouveauRecord ? 'Nouveau record !' : 'Temps écoulé'}
        sousTitre={`${bonnes} bonne${bonnes > 1 ? 's' : ''} réponse${bonnes > 1 ? 's' : ''} en ${DUREE_EXPRESS} secondes${
          avecCombo && points > bonnes ? `, ${points} points avec les combos` : ''
        }`}
        xp={fin.bilan.xp}
        taux={bonnes + mauvaises > 0 ? bonnes / (bonnes + mauvaises) : undefined}
        lignes={
          <>
            <Ligne tuile={<Tuile icone={Zap} couleur="#ff9500" />} titre="Score" valeur={points} />
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
            aria-label={`Quitter ${nom}`}
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
          <div className="verre verre-fin t-gras flex h-11 shrink-0 items-center gap-1 rounded-full px-4 tabular-nums" aria-label={`Score : ${points}`}>
            <Zap className="h-4 w-4 text-accent" strokeWidth={2.5} fill="currentColor" aria-hidden />
            {points}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        {avecCombo && combo >= 2 && (
          <p className="t-appel mb-3 flex items-center gap-1.5 font-semibold text-accent" aria-live="polite">
            <Flame className="h-4 w-4" strokeWidth={2.5} fill="currentColor" aria-hidden />
            {combo} d'affilée{pointsDeReponse(combo + 1) > 1 ? ' · chaque bonne réponse vaut 2 points' : ''}
          </p>
        )}
        <div key={numero} className="entree-droite">
          {(question.type === 'ecoute' || question.type === 'traduis') && (
            <Choix type={question.type} mot={question.mot} choix={question.choix} onRepondu={repondre} />
          )}
          {question.type === 'distingue' && <Distingue paire={question.paire} cible={question.cible} onRepondu={repondre} />}
        </div>
      </div>

      {confirmer && (
        <Alerte
          titre={`Quitter ${nom} ?`}
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
