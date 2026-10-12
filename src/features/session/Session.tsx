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
      className="fond fixed inset-0 z-30 flex flex-col pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex w-full max-w-xl items-center gap-4 px-4 py-3">
        <button type="button" onClick={quitter} aria-label="Quitter la session" className="verre verre-interactif flex h-10 w-10 items-center justify-center rounded-full text-lg text-stone-500">
          ✕
        </button>
        <div className="verre h-4 flex-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-[width] duration-500"
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

      <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {/* Un seul panneau de verre qui se teinte et s'ouvre pour devenir le retour (façon glassEffectID). */}
        <div
          className={`mx-auto max-w-xl rounded-[2rem] p-3 transition-colors duration-300 ${
            retour === null ? (etape.type === 'decouverte' ? 'verre' : '') : retour.juste ? 'verre-vert' : 'verre-rouge'
          }`}
        >
          <div className={`deplier ${retour ? 'ouvert' : ''}`}>
            <div>
              {retour?.juste === true && (
                <p className="px-2 pb-3 pt-1 text-xl font-bold text-green-700 dark:text-green-300">Bravo !</p>
              )}
              {retour?.juste === false && (
                <div className="px-2 pb-3 pt-1 text-red-700 dark:text-red-200">
                  <p className="text-xl font-bold">Bonne réponse :</p>
                  <p className="text-lg">
                    <span className="font-semibold">{retour.mot.latin}</span> = {retour.mot.fr}
                  </p>
                </div>
              )}
            </div>
          </div>
          {(retour !== null || etape.type === 'decouverte') && (
            <button
              type="button"
              onClick={() => void suivant()}
              className={`verre-interactif min-h-14 w-full rounded-2xl text-lg font-bold text-white ${
                retour?.juste === false
                  ? 'verre-teinte !bg-red-500/85'
                  : retour?.juste
                    ? 'verre-teinte !bg-green-600/85'
                    : 'verre-teinte'
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
