import { Award, Flame, Lock } from 'lucide-react'
import { useJeu } from '../../db/useJeu'
import { useResume } from '../../db/useResume'
import { COULEURS_MAITRISE, OBJECTIF_MOTS, type Maitrise } from '../../gamification/collection'
import { Ligne, Section } from '../../ui/Liste'

/** Les 7 derniers jours : une flamme pleine pour chaque jour pratiqué. */
export function Semaine() {
  const { semaine } = useJeu()
  const { serie } = useResume()
  return (
    <Section
      titre="Série"
      note={serie.aujourdhui ? 'Série sécurisée pour aujourd’hui.' : 'Fais une activité aujourd’hui pour garder ta série. Un jour manqué par semaine est pardonné.'}
    >
      <Ligne titre={<span className="font-semibold">{serie.jours} jour{serie.jours > 1 ? 's' : ''} d’affilée</span>} />
      <div className="flex justify-between px-marge pb-4 pt-1">
        {semaine.map((j) => (
          <div key={j.date} className="flex flex-col items-center gap-1">
            <span className={`t-note ${j.aujourdhui ? 'font-semibold text-texte' : 'text-texte-2'}`}>{j.lettre}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${j.fait ? 'bg-accent-doux text-accent' : 'bg-remplissage text-texte-3'}`}
              aria-label={`${j.date} : ${j.fait ? 'pratiqué' : 'pas pratiqué'}`}
            >
              <Flame className="h-5 w-5" strokeWidth={2.2} fill={j.fait ? 'currentColor' : 'none'} aria-hidden />
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}

const LIGNES_COLLECTION: { id: Maitrise; titre: string; detail: string }[] = [
  { id: 'or', titre: 'Or', detail: 'retenus trois semaines' },
  { id: 'argent', titre: 'Argent', detail: 'retenus une semaine' },
  { id: 'bronze', titre: 'Bronze', detail: 'découverts' },
]

/** Cartes de mots par niveau de maîtrise, et progression vers l'objectif de 300 mots. */
export function Collection() {
  const { collection } = useJeu()
  const total = collection.bronze + collection.argent + collection.or
  return (
    <Section titre="Ma collection" note={`Objectif : ${OBJECTIF_MOTS} mots. Un mot passe en argent puis en or quand tu le retiens dans le temps.`}>
      <Ligne
        titre={
          <span className="block">
            <span className="flex items-baseline justify-between">
              <span className="font-semibold">{total} mot{total > 1 ? 's' : ''}</span>
              <span className="t-sous-titre text-texte-2">
                {Math.min(100, Math.round((total / OBJECTIF_MOTS) * 100))} %
              </span>
            </span>
            <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
              {LIGNES_COLLECTION.map((l) => (
                <span key={l.id} className="block h-full" style={{ width: `${(collection[l.id] / OBJECTIF_MOTS) * 100}%`, background: COULEURS_MAITRISE[l.id] }} />
              ))}
            </span>
          </span>
        }
      />
      {LIGNES_COLLECTION.map((l) => (
        <Ligne
          key={l.id}
          tuile={<span className="h-[29px] w-[29px] shrink-0 rounded-full" style={{ background: COULEURS_MAITRISE[l.id] }} aria-hidden />}
          titre={l.titre}
          sousTitre={l.detail}
          valeur={collection[l.id]}
        />
      ))}
    </Section>
  )
}

/** Badges d'étape : en couleur une fois obtenus. */
export function Badges() {
  const { badges } = useJeu()
  const obtenus = badges.filter((b) => b.obtenu).length
  return (
    <Section titre={`Badges · ${obtenus}/${badges.length}`}>
      <div className="grid grid-cols-3 gap-y-5 px-3 py-5">
        {badges.map(({ badge, obtenu }) => (
          <div key={badge.id} className="flex flex-col items-center gap-1.5 px-1 text-center" title={badge.description}>
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full ${obtenu ? 'bg-[#ffcc00] text-white' : 'bg-remplissage text-texte-3'}`}
              aria-hidden
            >
              {obtenu ? <Award className="h-7 w-7" strokeWidth={2.2} /> : <Lock className="h-6 w-6" strokeWidth={2.2} />}
            </span>
            <span className={`t-note font-semibold ${obtenu ? '' : 'text-texte-2'}`}>{badge.titre}</span>
            <span className="t-legende text-texte-2">{badge.description}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
