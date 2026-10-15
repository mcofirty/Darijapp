import { useRef, useState } from 'react'
import { Combo } from '../../gamification/combo'
import { jouerAuto } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { CircleCheck, CircleX, Flame, X } from 'lucide-react'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { enregistrerActivite, enregistrerSession, type BilanSession } from '../../db/apprentissage'
import { couperUnMoment } from '../../db/db'
import { useModes } from '../../db/useProfil'
import { adapterEtapes, type Modes } from '../../exercices/modes'
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
import { Trou } from './Trou'
import { ModeLegendaire } from '../../ui/legendaire'
import { PhraseTouchable } from '../../ui/PhraseTouchable'
import { RemplissageBarre } from '../../ui/zellige'
import { Mascotte, PhraseDeMascotte } from '../../ui/Mascotte'

interface Props {
  etapes: Etape[]
  nouveaux: number
  entrainement: boolean
  /**
   * Quiz ou leçon de grammaire : pas de question refaite, pas de répétition espacée,
   * l'activité est enregistrée comme telle avec son propre bilan.
   */
  activite?: 'quiz' | 'grammaire'
  /** Épreuve légendaire : pas de ralenti ni d'indice. */
  legendaire?: boolean
  /** Titre du bilan d'un quiz (épreuves du Parcours, test de niveau). */
  titreBilan?: (justes: number, total: number) => string
  /** Résultat d'un quiz, une fois enregistré. */
  onResultat?: (justes: number, total: number) => void
  onFermer: () => void
  onEncore: () => void
}

/** Ce qui est rejoué et montré après une réponse : un mot du programme ou un mot d'une paire de sons. */
type Reponse = Pick<Mot, 'latin' | 'arabe' | 'fr' | 'audio'>
type Retour = { juste: true } | { juste: false; mot: Reponse }

/** Session plein écran : une étape à la fois, retour immédiat, étapes ratées refaites à la fin. */
export function Session(props: Props) {
  // Les étapes sont adaptées aux modes (sans parler, sans écouter) : on attend la lecture du profil.
  const modes = useModes()
  if (!modes) return <div data-sans-balayage className="fixed inset-0 z-30 bg-fond" />
  return <SessionEnCours {...props} modesDepart={modes} />
}

