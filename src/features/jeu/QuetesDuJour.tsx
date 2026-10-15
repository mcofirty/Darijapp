import { AudioLines, BookOpen, Check, Headphones, Sparkles, Sprout, Target, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lireXpTotal } from '../../db/apprentissage'
import { ouvrirCoffre } from '../../db/journal'
import { useJeu } from '../../db/useJeu'
import { XP_COFFRE, type Avancement, type StatsDuJour } from '../../gamification/quetes'
import { Bouton } from '../../ui/Boutons'
import { vibrer } from '../../ui/haptique'
import { Section } from '../../ui/Liste'
import { Theiere } from '../../ui/recompenses'
import { Arrosage } from './Arrosage'

/** Une icône et une couleur par type de quête (ce qu'elle mesure). */
const STYLE_QUETE: Record<keyof StatsDuJour, { icone: LucideIcon; couleur: string }> = {
  sessions: { icone: BookOpen, couleur: '#e5533c' },
  quiz: { icone: Target, couleur: '#7a5af5' },
  express: { icone: Zap, couleur: '#f5a524' },
  sons: { icone: AudioLines, couleur: '#2f8fe0' },
  sansFaute: { icone: Sparkles, couleur: '#e0469a' },
  xp: { icone: Sparkles, couleur: '#f5a524' },
  nouveaux: { icone: Sprout, couleur: '#12a06a' },
  ecoutes: { icone: Headphones, couleur: '#2f8fe0' },
}

/**
 * Quêtes déjà vues faites, gardées le temps de la visite : une quête qui passe à « faite » pendant une
 * activité est fêtée au retour sur l'écran, une seule fois ; celles déjà faites à l'ouverture ne le sont pas.
 */
const vues: { faites: Set<string> | null } = { faites: null }

function useQuetesFetees(quetes: Avancement[]): Set<string> {
  const [fetees, setFetees] = useState<Set<string>>(new Set())
  const cle = quetes.map((q) => `${q.quete.id}:${q.faite}`).join(',')
  useEffect(() => {
    if (quetes.length === 0) return
    const faites = quetes.filter((q) => q.faite).map((q) => q.quete.id)
    if (vues.faites === null) {
      vues.faites = new Set(faites)
      return
    }
    // Nouvelles quêtes à minuit : on oublie celles d'hier.
    const ids = new Set(quetes.map((q) => q.quete.id))
    for (const id of vues.faites) if (!ids.has(id)) vues.faites.delete(id)
    const neuves = faites.filter((id) => !vues.faites!.has(id))
    if (neuves.length === 0) return
    neuves.forEach((id) => vues.faites!.add(id))
    setFetees(new Set(neuves))
  }, [cle])
  return fetees
}

/** Une quête : icône colorée, jauge qui se remplit, coche et « verre de thé » qui apparaissent une fois faite. */
function LigneQuete({ q, fetee, faites, total }: { q: Avancement; fetee: boolean; faites: number; total: number }) {
  const { icone: Icone, couleur } = STYLE_QUETE[q.quete.mesure]
  // La jauge part de zéro et se remplit à l'affichage.
  const [rempli, setRempli] = useState(0)
  useEffect(() => {
    const image = requestAnimationFrame(() => setRempli(q.valeur / q.quete.objectif))
    return () => cancelAnimationFrame(image)
  }, [q.valeur, q.quete.objectif])
  return (
    <div className="relative flex min-h-ligne items-center gap-3 px-marge py-3" style={{ ['--retrait' as string]: '62px' }}>
      <span
        className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-tuile text-white ${fetee ? 'quete-pop' : ''}`}
        style={{ background: q.faite ? 'var(--vert-vif)' : couleur, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 2px 4px -2px var(--ombre-relief)' }}
        aria-hidden
      >
        {q.faite ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : <Icone className="h-[17px] w-[17px]" strokeWidth={2.4} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="t-corps flex items-baseline justify-between gap-2">
          <span className={q.faite ? 'text-texte-2' : ''}>{q.quete.titre}</span>
          <span className={`t-sous-titre shrink-0 tabular-nums ${q.faite ? 'font-semibold text-vert' : 'text-texte-2'}`}>
            {q.faite ? 'Faite' : `${q.valeur}/${q.quete.objectif}`}
          </span>
        </p>
        <span
          className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-remplissage"
          role="progressbar"
          aria-valuenow={q.valeur}
          aria-valuemax={q.quete.objectif}
          aria-label={q.quete.titre}
        >
          <span
            className="jauge block h-full rounded-full"
            style={{ width: `${rempli * 100}%`, background: q.faite ? 'var(--vert-vif)' : couleur }}
          />
        </span>
      </div>
      {fetee && (
        <span className="gain-quete t-note pointer-events-none absolute right-marge top-1 rounded-full bg-vert-doux px-2 py-0.5 font-semibold text-vert" aria-hidden>
          +1 verre · {faites}/{total}
        </span>
      )}
    </div>
  )
}

/** Les 3 quêtes du jour ; chacune allume une perle de la théière, les 3 ouvrent la théière (+60 XP). */
export function QuetesDuJour() {
  const { quetes, coffreOuvert } = useJeu()
  const [gagne, setGagne] = useState(0)
  const [arrosage, setArrosage] = useState<{ xpAvant: number; gain: number } | null>(null)
  const fetees = useQuetesFetees(quetes)
  useEffect(() => {
    if (fetees.size > 0) vibrer('leger')
  }, [fetees])
  if (quetes.length === 0) return null
  const faites = quetes.filter((q) => q.faite).length
  const toutes = faites === quetes.length

  return (
    <Section
      titre="Quêtes du jour"
      note={toutes ? undefined : `Termine les ${quetes.length} quêtes pour ouvrir la théière : +${XP_COFFRE} XP. Nouvelles quêtes à minuit.`}
    >
      {quetes.map((q) => (
        <LigneQuete key={q.quete.id} q={q} fetee={fetees.has(q.quete.id)} faites={faites} total={quetes.length} />
      ))}
      <div className="flex items-center gap-3 px-marge py-3">
        <span role="img" aria-label={`Théière : ${faites} quête${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''} sur ${quetes.length}`}>
          <Theiere faites={faites} total={quetes.length} ouverte={coffreOuvert} />
        </span>
        <div className="min-w-0 flex-1 text-right">
          {coffreOuvert ? (
            <p className="t-appel font-semibold text-vert">{gagne > 0 ? `+${gagne} XP, bravo !` : 'Théière ouverte aujourd’hui'}</p>
          ) : toutes ? (
            <Bouton
              variante="plein"
              onClick={async () => {
                // La théière arrose la plante : elle pousse avec l'XP de la théière.
                const xpAvant = await lireXpTotal()
                const gain = await ouvrirCoffre()
                setGagne(gain)
                if (gain > 0) {
                  vibrer('succes')
                  setArrosage({ xpAvant, gain })
                }
              }}
            >
              Ouvrir la théière
            </Bouton>
          ) : (
            <p className="t-sous-titre text-texte-2">
              Théière : {faites}/{quetes.length} · <span className="font-semibold text-energie">+{XP_COFFRE} XP</span>
            </p>
          )}
        </div>
      </div>
      {arrosage && <Arrosage xpAvant={arrosage.xpAvant} gain={arrosage.gain} onFin={() => setArrosage(null)} />}
    </Section>
  )
}
