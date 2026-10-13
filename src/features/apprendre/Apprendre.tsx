import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpenText, Coins, Flame, Headphones, Star, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { motsDuTheme } from '../../data'
import { SONS } from '../../data/sons'
import { PAIRES_SONS } from '../../data/pairesSons'
import { THEMES } from '../../data/themes'
import type { Mot } from '../../data/types'
import { db } from '../../db/db'
import { useMarques } from '../../db/marques'
import { useMots } from '../../db/motsPerso'
import { DIRE_PAR_SESSION, composerSession, melanger } from '../../exercices/session'
import { motsDifficiles } from '../../exercices/selections'
import { useResume } from '../../db/useResume'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { VISUELS_THEMES, VISUEL_SONS } from '../../ui/visuels'
import { ModeEcoute } from '../ecoute/ModeEcoute'
import { Plante } from '../jeu/Plante'
import { QuetesDuJour } from '../jeu/QuetesDuJour'
import { Souk } from '../jeu/Souk'
import { MonJardin } from '../jeu/MonJardin'
import { croissance } from '../../gamification/jardin'
import { usePorteMonnaie } from '../../db/souk'
import { useProfil } from '../../db/useProfil'
import { FicheMot } from '../mots/FicheMot'
import { ListeMots } from '../mots/ListeMots'
import { CarteSessionDuJour } from '../session/CarteSessionDuJour'
import { preparerSession, type SessionPrete } from '../session/lancer'
import { Session } from '../session/Session'
import { Grammaire } from '../parler/Grammaire'
import { LECONS_GRAMMAIRE } from '../../exercices/grammaire'
import { GuideSons } from './GuideSons'
import { ListeSpeciale } from './ListeSpeciale'

type Vue =
  | { type: 'accueil' }
  | { type: 'sons' }
  | { type: 'ecoute' }
  | { type: 'favoris' }
  | { type: 'difficiles' }
  | { type: 'souk'; depuisJardin?: boolean }
  | { type: 'jardin' }
  | { type: 'grammaire' }
  | { type: 'theme'; themeId: string }

/** Une révision de favoris ou de mots difficiles reprend 8 mots au hasard. */
const MOTS_PAR_REVISION = 8

/** Pastille de série, à droite du grand titre. */
function Serie() {
  const { serie } = useResume()
  return (
    <span
      className={`t-appel inline-flex items-center gap-1 px-3 py-1 font-semibold ${serie.aujourdhui ? 'text-accent' : 'text-texte-2'}`}
      aria-label={`Série : ${serie.jours} jours`}
    >
      <Flame className="h-4 w-4" strokeWidth={2.5} fill={serie.aujourdhui ? 'currentColor' : 'none'} aria-hidden />
      {serie.jours}
    </span>
  )
}

