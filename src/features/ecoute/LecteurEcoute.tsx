import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { arreterLecture, lireEtAttendre, parlerFrancais } from '../../audio/lecteur'
import type { Mot } from '../../data/types'
import { programmeDuMot, type OptionsEcoute } from '../../exercices/ecoute'
import { noterEcoute } from '../../db/journal'
import { useProfil } from '../../db/useProfil'
import { Bouton } from '../../ui/Boutons'

interface Props {
  titre: string
  mots: Mot[]
  options: OptionsEcoute
  onFermer: () => void
}

const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/** Garde l'écran allumé pendant l'écoute (sinon l'iPhone se verrouille et la lecture s'arrête). */
function useEcranAllume(actif: boolean) {
  useEffect(() => {
    if (!actif || !('wakeLock' in navigator)) return
    let verrou: WakeLockSentinel | null = null
    let annule = false
    const demander = () => {
      navigator.wakeLock
        .request('screen')
        .then((v) => {
          if (annule) void v.release()
          else verrou = v
        })
        .catch(() => {})
    }
    demander()
    // Le verrou tombe quand l'appli passe en arrière-plan : on le redemande au retour.
    const retour = () => {
      if (document.visibilityState === 'visible') demander()
    }
    document.addEventListener('visibilitychange', retour)
    return () => {
      annule = true
      document.removeEventListener('visibilitychange', retour)
      void verrou?.release()
    }
  }, [actif])
}

/** Lecteur plein écran : darija, pause pour répéter, darija ralenti, français, puis le mot suivant. */
export function LecteurEcoute({ titre, mots, options, onFermer }: Props) {
  const { afficherArabe } = useProfil()
  const [index, setIndex] = useState(0)
  const [enLecture, setEnLecture] = useState(true)
  const [fini, setFini] = useState(false)
  // Chaque lancement de boucle reçoit un numéro : une boucle dépassée (pause, mot suivant) s'arrête seule.
  const jeton = useRef(0)
  const mot = mots[index]
  useEcranAllume(enLecture)

  async function boucle(depart: number) {
    const id = ++jeton.current
    const actif = () => id === jeton.current
    for (let i = depart; i < mots.length; i++) {
      if (!actif()) return
      setIndex(i)
      const m = mots[i]
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: m.latin, artist: m.fr, album: `Darijaapp · ${titre}` })
      }
      let note = false
      for (const pas of programmeDuMot(options)) {
        if (!actif()) return
        if (pas.type === 'darija') {
          await lireEtAttendre(m.audio, m.arabe, pas.lent ? 0.75 : 1)
          // Un mot entendu compte une fois pour la quête « Écoute 10 mots ».
          if (!note && actif()) {
            note = true
            void noterEcoute()
          }
        }
        else if (pas.type === 'francais') await parlerFrancais(m.fr)
        else await attendre(pas.ms)
      }
    }
    if (actif()) {
      setEnLecture(false)
      setFini(true)
    }
  }

  function lire(depart: number) {
    arreterLecture()
    setFini(false)
    setEnLecture(true)
    void boucle(depart)
  }

  function pause() {
    jeton.current++
    arreterLecture()
    setEnLecture(false)
  }

  function aller(i: number) {
    const cible = Math.min(Math.max(i, 0), mots.length - 1)
    if (enLecture) lire(cible)
    else setIndex(cible)
  }

  // Démarre à l'ouverture (le toucher qui ouvre le lecteur autorise le son) ; tout s'arrête en quittant.
  useEffect(() => {
    void boucle(0)
    return () => {
      jeton.current++
      arreterLecture()
    }
  }, [])

  // Commandes de l'écran verrouillé et des écouteurs, quand l'iPhone les propose.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => lire(index))
    ms.setActionHandler('pause', pause)
    ms.setActionHandler('nexttrack', () => aller(index + 1))
    ms.setActionHandler('previoustrack', () => aller(index - 1))
    return () => {
      for (const a of ['play', 'pause', 'nexttrack', 'previoustrack'] as const) ms.setActionHandler(a, null)
    }
  })

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le mode écoute"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="t-gras truncate">{titre}</p>
          <p className="t-note text-texte-2">
            Mot {index + 1} sur {mots.length}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-xl px-marge">
        <div className="h-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${((index + 1) / mots.length) * 100}%` }} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-marge text-center" aria-live="polite">
        {fini ? (
          <>
            <p className="t-grand-titre">Écoute terminée</p>
            <p className="t-appel mt-2 text-texte-2">{mots.length} mots écoutés.</p>
          </>
        ) : (
          <div key={mot.id} className="entree-droite">
            <p className="t-grand-titre break-words">{mot.latin}</p>
            {afficherArabe && (
              <p className="arabe mt-2 text-[2rem] text-texte-2" dir="rtl" lang="ar">
                {mot.arabe}
              </p>
            )}
            <p className="t-titre-3 mt-4 text-texte-2">{mot.fr}</p>
          </div>
        )}
      </div>

      <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="verre mx-auto max-w-xl rounded-panneau p-3">
          {fini ? (
            <div className="flex flex-col gap-2">
              <Bouton grand className="w-full" onClick={() => lire(0)}>
                Recommencer
              </Bouton>
              <Bouton grand variante="gris" className="w-full" onClick={onFermer}>
                Terminer
              </Bouton>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={() => aller(index - 1)}
                disabled={index === 0}
                aria-label="Mot précédent"
                className="pressable flex h-14 w-14 items-center justify-center rounded-full disabled:opacity-30"
              >
                <SkipBack className="h-7 w-7" fill="currentColor" strokeWidth={1.8} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => (enLecture ? pause() : lire(index))}
                aria-label={enLecture ? 'Pause' : 'Lecture'}
                className="pressable flex h-[50px] w-[50px] items-center justify-center rounded-full bg-accent-plein text-white"
              >
                {enLecture ? (
                  <Pause className="h-6 w-6" fill="currentColor" strokeWidth={1.8} aria-hidden />
                ) : (
                  <Play className="h-6 w-6 translate-x-px" fill="currentColor" strokeWidth={1.8} aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => aller(index + 1)}
                disabled={index === mots.length - 1}
                aria-label="Mot suivant"
                className="pressable flex h-14 w-14 items-center justify-center rounded-full disabled:opacity-30"
              >
                <SkipForward className="h-7 w-7" fill="currentColor" strokeWidth={1.8} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