function SessionEnCours({ etapes: depart, nouveaux, entrainement, activite, legendaire = false, titreBilan, onResultat, onFermer, onEncore, modesDepart }: Props & { modesDepart: Modes }) {
  const quiz = activite !== undefined
  const [etapes, setEtapes] = useState(() => adapterEtapes(depart, modesDepart))
  const modes = useRef(modesDepart)
  // Change quand l'étape en cours est remplacée (« Je ne peux pas… maintenant ») : elle est redessinée.
  const [version, setVersion] = useState(0)
  const [index, setIndex] = useState(0)
  const [retour, setRetour] = useState<Retour | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  // Dis-le : résultat affiché, validé par « Continuer ».
  const [dire, setDire] = useState<ResultatDire | null>(null)
  const resultats = useRef(new Resultats())
  // Bonnes réponses d'affilée : dès la 5e, chacune rapporte 1 XP de plus ; chaque palier de 5 est fêté.
  const combo = useRef(new Combo())
  const [fete, setFete] = useState<number | null>(null)
  // Quiz : chaque question compte une fois (les paires sont justes sans aucune erreur).
  const questions = useRef({ justes: 0, total: 0, erreurPaires: false })
  const MOTS = useMots()
  const etape = etapes[index]

  function compterQuestion(juste: boolean) {
    questions.current.total++
    if (juste) questions.current.justes++
    setFete(combo.current.noter(juste))
  }

  /** `motId` : null pour une réponse hors programme (Distingue les sons), qui ne touche pas la répétition espacée. */
  function repondre(juste: boolean, mot: Reponse, motId: string | null) {
    if (motId) resultats.current.noter(motId, juste)
    else resultats.current.compter(juste)
    compterQuestion(juste)
    sonReponse(juste)
    setTimeout(() => jouerAuto(mot.audio, mot.arabe), 350)
    if (!juste && !quiz) {
      const refaire = etapeARefaire(etape, MOTS)
      if (refaire) setEtapes((e) => [...e, ...adapterEtapes([refaire], modes.current)])
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

  /**
   * « Je ne peux pas parler / écouter maintenant » : coupe le mode 15 min, puis adapte l'étape en cours
   * (passée sans être comptée, ou Écoute et choisis devenu Traduis) et les suivantes.
   */
  function pasMaintenant(mode: 'parler' | 'ecouter') {
    void couperUnMoment(mode)
    modes.current = { ...modes.current, [mode]: false }
    const nouvelles = [...etapes.slice(0, index), ...adapterEtapes(etapes.slice(index), modes.current)]
    setEtapes(nouvelles)
    setVersion((v) => v + 1)
    setDire(null)
    if (index >= nouvelles.length) void terminer()
  }

  async function suivant() {
    setRetour(null)
    setDire(null)
    if (index + 1 < etapes.length) {
      setIndex(index + 1)
      return
    }
    await terminer()
  }

  async function terminer() {
    const r = resultats.current
    const q = questions.current
    setBilan(
      quiz
        ? await enregistrerActivite(activite, { bonnes: q.justes, mauvaises: q.total - q.justes, combo: combo.current.bonus })
        : await enregistrerSession(r.parMot(), { bonnes: r.bonnes, mauvaises: r.mauvaises, nouveaux, entrainement, scores: r.scores, combo: combo.current.bonus }),
    )
    if (quiz) onResultat?.(q.justes, q.total)
  }

  if (bilan) {
    const r = resultats.current
    const q = questions.current
    return quiz ? (
      <Bilan
        titre={titreBilan ? titreBilan(q.justes, q.total) : q.justes === q.total ? 'Sans faute !' : activite === 'grammaire' ? 'Leçon terminée' : 'Quiz terminé'}
        sousTitre={`${q.justes} bonne${q.justes > 1 ? 's' : ''} réponse${q.justes > 1 ? 's' : ''} sur ${q.total}`}
        xp={bilan.xp}
        activite={bilan}
        taux={q.total > 0 ? q.justes / q.total : 1}
        libelleEncore={activite === 'grammaire' ? 'Refaire la leçon' : 'Nouveau quiz'}
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

  // Dernière étape passée (« Je ne peux pas… maintenant ») : le bilan arrive.
  if (!etape) return <div data-sans-balayage className="fixed inset-0 z-30 bg-fond" />
  // Étape à dire (Dis-le, phrase à trou à l'oral) : validée par « Continuer » une fois le résultat affiché.
  const aDire = etape.type === 'disle' || (etape.type === 'trou' && etape.oral)

  return (
    <ModeLegendaire.Provider value={legendaire}>
      <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
        {/* Barre du haut en verre, au-dessus du contenu qui défile dessous (bord flou d'iOS 26). */}
        <div className="bord-flou visible absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge py-2">
            <button
              type="button"
              onClick={() => setConfirmer(true)}
              aria-label={activite === 'quiz' ? 'Quitter le quiz' : activite === 'grammaire' ? 'Quitter la leçon' : 'Quitter la session'}
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
                <RemplissageBarre fraction={index / etapes.length} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
          <div key={`${index}-${version}`} className="entree-droite">
            {etape.type === 'decouverte' && <Decouverte mot={etape.mot} />}
            {(etape.type === 'ecoute' || etape.type === 'traduis') && (
              <Choix
                type={etape.type}
                mot={etape.mot}
                choix={etape.choix}
                onRepondu={(j) => repondre(j, etape.mot, etape.mot.id)}
                onPasMaintenant={() => pasMaintenant('ecouter')}
              />
            )}
            {etape.type === 'distingue' && (
              <Distingue
                paire={etape.paire}
                cible={etape.cible}
                onRepondu={(j) => repondre(j, etape.cible, null)}
                onPasMaintenant={() => pasMaintenant('ecouter')}
              />
            )}
            {etape.type === 'disle' && (
              <DisLe
                mot={etape.mot}
                inverse={etape.inverse}
                phrase={etape.phrase}
                onPret={setDire}
                onRepondu={(r) => valider(etape.mot, r)}
                onPasMaintenant={() => pasMaintenant('parler')}
              />
            )}
            {etape.type === 'trou' && !etape.oral && (
              <Trou mot={etape.mot} morceaux={etape.morceaux} trou={etape.trou} choix={etape.choix} onRepondu={(j) => repondre(j, etape.mot, etape.mot.id)} />
            )}
            {etape.type === 'trou' && etape.oral && (
              <DisLe
                mot={etape.mot}
                inverse
                titre="Phrase à trou"
                consigne="Dis à voix haute le mot qui manque."
                enonce={
                  <div className="mb-3">
                    <p className="t-titre-2 leading-snug">
                      <PhraseTouchable latin={etape.morceaux.join(' ')} trou={etape.trou} />
                    </p>
                    <p className="t-sous-titre mt-2 text-texte-2">{etape.mot.exemple.fr}</p>
                  </div>
                }
                onPret={setDire}
                onRepondu={(r) => valider(etape.mot, r)}
                onPasMaintenant={() => pasMaintenant('parler')}
              />
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

        {(retour !== null || etape.type === 'decouverte' || (aDire && dire)) && (
          <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            {/* Panneau de commandes en Liquid Glass : il s'ouvre pour donner le résultat. */}
            <div className="verre mx-auto max-w-xl rounded-panneau p-3">
              <div className={`deplier ${retour ? 'ouvert' : ''}`} aria-live="polite">
                <div>
                  {retour?.juste === true && (
                    <div className="flex items-center gap-3 px-2 pb-3 pt-1">
                      <Mascotte humeur="bravo" className="h-12 w-12" />
                      <div className="min-w-0 flex-1">
                        <p className="t-titre-3 flex flex-wrap items-center gap-2 text-vert">
                          <CircleCheck className="h-6 w-6" strokeWidth={2.5} aria-hidden /> Bravo !
                        </p>
                        <PhraseDeMascotte humeur="bravo" cle={retour} />
                      </div>
                      {fete && (
                        <span className="combo-fete t-appel ml-auto flex items-center gap-1 rounded-full bg-[#fff3e0] px-3 py-1 font-semibold text-[#e65100] dark:bg-[#4a2a00] dark:text-[#ffb74d]">
                          <Flame className="h-4 w-4" strokeWidth={2.4} fill="currentColor" aria-hidden /> {fete} d’affilée ! +1 XP par réponse
                        </span>
                      )}
                    </div>
                  )}
                  {retour?.juste === false && (
                    <div className="flex items-center gap-3 px-2 pb-3 pt-1 text-rouge">
                      <Mascotte humeur="rate" className="h-12 w-12" />
                      <div className="min-w-0 flex-1">
                        <p className="t-titre-3 flex items-center gap-2">
                          <CircleX className="h-6 w-6" strokeWidth={2.5} aria-hidden /> Bonne réponse :
                        </p>
                        <p className="t-corps mt-1 text-texte">
                          <span className="font-semibold">{retour.mot.latin}</span> = {retour.mot.fr}
                        </p>
                        <PhraseDeMascotte humeur="rate" cle={retour} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Bouton
                grand
                className={`w-full ${retour?.juste || dire?.juste ? '!bg-vert-plein' : ''}`}
                onClick={() => (aDire && dire ? valider(etape.mot, dire) : void suivant())}
              >
                Continuer
              </Bouton>
            </div>
          </div>
        )}

        {confirmer && (
          <Alerte
            titre={activite === 'quiz' ? 'Quitter le quiz ?' : activite === 'grammaire' ? 'Quitter la leçon ?' : 'Quitter la session ?'}
            message={
              activite === 'quiz'
                ? 'Ce quiz ne sera pas compté.'
                : activite === 'grammaire'
                  ? 'Cette leçon ne sera pas comptée.'
                  : 'Les réponses de cette session ne seront pas enregistrées.'
            }
            onAnnuler={() => setConfirmer(false)}
            actions={[
              { libelle: 'Continuer', role: 'annuler', action: () => setConfirmer(false) },
              { libelle: 'Quitter', role: 'destructif', action: onFermer },
            ]}
          />
        )}
      </div>
    </ModeLegendaire.Provider>
  )
}
