import { BookOpen, Coins, CupSoda, Flame, Snowflake, Gamepad2, Medal, MessagesSquare, Mic, Sprout, Target, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useJeu } from '../../db/useJeu'
import { useResume } from '../../db/useResume'
import { COULEURS_MAITRISE, FAMILLES_BADGES, OBJECTIF_MOTS, type FamilleBadge, type Maitrise } from '../../gamification/collection'
import { Ligne, Section } from '../../ui/Liste'

/** Les 7 derniers jours : une flamme pleine pour chaque jour pratiqué. */
export function Semaine() {
  const { semaine } = useJeu()
  const { serie } = useResume()
  return (
    <Section
      titre="Série"
      note={serie.aujourdhui ? 'Série sécurisée pour aujourd’hui.' : 'Fais une activité aujourd’hui pour garder ta série. Un jour manqué par semaine est pardonné ; au-delà, un gel de série (au souk) protège ta série.'}
    >
      <Ligne titre={<span className="font-semibold">{serie.jours} jour{serie.jours > 1 ? 's' : ''} d’affilée</span>} />
      <div className="flex justify-between px-marge pb-4 pt-1">
        {semaine.map((j) => (
          <div key={j.date} className="flex flex-col items-center gap-1">
            <span className={`t-note ${j.aujourdhui ? 'font-semibold text-texte' : 'text-texte-2'}`}>{j.lettre}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${j.fait ? 'bg-accent-doux text-accent' : j.gele ? 'bg-[#e3f2fd] text-[#1e88e5] dark:bg-[#0d3a5c] dark:text-[#64b5f6]' : 'bg-remplissage text-texte-3'}`}
              aria-label={`${j.date} : ${j.fait ? 'pratiqué' : j.gele ? 'gelé' : 'pas pratiqué'}`}
            >
              {j.gele && !j.fait ? (
                <Snowflake className="h-5 w-5" strokeWidth={2.2} aria-hidden />
              ) : (
                <Flame className="h-5 w-5" strokeWidth={2.2} fill={j.fait ? 'currentColor' : 'none'} aria-hidden />
              )}
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

/** Icône et couleur de chaque famille de badges. */
const STYLE_FAMILLE: Record<FamilleBadge, { icone: LucideIcon; couleur: string }> = {
  mots: { icone: BookOpen, couleur: '#007aff' },
  maitrise: { icone: Medal, couleur: '#e0a800' },
  serie: { icone: Flame, couleur: '#ff3b30' },
  pratique: { icone: Target, couleur: '#34c759' },
  plante: { icone: Sprout, couleur: '#2f8f46' },
  prononciation: { icone: Mic, couleur: '#ff2d55' },
  parler: { icone: MessagesSquare, couleur: '#5856d6' },
  jeux: { icone: Gamepad2, couleur: '#ff9500' },
  voyage: { icone: CupSoda, couleur: '#a2845e' },
  souk: { icone: Coins, couleur: '#c1272d' },
}

/** Badges par famille : en couleur une fois obtenus, sinon avec l'avancée vers le seuil. */
export function Badges() {
  const { badges } = useJeu()
  const [tout, setTout] = useState(false)
  const obtenus = badges.filter((b) => b.obtenu).length
  return (
    <Section titre={`Badges · ${obtenus}/${badges.length}`}>
      {FAMILLES_BADGES.map((f) => {
        const famille = badges.filter((b) => b.badge.famille === f.id)
        const gagnes = famille.filter((b) => b.obtenu).length
        // Repliée : les badges gagnés et le prochain à gagner de chaque mesure.
        const prochains = new Set<string>()
        for (const b of famille) if (!b.obtenu && ![...prochains].some((id) => famille.find((x) => x.badge.id === id)!.badge.mesure === b.badge.mesure)) prochains.add(b.badge.id)
        const visibles = tout ? famille : famille.filter((b) => b.obtenu || prochains.has(b.badge.id))
        const { icone: Icone, couleur } = STYLE_FAMILLE[f.id]
        return (
          <div key={f.id} className="border-b border-separateur last:border-b-0">
            <p className="t-appel flex items-center justify-between px-marge pt-4 font-semibold">
              <span>{f.titre}</span>
              <span className="t-sous-titre font-normal text-texte-2">
                {gagnes}/{famille.length}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-y-4 px-3 pb-4 pt-3">
              {visibles.map(({ badge, obtenu, valeur, avancement }) => (
                <div key={badge.id} className="flex flex-col items-center gap-1 px-1 text-center" title={badge.description}>
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${obtenu ? 'text-white' : 'bg-remplissage text-texte-3'}`}
                    style={obtenu ? { background: couleur } : undefined}
                    aria-hidden
                  >
                    <Icone className="h-7 w-7" strokeWidth={2.2} />
                  </span>
                  <span className={`t-note font-semibold ${obtenu ? '' : 'text-texte-2'}`}>{badge.titre}</span>
                  <span className="t-legende text-texte-2">{badge.description}</span>
                  {!obtenu && (
                    <span className="mt-0.5 flex w-full flex-col items-center gap-0.5" aria-label={`${Math.min(valeur, badge.seuil)} sur ${badge.seuil}`}>
                      <span className="block h-1.5 w-4/5 overflow-hidden rounded-full bg-remplissage">
                        <span className="block h-full rounded-full" style={{ width: `${avancement * 100}%`, background: couleur }} />
                      </span>
                      <span className="t-legende text-texte-2">
                        {Math.min(valeur, badge.seuil)}/{badge.seuil}
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <button type="button" onClick={() => setTout(!tout)} className="pressable t-appel min-h-ligne w-full px-marge text-accent">
        {tout ? 'Montrer les prochains seulement' : `Voir les ${badges.length} badges`}
      </button>
    </Section>
  )
}
