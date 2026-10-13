import { ArrowLeft, ArrowRight, ArrowUp, Hand, Volume2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import type { Mot } from '../../data/types'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { useMots } from '../../db/motsPerso'
import { useProfil } from '../../db/useProfil'
import { DESTINATIONS, MOTS_TAXI, TAILLE_PLAN, nouvelleCourse, type Consigne, type Course } from '../../exercices/jeux'
import { Alerte } from '../../ui/Alerte'
import { Bilan } from '../session/Bilan'

/** Courses par partie. */
const COURSES = 3
const CASE = 56

const BOUTONS: { consigne: Consigne; libelle: string; Icone: typeof ArrowUp }[] = [
  { consigne: 'lisser', libelle: 'À gauche', Icone: ArrowLeft },
  { consigne: 'nichan', libelle: 'Tout droit', Icone: ArrowUp },
  { consigne: 'limen', libelle: 'À droite', Icone: ArrowRight },
  { consigne: 'stop', libelle: 'Je m’arrête', Icone: Hand },
]

interface Props {
  onFermer: () => void
  onEncore: () => void
}

/** Le taxi : le passager guide en darija, on choisit la direction ; le taxi avance sur le plan. */
export function Taxi({ onFermer, onEncore }: Props) {
  const MOTS = useMots()
  const { afficherArabe } = useProfil()
  const parId = useMemo(() => new Map(MOTS.map((m) => [m.id, m])), [MOTS])
  const [courses] = useState<Course[]>(() => Array.from({ length: COURSES }, () => nouvelleCourse()))
  const [numCourse, setNumCourse] = useState(0)
  const [pas, setPas] = useState(0)
  const [retour, setRetour] = useState<{ juste: boolean } | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const score = useRef({ bonnes: 0, mauvaises: 0 })

  const course = courses[numCourse]
  const consigne = course.consignes[pas]
  // Le mot dit par le passager pour cette consigne (« sir nichan » ou « kmmel nichan » en alternance).
  const motConsigne = (c: Consigne, i: number): Mot | undefined => parId.get(MOTS_TAXI[c][i % MOTS_TAXI[c].length])
  const destination = parId.get(DESTINATIONS[numCourse % DESTINATIONS.length])
  const mot = motConsigne(consigne, pas)

  // Au début d'une course, le passager dit où il va, puis donne la première consigne.
  useEffect(() => {
    if (!mot) return
    if (pas === 0 && destination) {
      jouer(destination.audio, destination.arabe)
      const id = window.setTimeout(() => jouer(mot.audio, mot.arabe), 2200)
      return () => window.clearTimeout(id)
    }
    jouer(mot.audio, mot.arabe)
  }, [numCourse, pas, mot, destination])

  async function choisir(c: Consigne) {
    if (retour) return
    const juste = c === consigne
    sonReponse(juste)
    score.current[juste ? 'bonnes' : 'mauvaises']++
    setRetour({ juste })
    window.setTimeout(async () => {
      setRetour(null)
      if (pas + 1 < course.consignes.length) setPas(pas + 1)
      else if (numCourse + 1 < courses.length) {
        setNumCourse(numCourse + 1)
        setPas(0)
      } else setBilan(await enregistrerActivite('taxi', score.current))
    }, 1100)
  }

  if (bilan) {
    const { bonnes, mauvaises } = score.current
    return (
      <Bilan
        titre="Courses terminées"
        sousTitre={`${bonnes} bonne${bonnes > 1 ? 's' : ''} direction${bonnes > 1 ? 's' : ''} sur ${bonnes + mauvaises}`}
        xp={bilan.xp}
        activite={bilan}
        taux={bonnes / Math.max(1, bonnes + mauvaises)}
        libelleEncore="Nouvelle course"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )
  }

  // Le taxi est à la case atteinte avant cette consigne ; après une bonne réponse, il avance.
  const position = course.chemin[Math.min(pas, course.chemin.length - 1)]
  const parcourues = course.chemin.slice(0, pas + 1)
  // Direction du taxi (vers le nord au départ), pour que « à droite » se lise sur le plan.
  const avant = course.chemin[Math.max(0, Math.min(pas, course.chemin.length - 1) - 1)]
  const angle = pas === 0 ? 0 : (Math.atan2(position.x - avant.x, avant.y - position.y) * 180) / Math.PI
  const taille = TAILLE_PLAN * CASE

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={() => setConfirmer(true)}
          aria-label="Quitter le taxi"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div className="verre verre-fin t-gras flex h-11 flex-1 items-center justify-center rounded-full px-4">
          Course {numCourse + 1} sur {courses.length}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center overflow-y-auto px-marge pb-4 pt-2">
        <div className="mb-4 flex w-full items-center gap-3 rounded-liste bg-carte p-marge">
          <button
            type="button"
            onClick={() => mot && jouer(mot.audio, mot.arabe)}
            className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-plein text-white"
            aria-label="Réécouter le passager"
          >
            <Volume2 className="h-6 w-6" strokeWidth={2.2} aria-hidden />
          </button>
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="t-note font-semibold uppercase text-accent">Le passager</p>
            {retour && mot ? (
              <p className={`t-gras ${retour.juste ? 'text-vert' : 'text-rouge'}`}>
                {mot.latin}
                {afficherArabe && (
                  <span className="arabe ml-2 font-normal" lang="ar">
                    {mot.arabe}
                  </span>
                )}
                <span className="t-sous-titre block text-texte-2">{mot.fr}</span>
              </p>
            ) : (
              <p className="t-appel text-texte-2">{pas === 0 ? `${destination?.fr ?? ''}… Écoute où tourner.` : 'Écoute la consigne.'}</p>
            )}
          </div>
        </div>

        {/* Plan du quartier : rues en gris, trajet en pointillés, taxi en jaune. */}
        <svg viewBox={`-6 -6 ${taille + 12} ${taille + 12}`} className="mb-4 w-full max-w-[300px]" role="img" aria-label="Plan du trajet">
          {Array.from({ length: TAILLE_PLAN }, (_, i) => (
            <g key={i}>
              <line x1={CASE / 2} y1={i * CASE + CASE / 2} x2={taille - CASE / 2} y2={i * CASE + CASE / 2} stroke="var(--remplissage)" strokeWidth="14" strokeLinecap="round" />
              <line x1={i * CASE + CASE / 2} y1={CASE / 2} x2={i * CASE + CASE / 2} y2={taille - CASE / 2} stroke="var(--remplissage)" strokeWidth="14" strokeLinecap="round" />
            </g>
          ))}
          <polyline
            points={parcourues.map((p) => `${p.x * CASE + CASE / 2},${p.y * CASE + CASE / 2}`).join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeDasharray="1 8"
            strokeLinecap="round"
          />
          <g
            style={{
              transform: `translate(${position.x * CASE + CASE / 2}px, ${position.y * CASE + CASE / 2}px) rotate(${angle}deg)`,
              transition: 'transform 0.5s ease',
            }}
          >
            {/* Taxi vu de dessus, l'avant vers le haut. */}
            <rect x="-11" y="-16" width="22" height="32" rx="7" fill="#ffcc00" stroke="#1c1c1e" strokeWidth="2" />
            <rect x="-7" y="-10" width="14" height="7" rx="2" fill="#1c1c1e" opacity="0.75" />
            <rect x="-7" y="5" width="14" height="5" rx="2" fill="#1c1c1e" opacity="0.5" />
            <path d="M-4 -20 L0 -26 L4 -20 Z" fill="var(--accent)" />
          </g>
        </svg>

        <div className="grid w-full grid-cols-4 gap-2">
          {BOUTONS.map(({ consigne: c, libelle, Icone }) => {
            const etat = !retour ? 'neutre' : c === consigne ? 'juste' : 'eteint'
            return (
              <button
                key={c}
                type="button"
                disabled={retour !== null}
                onClick={() => void choisir(c)}
                className={`pressable flex min-h-20 flex-col items-center justify-center gap-1 rounded-liste px-1 transition-colors ${
                  etat === 'juste' ? 'bg-vert-doux text-vert' : etat === 'eteint' ? 'bg-carte opacity-50' : 'bg-carte'
                }`}
              >
                <Icone className="h-7 w-7" strokeWidth={2.4} aria-hidden />
                <span className="t-note font-semibold">{libelle}</span>
              </button>
            )
          })}
        </div>
      </div>

      {confirmer && (
        <Alerte
          titre="Descendre du taxi ?"
          message="Cette partie ne sera pas comptée."
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
