import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Gem, Lock, MapPin, Stamp } from 'lucide-react'
import { useState } from 'react'
import { PAIRES_SONS } from '../../data/pairesSons'
import { THEMES } from '../../data/themes'
import { db } from '../../db/db'
import { ouvrirTresor } from '../../db/journal'
import { useMots } from '../../db/motsPerso'
import { DIRE_PAR_SESSION, composerSession, melanger } from '../../exercices/session'
import { ETAPES, XP_TRESOR, cleTresor, etatsDuVoyage, planDeLecon, prochaineEtape, tresorOuvrable, type EtatEtape } from '../../gamification/voyage'
import { dateLocale } from '../../srs/dates'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import type { SessionPrete } from '../session/lancer'
import { Session } from '../session/Session'
import { Passeport } from './Passeport'

/** Décalage horizontal des nœuds, en pt : le chemin serpente comme une route. */
const DECALAGES = [0, 70, 100, 70, 0, -70, -100, -70]
const HAUTEUR_ETAPE = 128
const HAUTEUR_TRESOR = 88
/** Largeur de référence de la carte : sur un écran plus étroit, tout se resserre à la même échelle. */
const LARGEUR = 360

type Vue = { type: 'carte' } | { type: 'etape'; index: number } | { type: 'passeport' }

