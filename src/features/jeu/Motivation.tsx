import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarCheck, Gauge, Trophy, Wrench, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SONS } from '../../data/sons'
import { db, lireProfil, modifierProfil } from '../../db/db'
import { tousLesMots } from '../../db/motsPerso'
import { reparerSerie, useEtatSerie } from '../../db/serie'
import { mustawa } from '../../gamification/collection'
import { deMois, defiDuMois, defisReussis, valeurDefi, type Defi } from '../../gamification/defis'
import { bilanDeLaSemaine, type BilanSemaine } from '../../gamification/semaine'
import { PRIX_REPARATION } from '../../gamification/serie'
import { dateLocale } from '../../srs/dates'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'

interface Motivation {
  defi: Defi
  valeurDefi: number
  reussis: Defi[]
  mustawa: number
  bilan: BilanSemaine | null
  doubleXpJusqua: number | null
}

/** Défi du mois, défis réussis, mustawa d nnbta, bilan de la semaine et double XP, en direct. */
export function useMotivation(): Motivation | null {
  return (
    useLiveQuery(async () => {
      const aujourdhui = dateLocale()
      const [sessions, bonus, progressions, profil, mots] = await Promise.all([
        db.sessions.toArray(),
        db.bonus.toArray(),
        db.progression.toArray(),
        lireProfil(),
        tousLesMots(),
      ])
      const latin = new Map(mots.map((m) => [m.id, m.latin]))
      const rates = progressions.filter((p) => p.boite === 1 && p.echecs > 0).flatMap((p) => (latin.has(p.id) ? [{ latin: latin.get(p.id)! }] : []))
      const datees = { sessions, bonus }
      const defi = defiDuMois(aujourdhui.slice(0, 7))
      const bilan = bilanDeLaSemaine(sessions, bonus, rates, aujourdhui)
      return {
        defi,
        valeurDefi: valeurDefi(defi, datees),
        reussis: defisReussis(datees),
        mustawa: mustawa(progressions),
        bilan: bilan && profil.bilanSemaineVu !== bilan.lundi ? bilan : null,
        doubleXpJusqua: profil.doubleXpJusqua,
      }
    }, []) ?? null
  )
}