export function Apprendre() {
  const [vue, setVue] = useState<Vue>({ type: 'accueil' })
  const [mot, setMot] = useState<Mot | null>(null)
  const [session, setSession] = useState<SessionPrete | null>(null)
  const [numero, setNumero] = useState(0)
  const { niveau, xpTotal } = useResume()
  const MOTS = useMots()
  const { solde } = usePorteMonnaie()
  const { pot, espece } = useProfil()
  const marques = useMarques()
  const progressions = useLiveQuery(() => db.progression.toArray(), []) ?? []
  const favoris = MOTS.filter((m) => marques.get(m.id)?.favori)
  const difficiles = motsDifficiles(progressions, MOTS)

  /** Un thème ou le guide des sons s'ouvre en haut de page, même depuis le bas de la liste. */
  function ouvrir(v: Vue) {
    setVue(v)
    window.scrollTo(0, 0)
  }

  async function lancer() {
    setSession(await preparerSession())
    setNumero((n) => n + 1)
  }

  /** Entraînement libre sur une liste : il ne change pas la répétition espacée. */
  function reviser(mots: Mot[]) {
    const choisis = melanger(mots).slice(0, MOTS_PAR_REVISION)
    setSession({ etapes: composerSession([], choisis, MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION, { phrase: true }), nouveaux: 0, entrainement: true })
    setNumero((n) => n + 1)
  }

  if (session)
    return <Session key={numero} {...session} onFermer={() => setSession(null)} onEncore={() => void lancer()} />

  if (vue.type === 'theme') {
    const theme = THEMES.find((t) => t.id === vue.themeId)!
    if (mot) return <FicheMot mot={mot} retour={{ libelle: 'Mots', action: () => setMot(null) }} />
    return (
      <Page titre={theme.titre} retour={{ libelle: 'Apprendre', action: () => setVue({ type: 'accueil' }) }}>
        <ListeMots mots={motsDuTheme(theme.id)} onChoisir={setMot} />
      </Page>
    )
  }

  if (vue.type === 'grammaire') return <Grammaire onRetour={() => setVue({ type: 'accueil' })} />
  if (vue.type === 'sons') return <GuideSons onRetour={() => setVue({ type: 'accueil' })} />
  if (vue.type === 'ecoute') return <ModeEcoute onRetour={() => setVue({ type: 'accueil' })} />
  if (vue.type === 'souk')
    return (
      <Souk
        retour={
          vue.depuisJardin
            ? { libelle: 'Mon jardin', action: () => ouvrir({ type: 'jardin' }) }
            : { libelle: 'Apprendre', action: () => setVue({ type: 'accueil' }) }
        }
      />
    )
  if (vue.type === 'jardin')
    return (
      <MonJardin
        retour={{ libelle: 'Apprendre', action: () => setVue({ type: 'accueil' }) }}
        onSouk={() => ouvrir({ type: 'souk', depuisJardin: true })}
      />
    )
  if (vue.type === 'favoris')
    return (
      <ListeSpeciale
        titre="Mes favoris"
        mots={favoris}
        vide={{ icone: <Star className="h-12 w-12" strokeWidth={1.6} />, titre: 'Aucun favori', texte: 'Touche « Ajouter aux favoris » sur la fiche d’un mot.' }}
        onRetour={() => setVue({ type: 'accueil' })}
        onReviser={reviser}
      />
    )
  if (vue.type === 'difficiles')
    return (
      <ListeSpeciale
        titre="Mots difficiles"
        mots={difficiles}
        vide={{ icone: <TriangleAlert className="h-12 w-12" strokeWidth={1.6} />, titre: 'Aucun mot difficile', texte: 'Les mots que tu rates en session apparaîtront ici.' }}
        onRetour={() => setVue({ type: 'accueil' })}
        onReviser={reviser}
      />
    )

  return (
    <Page titre="Apprendre" accessoire={<Serie />}>
      <CarteSessionDuJour onCommencer={() => void lancer()} />
      <QuetesDuJour />

      <Section titre="Ma progression">
        <Ligne
          tuile={<Plante stade={croissance(xpTotal).stade} avancement={croissance(xpTotal).avancement} espece={espece} pot={pot} taille={48} />}
          titre={
            <span className="block">
              <span className="flex items-baseline justify-between">
                <span>
                  Niveau {niveau.niveau} · <span className="font-semibold">{niveau.nom}</span>
                </span>
                <span className="t-sous-titre text-texte-2">
                  {niveau.xp}/{niveau.objectif} XP
                </span>
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
                <span className="block h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(niveau.xp / niveau.objectif) * 100}%` }} />
              </span>
            </span>
          }
          sousTitre={`${xpTotal} XP au total · Mon jardin`}
          chevron
          onClick={() => ouvrir({ type: 'jardin' })}
        />
        <Ligne
          tuile={<Tuile icone={Coins} couleur="#ffcc00" />}
          titre="Le souk"
          sousTitre="Dépense tes dirhams en décor"
          valeur={`${solde} DH`}
          chevron
          onClick={() => ouvrir({ type: 'souk' })}
        />
      </Section>

      <Section titre="Parler">
        <Ligne
          tuile={<Tuile icone={BookOpenText} couleur="#5856d6" />}
          titre="Grammaire orale"
          sousTitre="ma…ch, dari, ka-, ghadi, le passé, les questions"
          valeur={LECONS_GRAMMAIRE.length}
          chevron
          onClick={() => ouvrir({ type: 'grammaire' })}
        />
      </Section>

      <Section titre="Explorer">
        <Ligne
          tuile={<Tuile icone={Headphones} couleur="#ff3b30" />}
          titre="Mode écoute"
          sousTitre="Tes mots à voix haute, mains libres"
          chevron
          onClick={() => ouvrir({ type: 'ecoute' })}
        />
        <Ligne
          tuile={<Tuile icone={Star} couleur="#ffcc00" />}
          titre="Mes favoris"
          valeur={favoris.length}
          chevron
          onClick={() => ouvrir({ type: 'favoris' })}
        />
        <Ligne
          tuile={<Tuile icone={TriangleAlert} couleur="#ff9500" />}
          titre="Mots difficiles"
          valeur={difficiles.length}
          chevron
          onClick={() => ouvrir({ type: 'difficiles' })}
        />
        <Ligne
          tuile={<Tuile {...VISUEL_SONS} />}
          titre="Les sons du darija"
          sousTitre={SONS.map((s) => s.latin).join(', ')}
          chevron
          onClick={() => ouvrir({ type: 'sons' })}
        />
        {THEMES.map((t) => (
          <Ligne
            key={t.id}
            tuile={<Tuile {...VISUELS_THEMES[t.id]} />}
            titre={t.titre}
            valeur={motsDuTheme(t.id).length}
            chevron
            onClick={() => ouvrir({ type: 'theme', themeId: t.id })}
          />
        ))}
      </Section>
    </Page>
  )
}