/** Anneau de progression autour d'une étape : part des mots retenus. */
function Anneau({ part, taille, clair }: { part: number; taille: number; clair: boolean }) {
  const r = taille / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <svg width={taille} height={taille} className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke={clair ? 'rgba(255,255,255,0.3)' : 'var(--remplissage)'} strokeWidth="5" />
      <circle
        cx={taille / 2}
        cy={taille / 2}
        r={r}
        fill="none"
        stroke={clair ? '#fff' : 'var(--accent)'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${c * part} ${c}`}
      />
    </svg>
  )
}

export function Parcours() {
  const MOTS = useMots()
  const progressions = useLiveQuery(() => db.progression.toArray(), [])
  const bonus = useLiveQuery(() => db.bonus.toArray(), [])
  const [vue, setVue] = useState<Vue>({ type: 'carte' })
  const [session, setSession] = useState<(SessionPrete & { numero: number; etape: number }) | null>(null)
  const [gain, setGain] = useState<string | null>(null)

  const etats = etatsDuVoyage(MOTS, progressions ?? [])
  const ouverts = new Set((bonus ?? []).map((b) => b.cle).filter((c): c is string => !!c))
  const conseillee = prochaineEtape(etats)
  const tampons = etats.filter((e) => e.tampon).length

  function lancerLecon(index: number) {
    const plan = planDeLecon(ETAPES[index], MOTS, progressions ?? [], dateLocale())
    const entrainement = plan.entrainement.length > 0
    const etapes = entrainement
      ? composerSession([], melanger(plan.entrainement).slice(0, 8), MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION)
      : composerSession(plan.nouveaux, plan.revisions, MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION)
    setSession((s) => ({ etapes, nouveaux: plan.nouveaux.length, entrainement, numero: (s?.numero ?? 0) + 1, etape: index }))
  }

  async function ouvrir(i: number) {
    const xp = await ouvrirTresor(cleTresor(i), XP_TRESOR)
    if (xp > 0) setGain(`Trésor de ${ETAPES[i].ville} : +${xp} XP !`)
  }

  if (session)
    return (
      <Session
        key={session.numero}
        etapes={session.etapes}
        nouveaux={session.nouveaux}
        entrainement={session.entrainement}
        onFermer={() => setSession(null)}
        onEncore={() => lancerLecon(session.etape)}
      />
    )

  if (vue.type === 'passeport') return <Passeport etats={etats} onRetour={() => setVue({ type: 'carte' })} />

  if (vue.type === 'etape') {
    const e = etats[vue.index]
    return (
      <Page titre={e.etape.ville} retour={{ libelle: 'Parcours', action: () => setVue({ type: 'carte' }) }}>
        <section className="mb-[26px] rounded-carte bg-carte p-marge">
          <p className="t-note font-semibold uppercase text-accent">
            Étape {vue.index + 1} sur {ETAPES.length}
            {e.tampon ? ' · tampon obtenu' : ''}
          </p>
          <h2 className="t-titre-2 mt-1">{e.etape.sujet}</h2>
          <p className="t-sous-titre mt-1 text-texte-2">
            {e.vus}/{e.total} mots vus · {e.retenus} retenus. Le tampon arrive à {Math.ceil(e.total * 0.8)} mots retenus.
          </p>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(e.retenus / Math.max(1, e.total)) * 100}%` }} />
          </span>
          <Bouton grand className="mt-4 w-full" onClick={() => lancerLecon(vue.index)}>
            {e.vus === e.total ? 'Réviser cette étape' : 'Commencer une leçon'}
          </Bouton>
        </section>
        <Section titre="Thèmes de l’étape">
          {e.etape.themes.map((t) => {
            const mots = MOTS.filter((m) => m.theme === t)
            const vus = mots.filter((m) => (progressions ?? []).some((p) => p.id === m.id)).length
            return <Ligne key={t} titre={THEMES.find((x) => x.id === t)?.titre ?? t} valeur={`${vus}/${mots.length}`} />
          })}
        </Section>
      </Page>
    )
  }

  // Positions des nœuds sur la carte : une étape, puis un trésor, et ainsi de suite.
  const noeuds: { type: 'etape' | 'tresor'; index: number; y: number; x: number }[] = []
  let y = 0
  ETAPES.forEach((_, i) => {
    noeuds.push({ type: 'etape', index: i, y: y + 44, x: DECALAGES[(2 * i) % DECALAGES.length] })
    y += HAUTEUR_ETAPE
    if (i < ETAPES.length - 1) {
      noeuds.push({ type: 'tresor', index: i, y: y + 30, x: DECALAGES[(2 * i + 1) % DECALAGES.length] })
      y += HAUTEUR_TRESOR
    }
  })

  return (
    <Page titre="Parcours">
      <Section>
        <Ligne
          tuile={<Tuile icone={Stamp} couleur="#c1272d" />}
          titre="Mon passeport"
          sousTitre={`${tampons} tampon${tampons > 1 ? 's' : ''} sur ${ETAPES.length} · ${ouverts.size} trésor${ouverts.size > 1 ? 's' : ''}`}
          chevron
          onClick={() => setVue({ type: 'passeport' })}
        />
      </Section>
      {gain && (
        <p className="t-appel mb-4 rounded-liste bg-vert-doux px-marge py-3 font-semibold text-vert" role="status">
          {gain}
        </p>
      )}
      <div className="relative mx-auto mb-10 w-full" style={{ height: y, maxWidth: LARGEUR }}>
        {/* Route en pointillés reliant les nœuds (même échelle horizontale que les nœuds). */}
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${LARGEUR} ${y}`} preserveAspectRatio="none" aria-hidden>
          <polyline
            points={noeuds.map((n) => `${LARGEUR / 2 + n.x},${n.y}`).join(' ')}
            vectorEffect="non-scaling-stroke"
            fill="none"
            stroke="var(--separateur)"
            strokeWidth="4"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>
        {noeuds.map((n) =>
          n.type === 'etape' ? (
            <NoeudEtape
              key={`e${n.index}`}
              etat={etats[n.index]}
              conseillee={n.index === conseillee}
              style={{ left: `${((LARGEUR / 2 + n.x) / LARGEUR) * 100}%`, top: n.y }}
              onClick={() => setVue({ type: 'etape', index: n.index })}
            />
          ) : (
            <NoeudTresor
              key={`t${n.index}`}
              ouvert={ouverts.has(cleTresor(n.index))}
              ouvrable={tresorOuvrable(n.index, etats, ouverts)}
              style={{ left: `${((LARGEUR / 2 + n.x) / LARGEUR) * 100}%`, top: n.y }}
              onClick={() => void ouvrir(n.index)}
            />
          ),
        )}
      </div>
    </Page>
  )
}

function NoeudEtape({ etat, conseillee, style, onClick }: { etat: EtatEtape; conseillee: boolean; style: React.CSSProperties; onClick: () => void }) {
  const part = etat.total > 0 ? etat.retenus / etat.total : 0
  return (
    <div className="absolute flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={style}>
      {conseillee && <span className="t-legende mb-1 rounded-full bg-accent-plein px-2 py-0.5 font-semibold text-white">Prochaine étape</span>}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${etat.etape.ville} : ${etat.retenus} mots retenus sur ${etat.total}${etat.tampon ? ', tampon obtenu' : ''}`}
        className={`pressable relative flex h-[72px] w-[72px] items-center justify-center rounded-full ${
          etat.tampon ? 'bg-vert-plein text-white' : conseillee ? 'bg-accent-plein text-white' : 'bg-carte text-accent'
        }`}
      >
        {!etat.tampon && part > 0 && <Anneau part={part} taille={72} clair={conseillee} />}
        {etat.tampon ? <Check className="h-8 w-8" strokeWidth={3} aria-hidden /> : <MapPin className="relative h-8 w-8" strokeWidth={2.4} aria-hidden />}
      </button>
      <span className="t-gras mt-1.5 rounded-md bg-fond px-1">{etat.etape.ville}</span>
      <span className="t-legende rounded-md bg-fond px-1 text-texte-2">
        {etat.retenus}/{etat.total} retenus
      </span>
    </div>
  )
}

function NoeudTresor({ ouvert, ouvrable, style, onClick }: { ouvert: boolean; ouvrable: boolean; style: React.CSSProperties; onClick: () => void }) {
  return (
    // Le décalage est sur l'enveloppe : le bouton peut grossir au toucher sans perdre sa place.
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      <button
        type="button"
        onClick={onClick}
        disabled={!ouvrable}
        aria-label={ouvert ? 'Trésor ouvert' : ouvrable ? `Ouvrir le trésor : +${XP_TRESOR} XP` : 'Trésor : obtiens le tampon de l’étape d’avant'}
        className={`pressable flex h-[52px] w-[52px] items-center justify-center rounded-full ${
          ouvrable ? 'tresor-pret bg-[#ffcc00] text-white' : ouvert ? 'bg-[#ffcc00]/30 text-[#b38600]' : 'bg-remplissage text-texte-3'
        }`}
      >
        {ouvert ? <Check className="h-6 w-6" strokeWidth={3} aria-hidden /> : ouvrable ? <Gem className="h-6 w-6" strokeWidth={2.4} aria-hidden /> : <Lock className="h-5 w-5" strokeWidth={2.4} aria-hidden />}
      </button>
    </div>
  )
}
