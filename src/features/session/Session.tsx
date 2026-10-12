import { useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { MOTS } from '../../data'
import type { Mot } from '../../data/types'
import { enregistrerSession, type BilanSession } from '../../db/apprentissage'
import { Resultats, etapeARefaire, type Etape } from '../../exercices/session'
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
  const resultats = useRef(new Resultats())
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

  function quitter() {
    if (window.confirm('Quitter la session ? Les réponses de cette session ne seront pas enregistrées.')) onFermer()
  }

  if (bilan) return <Bilan bilan={bilan} taux={resultats.current.taux} onFermer={onFermer} onEncore={onEncore} />

  return (
    <div
      data-sans-balayage
      className="fixed inset-0 z-30 flex flex-col bg-orange-50 pt-[env(safe-area-inset-top)] dark:bg-stone-950"
    >
      <div className="mx-auto flex w-full max-w-xl items-center gap-4 px-4 py-3">
        <button type="button" onClick={quitter} aria-label="Quitter la session" className="text-2xl text-stone-400">
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-orange-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-orange-600 transition-[width] duration-500"
            style={{ width: `${(index / etapes.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 pb-6 pt-2">
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

      <div
        className={`border-t-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 ${
          retour === null
            ? 'border-transparent'
            : retour.juste
              ? 'border-green-200 bg-green-100 dark:border-green-900 dark:bg-green-950'
              : 'border-red-200 bg-red-100 dark:border-red-900 dark:bg-red-950'
        }`}
      >
        <div className="mx-auto max-w-xl space-y-3">
          {retour?.juste === true && <p className="text-xl font-bold text-green-700 dark:text-green-400">Bravo !</p>}
          {retour?.juste === false && (
            <div className="text-red-700 dark:text-red-300">
              <p className="text-xl font-bold">Bonne réponse :</p>
              <p className="text-lg">
                <span className="font-semibold">{retour.mot.latin}</span> = {retour.mot.fr}
              </p>
            </div>
          )}
          {(retour !== null || etape.type === 'decouverte') && (
            <button
              type="button"
              onClick={() => void suivant()}
              className={`min-h-14 w-full rounded-2xl border-b-4 text-lg font-bold text-white active:translate-y-0.5 ${
                retour?.juste === false ? 'border-red-700 bg-red-500' : retour?.juste ? 'border-green-700 bg-green-500' : 'border-orange-800 bg-orange-600'
              }`}
            >
              Continuer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
