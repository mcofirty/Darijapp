import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useModes, useProfil } from '../db/useProfil'
import { reglerLectureAutomatique } from '../audio/lecteur'
import { motDuLien } from '../data/motsPerso'
import { AjoutMots } from '../features/ajout/AjoutMots'
import { Proposition } from '../features/ajout/Proposition'
import { choisirSons, couperSons } from '../audio/effets'
import { modelePresent, ouvrirModele } from '../audio/modeleSons'
import { Apprendre } from '../features/apprendre/Apprendre'
import { AideInstallation } from '../features/onboarding/AideInstallation'
import { Parcours } from '../features/parcours/Parcours'
import { Profil } from '../features/profil/Profil'
import { Progres } from '../features/progres/Progres'
import { Quiz } from '../features/quiz/Quiz'
import { appliquerApparence, appliquerCouleur } from './apparence'
import { BarreOnglets } from './BarreOnglets'
import { sensDuBalayage } from './glisser'
import { ONGLETS, type Onglet } from './onglets'

interface Toucher {
  x: number
  y: number
  t: number
}

/** Page cachée d'ajout de mots : accessible seulement par le lien « …/Darijapp/#ajout ». */
const LIEN_AJOUT = '#ajout'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const ajout = hash === LIEN_AJOUT
  const proposition = motDuLien(hash)
  useEffect(() => {
    const suivre = () => setHash(window.location.hash)
    window.addEventListener('hashchange', suivre)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  const [onglet, setOnglet] = useState<Onglet>('apprendre')
  const [entree, setEntree] = useState<'entree-droite' | 'entree-gauche' | ''>('')
  const depart = useRef<Toucher | null>(null)
  const { apparence, couleur, sons, scorePrecis } = useProfil()
  useEffect(() => appliquerCouleur(couleur), [couleur])
  useEffect(() => choisirSons(sons), [sons])
  // Sans écoute (réglage ou pause de 15 min) : plus de lecture automatique ni de son de réponse.
  const ecouter = useModes()?.ecouter ?? true
  useEffect(() => {
    reglerLectureAutomatique(ecouter)
    couperSons(!ecouter)
  }, [ecouter])
  // Score précis : le modèle s'ouvre peu après le lancement, pour être prêt au premier Dis-le.
  useEffect(() => {
    if (!scorePrecis) return
    const minuteur = window.setTimeout(() => {
      void modelePresent().then((oui) => {
        if (oui) ouvrirModele().catch(() => {})
      })
    }, 3000)
    return () => window.clearTimeout(minuteur)
  }, [scorePrecis])

  useEffect(() => {
    appliquerApparence(apparence)
    // En mode automatique, suivre aussi les changements de l'iPhone (couleur de la barre d'état).
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const suivre = () => appliquerApparence(apparence)
    media.addEventListener('change', suivre)
    return () => media.removeEventListener('change', suivre)
  }, [apparence])

  function quitterLien() {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setHash('')
    window.scrollTo(0, 0)
  }

  function changer(cible: Onglet) {
    const de = ONGLETS.findIndex((o) => o.id === onglet)
    const vers = ONGLETS.findIndex((o) => o.id === cible)
    if (de === vers) return
    setEntree(vers > de ? 'entree-droite' : 'entree-gauche')
    setOnglet(cible)
    window.scrollTo(0, 0)
  }

  function debutToucher(e: TouchEvent) {
    // Les zones marquées data-sans-balayage (champs, exercices…) gardent leurs gestes.
    const cible = e.target as HTMLElement
    if (e.touches.length !== 1 || cible.closest('[data-sans-balayage], input, textarea')) {
      depart.current = null
      return
    }
    depart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp }
  }

  function finToucher(e: TouchEvent) {
    const d = depart.current
    depart.current = null
    if (!d) return
    const t = e.changedTouches[0]
    const sens = sensDuBalayage(t.clientX - d.x, t.clientY - d.y, e.timeStamp - d.t)
    if (sens === 0) return
    const vers = ONGLETS.findIndex((o) => o.id === onglet) + sens
    if (vers >= 0 && vers < ONGLETS.length) changer(ONGLETS[vers].id)
  }

  if (proposition) {
    return (
      <div className="min-h-dvh overflow-x-clip pb-16">
        <Proposition mot={proposition} onTermine={quitterLien} />
      </div>
    )
  }

  if (ajout) {
    return (
      <div className="min-h-dvh overflow-x-clip pb-16">
        <AjoutMots onOuvrirAppli={quitterLien} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh overflow-x-clip" onTouchStart={debutToucher} onTouchEnd={finToucher}>
      <main key={onglet} className={`pb-32 ${entree}`}>
        {onglet === 'apprendre' && <Apprendre />}
        {onglet === 'parcours' && <Parcours />}
        {onglet === 'quiz' && <Quiz />}
        {onglet === 'progres' && <Progres />}
        {onglet === 'profil' && <Profil />}
      </main>
      <BarreOnglets actif={onglet} onChange={changer} />
      <AideInstallation />
    </div>
  )
}
