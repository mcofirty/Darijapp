import { useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { CircleCheck, CircleX, X } from 'lucide-react'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { enregistrerActivite, enregistrerSession, type BilanSession } from '../../db/apprentissage'
import { Resultats, etapeARefaire, type Etape } from '../../exercices/session'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Bilan } from './Bilan'
import { Choix } from './Choix'
import { Construis } from './Construis'
import { Decouverte } from './Decouverte'
import { DisLe, type ResultatDire } from './DisLe'
import { Distingue } from './Distingue'
import { Paires } from './Paires'

interface Props {
  etapes: Etape[]
  nouveaux: number
  entrainement: boolean
  /** Quiz : pas de question refaite, pas de répétition espacée, bilan « Quiz terminé ». */
  quiz?: boolean
  onFermer: () => void
  onEncore: () => void
}

/** Ce qui est rejoué et montré après une réponse : un mot du programme ou un mot d'une paire de sons. */
type Reponse = Pick<Mot, 'latin' | 'arabe' | 'fr' | 'audio'>
type Retour = { juste: true } | { juste: false; mot: Reponse }

/** Session plein écran : une étape à la fois, retour immédiat, étapes ratées refaites à la fin. */
export function Session({ etapes: depart, nouveaux, entrainement, quiz = false, onFermer, onEncore }: Props) {
  const [etapes, setEtapes] = useState(depart)
  const [index, setIndex] = useState(0)
  const [retour, setRetour] = useState<Retour | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  // Dis-le : résultat affiché, validé par « Continuer ».
  const [dire, setDire] = useState<ResultatDire | null>(null)
  const resultats = useRef(new Resultats())
  // Quiz : chaque question compte une fois (les paires sont justes sans aucune erreur).
  const questions = useRef({ justes: 0, total: 0, erreurPaires: false })
  const MOTS = useMots()
  const etape = etapes[index]

  function compterQuestion(juste: boolean) {
    questions.current.total++
    if (juste) questions.current.justes++
  }

  /** `motId` : null pour une réponse hors programme (Distingue les sons), qui ne touche pas la répétition espacée. */
  function repondre(juste: boolean, mot: Reponse, motId: string | null) {
    if (motId) resultats.current.noter(motId, juste)
    else resultats.current.compter(juste)
    compterQuestion(juste)
    sonReponse(juste)
    setTimeout(() => jouer(mot.audio, mot.arabe), 350)
    if (!juste && !quiz) {
      const refaire = etapeARefaire(etape, MOTS)
      if (refaire) setEtapes((e) => [...e, refaire])
    }
    setRetour(juste ? { juste: true } : { juste: false, mot })
  }

  /** Dis-le validé : compté comme les autres réponses, sans retour en plus (le score est déjà affiché). */
  function valider(mot: Mot, r: ResultatDire) {
    resultats.current.noter(mot.id, r.juste)
    if (r.score !== null) resultats.current.noterScore(mot.id, r.score)
    compterQuestion(r.juste)
    sonReponse(r.juste)
    void suivant()
  }

  async function suivant() {
    setRetour(null)
    setDire(null)
    if (index + 1 < etapes.length) {
      setIndex(index + 1)
      return
    }
    const r = resultats.current
    const q = questions.current
    setBilan(
      quiz
        ? await enregistrerActivite('quiz', { bonnes: q.justes, mauvaises: q.total - q.justes })
        : await enregistrerSession(r.parMot(), { bonnes: r.bonnes, mauvaises: r.mauvaises, nouveaux, entrainement, scores: r.scores }),
    )
  }

  if (bilan) {
    const r = resultats.current
    const q = questions.current
    return quiz ? (
      <Bilan
        titre={q.justes === q.total ? 'Sans faute !' : 'Quiz terminé'}
        sousTitre={`${q.justes} bonne${q.justes > 1 ? 's' : ''} réponse${q.justes > 1 ? 's' : ''} sur ${q.total}`}
        xp={bilan.xp}
        activite={bilan}
        taux={q.total > 0 ? q.justes / q.total : 1}
        libelleEncore="Nouveau quiz"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    ) : (
      <Bilan
        titre="Session terminée"
        sousTitre={
          bilan.nouveaux > 0
            ? `${bilan.nouveaux} nouveau${bilan.nouveaux > 1 ? 'x' : ''} mot${bilan.nouveaux > 1 ? 's' : ''} appris`
            : 'Révision terminée'
        }
        xp={bilan.xp}
        activite={bilan}
        taux={r.taux}
        libelleEncore="Encore une session"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )
  }

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      {/* Barre du haut en verre, au-dessus du contenu qui défile dessous (bord flou d'iOS 26). */}
      <div className="bord-flou visible absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge py-2">
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            aria-label={quiz ? 'Quitter le quiz' : 'Quitter la session'}
            className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          >
            <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          </button>
          <div className="verre verre-fin flex h-11 flex-1 items-center rounded-full px-4">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-remplissage"
              role="progressbar"
              aria-valuenow={index}
              aria-valuemax={etapes.length}
              aria-label="Progression de la session"
            >
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(index / etapes.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        <div key={index} className="entree-droite">
          {etape.type === 'decouverte' && <Decouverte mot={etape.mot} />}
          {(etape.type === 'ecoute' || etape.type === 'traduis') && (
            <Choix type={etape.type} mot={etape.mot} choix={etape.choix} onRepondu={(j) => repondre(j, etape.mot, etape.mot.id)} />
          )}
          {etape.type === 'distingue' && (
            <Distingue paire={etape.paire} cible={etape.cible} onRepondu={(j) => repondre(j, etape.cible, null)} />
          )}
          {etape.type === 'disle' && (
            <DisLe mot={etape.mot} inverse={etape.inverse} onPret={setDire} onRepondu={(r) => valider(etape.mot, r)} />
          )}
          {etape.type === 'phrase' && (
            <Construis mot={etape.mot} morceaux={etape.morceaux} onRepondu={(j) => repondre(j, etape.mot.exemple, etape.mot.id)} />
          )}
          {etape.type === 'paires' && (
            <Paires
              mots={etape.mots}
              onErreur={(id) => {
                resultats.current.noter(id, false)
                questions.current.erreurPaires = true
              }}
              onTermine={() => {
                etape.mots.forEach((m) => resultats.current.noter(m.id, true))
                compterQuestion(!questions.current.erreurPaires)
                questions.current.erreurPaires = false
                setRetour({ juste: true })
              }}
            />
          )}
        </div>
      </div>

      {(retour !== null || etape.type === 'decouverte' || (etape.type === 'disle' && dire)) && (
        <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {/* Panneau de commandes en Liquid Glass : il s'ouvre pour donner le résultat. */}
          <div className="verre mx-auto max-w-xl rounded-panneau p-3">
            <div className={`deplier ${retour ? 'ouvert' : ''}`} aria-live="polite">
              <div>
                {retour?.juste === true && (
                  <p className="t-titre-3 flex items-center gap-2 px-2 pb-3 pt-1 text-vert">
                    <CircleCheck className="h-6 w-6" strokeWidth={2.5} aria-hidden /> Bravo !
                  </p>
                )}
                {retour?.juste === false && (
                  <div className="px-2 pb-3 pt-1 text-rouge">
                    <p className="t-titre-3 flex items-center gap-2">
                      <CircleX className="h-6 w-6" strokeWidth={2.5} aria-hidden /> Bonne réponse :
                    </p>
                    <p className="t-corps mt-1 text-texte">
                      <span className="font-semibold">{retour.mot.latin}</span> = {retour.mot.fr}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Bouton
              grand
              className={`w-full ${retour?.juste || dire?.juste ? '!bg-vert-plein' : ''}`}
              onClick={() => (etape.type === 'disle' && dire ? valider(etape.mot, dire) : void suivant())}
            >
              Continuer
            </Bouton>
          </div>
        </div>
      )}

      {confirmer && (
        <Alerte
          titre={quiz ? 'Quitter le quiz ?' : 'Quitter la session ?'}
          message={quiz ? 'Ce quiz ne sera pas compté.' : 'Les réponses de cette session ne seront pas enregistrées.'}
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
