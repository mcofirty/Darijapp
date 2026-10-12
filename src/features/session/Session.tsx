import { useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { CircleCheck, CircleX, X } from 'lucide-react'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { enregistrerSession, type BilanSession } from '../../db/apprentissage'
import { Resultats, etapeARefaire, type Etape } from '../../exercices/session'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Bilan } from './Bilan'
import { Choix } from './Choix'
import { Decouverte } from './Decouverte'
import { Paires } from './Paires'

interface Props {
  etapes: Etape[]
  nouveaux: number
  entrainement: boolean
  onFermer: () => void
  onEncore: () => void
}

type Retour = { juste: true } | { juste: false; mot: Mot }

/** Session plein écran : une étape à la fois, retour immédiat, étapes ratées refaites à la fin. */
export function Session({ etapes: depart, nouveaux, entrainement, onFermer, onEncore }: Props) {
  const [etapes, setEtapes] = useState(depart)
  const [index, setIndex] = useState(0)
  const [retour, setRetour] = useState<Retour | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const resultats = useRef(new Resultats())
  const MOTS = useMots()
  const etape = etapes[index]

  function repondre(juste: boolean, mot: Mot) {
    resultats.current.noter(mot.id, juste)
    sonReponse(juste)
    setTimeout(() => jouer(mot.audio, mot.arabe), 350)
    if (!juste) {
      const refaire = etapeARefaire(etape, MOTS)
      if (refaire) setEtapes((e) => [...e, refaire])
    }
    setRetour(juste ? { juste: true } : { juste: false, mot })
  }

  async function suivant() {
    setRetour(null)
    if (index + 1 < etapes.length) {
      setIndex(index + 1)
      return
    }
    const r = resultats.current
    setBilan(
      await enregistrerSession(r.parMot(), { bonnes: r.bonnes, mauvaises: r.mauvaises, nouveaux, entrainement }),
    )
  }

  if (bilan) return <Bilan bilan={bilan} taux={resultats.current.taux} onFermer={onFermer} onEncore={onEncore} />

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      {/* Barre du haut en verre, au-dessus du contenu qui défile dessous (bord flou d'iOS 26). */}
      <div className="bord-flou visible absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-2">
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            aria-label="Quitter la session"
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

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 pb-6 pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        <div key={index} className="entree-droite">
          {etape.type === 'decouverte' && <Decouverte mot={etape.mot} />}
          {(etape.type === 'ecoute' || etape.type === 'traduis') && (
            <Choix type={etape.type} mot={etape.mot} choix={etape.choix} onRepondu={(j) => repondre(j, etape.mot)} />
          )}
          {etape.type === 'paires' && (
            <Paires
              mots={etape.mots}
              onErreur={(id) => resultats.current.noter(id, false)}
              onTermine={() => {
                etape.mots.forEach((m) => resultats.current.noter(m.id, true))
                setRetour({ juste: true })
              }}
            />
          )}
        </div>
      </div>

      {(retour !== null || etape.type === 'decouverte') && (
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
              className={`w-full ${retour?.juste ? '!bg-vert-plein' : ''}`}
              onClick={() => void suivant()}
            >
              Continuer
            </Bouton>
          </div>
        </div>
      )}

      {confirmer && (
        <Alerte
          titre="Quitter la session ?"
          message="Les réponses de cette session ne seront pas enregistrées."
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