/** Minutes et secondes restantes, mises à jour chaque seconde. */
function useRestant(jusqua: number | null): number {
  const [maintenant, setMaintenant] = useState(Date.now())
  useEffect(() => {
    if (!jusqua || jusqua < Date.now()) return
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [jusqua])
  return jusqua ? Math.max(0, jusqua - maintenant) : 0
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const nomDuJour = (date: string) => {
  const [a, m, j] = date.split('-').map(Number)
  return JOURS[new Date(a, m - 1, j).getDay()]
}

/** En haut d'Apprendre : double XP en cours, série à réparer, bilan de la semaine (le lundi). */
export function AnnoncesDuJour() {
  const m = useMotivation()
  const { reparation } = useEtatSerie()
  const restant = useRestant(m?.doubleXpJusqua ?? null)
  const [reparer, setReparer] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  if (!m) return null
  return (
    <>
      {restant > 0 && (
        <div className="mb-[26px] flex items-center gap-3 rounded-liste bg-[#fff3e0] px-marge py-3 text-[#b45309] dark:bg-[#3d2600] dark:text-[#ffb74d]" role="status">
          <Zap className="h-6 w-6 shrink-0" fill="currentColor" strokeWidth={2} aria-hidden />
          <p className="t-appel flex-1 font-semibold">Double XP encore {Math.floor(restant / 60000)} min {String(Math.floor((restant % 60000) / 1000)).padStart(2, '0')} s</p>
        </div>
      )}
      {reparation && (
        <Section titre="Ta série s’est arrêtée">
          <Ligne
            tuile={<Tuile icone={Wrench} couleur="#1e88e5" />}
            titre={`Répare ta série de ${reparation.serie} jour${reparation.serie > 1 ? 's' : ''}`}
            sousTitre={`${reparation.jours.length === 1 ? 'Hier oublié' : `${reparation.jours.length} jours oubliés`} : ${PRIX_REPARATION} DH, aujourd’hui seulement`}
            chevron
            onClick={() => setReparer(true)}
          />
        </Section>
      )}
      {m.bilan && <CarteBilan bilan={m.bilan} />}
      {reparer && reparation && (
        <Alerte
          titre={`Réparer ta série de ${reparation.serie} jours ?`}
          message={`Les jours oubliés sont couverts, comme par un gel. Coût : ${PRIX_REPARATION} DH.`}
          onAnnuler={() => setReparer(false)}
          actions={[
            { libelle: 'Annuler', role: 'annuler', action: () => setReparer(false) },
            {
              libelle: 'Réparer',
              action: () => {
                setReparer(false)
                void reparerSerie().then(setErreur)
              },
            },
          ]}
        />
      )}
      {erreur && <Alerte titre={erreur} onAnnuler={() => setErreur(null)} actions={[{ libelle: 'OK', action: () => setErreur(null) }]} />}
    </>
  )
}

/** Bilan de la semaine passée, jusqu'à ce qu'on le ferme. */
function CarteBilan({ bilan }: { bilan: BilanSemaine }) {
  return (
    <Section titre="Ta semaine">
      <Ligne tuile={<Tuile icone={CalendarCheck} couleur="#34c759" />} titre="XP gagnés" valeur={bilan.xp} />
      <Ligne titre="Activités" sousTitre={`${bilan.joursActifs} jour${bilan.joursActifs > 1 ? 's' : ''} sur 7`} valeur={bilan.activites} />
      <Ligne titre="Nouveaux mots" valeur={bilan.nouveaux} />
      {bilan.meilleurJour && <Ligne titre="Meilleur jour" valeur={`${nomDuJour(bilan.meilleurJour.date)}, ${bilan.meilleurJour.xp} XP`} />}
      {bilan.sons.length > 0 && <Ligne titre="Sons à retravailler" valeur={bilan.sons.map((l) => `${l} (${SONS.find((x) => x.latin === l)?.arabe ?? ''})`).join(', ')} />}
      <div className="px-marge py-3">
        <Bouton variante="gris" className="w-full" onClick={() => void modifierProfil({ bilanSemaineVu: bilan.lundi })}>
          Bonne semaine !
        </Bouton>
      </div>
    </Section>
  )
}

/** Lignes de « Ma progression » : défi du mois et mustawa d nnbta. */
export function LignesMotivation() {
  const m = useMotivation()
  if (!m) return null
  const fait = Math.min(m.valeurDefi, m.defi.objectif)
  return (
    <>
      <Ligne
        tuile={<Tuile icone={Trophy} couleur="#ff9500" />}
        titre={
          <span className="block">
            <span className="flex items-baseline justify-between gap-2">
              <span>{m.defi.titre.replace(/^Défi [^:]+: /, 'Défi du mois : ')}</span>
              <span className="t-sous-titre shrink-0 text-texte-2">
                {fait}/{m.defi.objectif}
              </span>
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
              <span className="block h-full rounded-full bg-[#ff9500]" style={{ width: `${(fait / m.defi.objectif) * 100}%` }} />
            </span>
          </span>
        }
        sousTitre={fait >= m.defi.objectif ? `Réussi : badge du mois ${deMois(m.defi.mois)} gagné !` : `Un badge à gagner avant la fin du mois`}
      />
      <Ligne
        tuile={<Tuile icone={Gauge} couleur="#006233" />}
        titre="Mustawa d nnbta"
        sousTitre="Le niveau de ta plante : il monte avec les mots retenus"
        valeur={m.mustawa}
      />
    </>
  )
}

/** Progrès : défis du mois réussis (un badge par mois). */
export function DefisReussis() {
  const m = useMotivation()
  if (!m) return null
  return (
    <Section titre="Défis du mois" note="Un défi par mois : XP, activités ou nouveaux mots. Chaque défi réussi reste gagné.">
      <LignesMotivation />
      {m.reussis.map((d) => (
        <Ligne key={d.mois} tuile={<Tuile icone={Trophy} couleur="#e0a800" />} titre={d.titre.replace(/^Défi /, 'Badge ')} />
      ))}
    </Section>
  )
}

