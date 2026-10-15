import { useLiveQuery } from 'dexie-react-hooks'
import { BookMarked, BookOpenText, Gauge, Headphones, MessagesSquare, Star, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { motsDuTheme } from '../../data'
import { PAIRES_SONS } from '../../data/pairesSons'
import { THEMES } from '../../data/themes'
import type { Mot } from '../../data/types'
import { db, modifierProfil } from '../../db/db'
import { TestNiveau } from '../onboarding/TestNiveau'
import { useMarques } from '../../db/marques'
import { useMots } from '../../db/motsPerso'
import { DIRE_PAR_SESSION, composerSession, melanger } from '../../exercices/session'
import { motsDifficiles } from '../../exercices/selections'
import { useResume } from '../../db/useResume'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { BoutonThemes, GrillePratiquer, LigneNiveau } from './BlocsAccueil'
import { TousLesThemes } from './TousLesThemes'
import { Page } from '../../ui/Page'
import { VISUEL_SONS } from '../../ui/visuels'
import { ModeEcoute } from '../ecoute/ModeEcoute'
import { Plante } from '../jeu/Plante'
import { QuetesDuJour } from '../jeu/QuetesDuJour'
import { AnnoncesDuJour } from '../jeu/Motivation'
import { Souk } from '../jeu/Souk'
import { MonJardin } from '../jeu/MonJardin'
import { croissance } from '../../gamification/jardin'
import { useProfil } from '../../db/useProfil'
import { FicheMot } from '../mots/FicheMot'
import { ListeMots } from '../mots/ListeMots'
import { CarteSessionDuJour } from '../session/CarteSessionDuJour'
import { preparerSession, type SessionPrete } from '../session/lancer'
import { Session } from '../session/Session'
import { Dialogues } from '../parler/Dialogues'
import { Histoires } from '../parler/Histoires'
import { Grammaire } from '../parler/Grammaire'
import { SCENES } from '../../exercices/dialogues'
import { HISTOIRES } from '../../exercices/histoires'
import { LECONS_GRAMMAIRE } from '../../exercices/grammaire'
import { GuideSons } from './GuideSons'
import { ListeSpeciale } from './ListeSpeciale'
import { Flamme } from '../../ui/recompenses'

type Vue =
  | { type: 'accueil' }
  | { type: 'sons' }
  | { type: 'ecoute' }
  | { type: 'favoris' }
  | { type: 'difficiles' }
  | { type: 'souk'; depuisJardin?: boolean }
  | { type: 'jardin' }
  | { type: 'grammaire' }
  | { type: 'dialogues' }
  | { type: 'histoires' }
  | { type: 'theme'; themeId: string; depuisListe?: boolean }
  | { type: 'themes' }
  | { type: 'test' }

/** Une révision de favoris ou de mots difficiles reprend 8 mots au hasard. */
const MOTS_PAR_REVISION = 8

/** Pastille de série, à droite du grand titre : la flamme grandit avec la série, ternie tant qu'elle n'est pas sécurisée. */
function Serie() {
  const { serie } = useResume()
  return (
    <span
      className={`t-appel inline-flex items-center gap-1 px-3 py-1 font-semibold tabular-nums ${serie.aujourdhui ? 'text-energie' : 'text-texte-2'}`}
      aria-label={`Série : ${serie.jours} jours${serie.aujourdhui ? ', sécurisée aujourd’hui' : ''}`}
    >
      <Flamme jours={serie.jours} active={serie.aujourdhui} taille={17} />
      {serie.jours}
    </span>
  )
}

export function Apprendre() {
  const [vue, setVue] = useState<Vue>({ type: 'accueil' })
  const [mot, setMot] = useState<Mot | null>(null)
  const [session, setSession] = useState<SessionPrete | null>(null)
  const [numero, setNumero] = useState(0)
  const { xpTotal } = useResume()
  const MOTS = useMots()
  const { pot, espece, testNiveau } = useProfil()
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
    setSession({ etapes: composerSession([], choisis, MOTS, Math.random, PAIRES_SONS, DIRE_PAR_SESSION, { phrase: true, trou: true }), nouveaux: 0, entrainement: true })
    setNumero((n) => n + 1)
  }

  if (session)
    return <Session key={numero} {...session} onFermer={() => setSession(null)} onEncore={() => void lancer()} />

  if (vue.type === 'theme') {
    const theme = THEMES.find((t) => t.id === vue.themeId)!
    if (mot) return <FicheMot mot={mot} retour={{ libelle: 'Mots', action: () => setMot(null) }} />
    return (
      <Page
        titre={theme.titre}
        retour={
          vue.depuisListe
            ? { libelle: 'Thèmes', action: () => ouvrir({ type: 'themes' }) }
            : { libelle: 'Apprendre', action: () => setVue({ type: 'accueil' }) }
        }
      >
        <ListeMots mots={motsDuTheme(theme.id)} onChoisir={setMot} />
      </Page>
    )
  }

  if (vue.type === 'themes') {
    if (mot) return <FicheMot mot={mot} retour={{ libelle: 'Thèmes', action: () => setMot(null) }} />
    return (
      <TousLesThemes
        favoris={favoris.length}
        onRetour={() => setVue({ type: 'accueil' })}
        onTheme={(id) => ouvrir({ type: 'theme', themeId: id, depuisListe: true })}
        onFavoris={() => ouvrir({ type: 'favoris' })}
        onMot={setMot}
      />
    )
  }
  if (vue.type === 'test') return <TestNiveau onRetour={() => setVue({ type: 'accueil' })} />
  if (vue.type === 'dialogues') return <Dialogues onRetour={() => setVue({ type: 'accueil' })} />
  if (vue.type === 'histoires') return <Histoires onRetour={() => setVue({ type: 'accueil' })} />
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
        retour="Thèmes"
        onRetour={() => ouvrir({ type: 'themes' })}
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
      <AnnoncesDuJour />
      {progressions.length === 0 && testNiveau === null && (
        <Section titre="Tu connais déjà un peu de darija ?" note="Le test fait passer en révision les mots que tu connais : ils ne te seront pas présentés comme nouveaux.">
          <Ligne tuile={<Tuile icone={Gauge} couleur="#5856d6" />} titre="Passer le test de niveau" sousTitre="3 questions par étape, 5 minutes au plus" chevron onClick={() => ouvrir({ type: 'test' })} />
          <Ligne titre="Je débute" sousTitre="Commencer par le début du programme" chevron onClick={() => void modifierProfil({ testNiveau: 'refuse' })} />
        </Section>
      )}
      <CarteSessionDuJour onCommencer={() => void lancer()} />
      <QuetesDuJour compacte />

      <GrillePratiquer
        raccourcis={[
          { id: 'dialogues', titre: 'Dialogues', detail: `${SCENES.length} scènes`, icone: MessagesSquare, couleur: '#12a06a', action: () => ouvrir({ type: 'dialogues' }) },
          { id: 'histoires', titre: 'Histoires', detail: `${HISTOIRES.length} récits`, icone: BookMarked, couleur: '#f5a524', action: () => ouvrir({ type: 'histoires' }) },
          { id: 'grammaire', titre: 'Grammaire', detail: `${LECONS_GRAMMAIRE.length} fiches`, icone: BookOpenText, couleur: '#7a5af5', action: () => ouvrir({ type: 'grammaire' }) },
          { id: 'ecoute', titre: 'Écoute', detail: 'Mains libres', icone: Headphones, couleur: '#2f8fe0', action: () => ouvrir({ type: 'ecoute' }) },
          {
            id: 'difficiles',
            titre: 'À revoir',
            detail: difficiles.length > 0 ? `${difficiles.length} mot${difficiles.length > 1 ? 's' : ''}` : 'Aucun mot',
            icone: TriangleAlert,
            couleur: '#e5533c',
            badge: difficiles.length,
            action: () => ouvrir({ type: 'difficiles' }),
          },
          { id: 'sons', titre: 'Les sons', detail: '3, 7, 9, kh, gh', icone: VISUEL_SONS.icone, couleur: VISUEL_SONS.couleur, action: () => ouvrir({ type: 'sons' }) },
        ]}
      />

      <LigneNiveau
        onClick={() => ouvrir({ type: 'jardin' })}
        plante={<Plante stade={croissance(xpTotal).stade} avancement={croissance(xpTotal).avancement} espece={espece} pot={pot} taille={40} />}
      />

      <BoutonThemes onClick={() => ouvrir({ type: 'themes' })} />
    </Page>
  )
}
