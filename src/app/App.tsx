import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { flushSync } from 'react-dom'
import { useModes, useProfil } from '../db/useProfil'
import { reglerLectureAutomatique } from '../audio/lecteur'
import { motDuLien } from '../data/motsPerso'
import { AjoutMots } from '../features/ajout/AjoutMots'
import { Proposition } from '../features/ajout/Proposition'
import { choisirSons, couperSons } from '../audio/effets'
import { activerHaptique } from '../ui/haptique'
import { modelePresent, ouvrirModele } from '../audio/modeleSons'
import { appliquerGels } from '../db/serie'
import { Apprendre } from '../features/apprendre/Apprendre'
import { AideInstallation } from '../features/onboarding/AideInstallation'
import { Parcours } from '../features/parcours/Parcours'
import { Profil } from '../features/profil/Profil'
import { Progres } from '../features/progres/Progres'
import { Quiz } from '../features/quiz/Quiz'
import { appliquerApparence, appliquerCouleur } from './apparence'
import { BarreOnglets, placerLentille } from './BarreOnglets'
import {
  actionDuBalayage,
  decalageOnglet,
  departGlisse,
  departGlisseOnglet,
  lentillePendantGlisse,
  ongletVise,
  retourValide,
  sensDuBalayage,
} from './glisser'
import { faireRetour, retourDisponible } from './retour'
import { ONGLETS, type Onglet } from './onglets'

interface Toucher {
  x: number
  y: number
  t: number
  // Une page ouverte peut-elle revenir en arrière ? (sinon le balayage change d'onglet)
  retour: boolean
  // Glissement : en attente du premier mouvement, en cours (la page suit le doigt) ou sans objet.
  // Depuis une page ouverte, c'est le retour ; depuis l'accueil d'un onglet, le passage à l'onglet voisin.
  mode: 'attente' | 'glisse' | 'non'
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
  // Change à chaque appui sur l'onglet déjà ouvert : l'onglet repart de sa page d'accueil.
  const [accueil, setAccueil] = useState(0)
  const depart = useRef<Toucher | null>(null)
  const page = useRef<HTMLElement>(null)
  const { apparence, couleur, sons, scorePrecis, effets, haptique } = useProfil()
  useEffect(() => appliquerCouleur(couleur), [couleur])
  useEffect(() => choisirSons(sons), [sons])
  // Sans écoute (réglage ou pause de 15 min) : plus de lecture automatique ni de son de réponse.
  const ecouter = useModes()?.ecouter ?? true
  useEffect(() => {
    reglerLectureAutomatique(ecouter)
    couperSons(!ecouter || !effets)
  }, [ecouter, effets])
  useEffect(() => activerHaptique(haptique), [haptique])
  // Gel de série : utilisé tout seul à l'ouverture si des jours manqués cassent la série.
  useEffect(() => {
    void appliquerGels()
  }, [])
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

  function changer(cible: Onglet, animer = true) {
    const de = ONGLETS.findIndex((o) => o.id === onglet)
    const vers = ONGLETS.findIndex((o) => o.id === cible)
    if (de === vers) {
      // Appui sur l'onglet ouvert : retour à sa page d'accueil, en haut.
      setEntree('')
      setAccueil((n) => n + 1)
      window.scrollTo(0, 0)
      return
    }
    setEntree(!animer ? '' : vers > de ? 'entree-droite' : 'entree-gauche')
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
    depart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp, retour: retourDisponible(), mode: 'attente' }
  }

  /**
   * La page suit le doigt, comme sur iOS : depuis une page ouverte, vers la droite pour revenir ;
   * depuis l'accueil d'un onglet, dans les deux sens pour passer à l'onglet voisin (la lentille suit).
   */
  function deplacerToucher(e: TouchEvent) {
    const d = depart.current
    const el = page.current
    if (!d || !el || d.mode === 'non') return
    const dx = e.touches[0].clientX - d.x
    if (d.mode === 'attente') {
      const dy = e.touches[0].clientY - d.y
      d.mode = d.retour ? departGlisse(dx, dy) : departGlisseOnglet(dx, dy)
      if (d.mode !== 'glisse') return
      el.style.transition = 'none'
      el.style.willChange = 'transform'
      el.style.background = 'var(--fond)'
    }
    if (d.retour) {
      el.style.boxShadow = '-10px 0 28px rgba(0, 0, 0, 0.22)'
      el.style.transform = `translateX(${Math.max(0, dx)}px)`
      return
    }
    const index = ONGLETS.findIndex((o) => o.id === onglet)
    const decalage = decalageOnglet(dx, index, ONGLETS.length)
    el.style.boxShadow = `${decalage < 0 ? 10 : -10}px 0 28px rgba(0, 0, 0, 0.22)`
    el.style.transform = `translateX(${decalage}px)`
    placerLentille(lentillePendantGlisse(decalage, index, window.innerWidth, ONGLETS.length))
  }

  /** Remet la page à sa place, sans animation en cours. */
  function reposer(el: HTMLElement) {
    for (const p of ['transition', 'transform', 'willChange', 'background', 'boxShadow'] as const) el.style[p] = ''
  }

  /** Fin du glissement d'une page d'onglet : l'onglet voisin arrive, ou la page revient à sa place. */
  function finirGlisseOnglet(el: HTMLElement, dx: number, duree: number) {
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const largeur = window.innerWidth
    const index = ONGLETS.findIndex((o) => o.id === onglet)
    const vers = ongletVise(dx, index, ONGLETS.length)
    if (vers === null || !retourValide(Math.abs(dx), largeur, duree)) {
      placerLentille(null)
      el.style.transition = calme ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)'
      el.style.transform = 'translateX(0)'
      window.setTimeout(() => reposer(el), calme ? 0 : 240)
      return
    }
    // La page sort du côté du geste, puis l'onglet voisin arrive de l'autre côté.
    const sens = dx < 0 ? -1 : 1
    el.style.transition = calme ? 'none' : 'transform 0.2s cubic-bezier(0.3, 0.7, 0.4, 1)'
    el.style.transform = `translateX(${sens * largeur}px)`
    window.setTimeout(
      () => {
        flushSync(() => changer(ONGLETS[vers].id, false))
        placerLentille(null)
        const nouvelle = page.current
        if (calme || !nouvelle) return
        nouvelle.style.transition = 'none'
        nouvelle.style.transform = `translateX(${-sens * 30}%)`
        void nouvelle.offsetWidth
        nouvelle.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        nouvelle.style.transform = 'translateX(0)'
        window.setTimeout(() => reposer(nouvelle), 320)
      },
      calme ? 0 : 200,
    )
  }

  function finirGlisse(el: HTMLElement, dx: number, duree: number) {
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const largeur = window.innerWidth
    if (!retourValide(dx, largeur, duree)) {
      // Pas assez tiré : la page revient à sa place.
      el.style.transition = calme ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)'
      el.style.transform = 'translateX(0)'
      window.setTimeout(() => reposer(el), calme ? 0 : 240)
      return
    }
    // La page sort à droite, puis celle d'avant arrive de la gauche en glissant.
    el.style.transition = calme ? 'none' : 'transform 0.2s cubic-bezier(0.3, 0.7, 0.4, 1)'
    el.style.transform = `translateX(${largeur}px)`
    window.setTimeout(
      () => {
        flushSync(() => faireRetour())
        window.scrollTo(0, 0)
        if (calme) return reposer(el)
        el.style.transition = 'none'
        el.style.transform = 'translateX(-22%)'
        void el.offsetWidth
        el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        el.style.transform = 'translateX(0)'
        window.setTimeout(() => reposer(el), 320)
      },
      calme ? 0 : 200,
    )
  }

  function annulerToucher() {
    const d = depart.current
    depart.current = null
    if (d?.mode === 'glisse' && page.current) (d.retour ? finirGlisse : finirGlisseOnglet)(page.current, 0, 1000)
  }

  function finToucher(e: TouchEvent) {
    const d = depart.current
    depart.current = null
    if (!d) return
    const t = e.changedTouches[0]
    if (d.mode === 'glisse' && page.current) return (d.retour ? finirGlisse : finirGlisseOnglet)(page.current, t.clientX - d.x, e.timeStamp - d.t)
    const sens = sensDuBalayage(t.clientX - d.x, t.clientY - d.y, e.timeStamp - d.t)
    if (sens === 0) return
    const action = actionDuBalayage(sens, retourDisponible())
    if (action === 'retour') {
      faireRetour()
      window.scrollTo(0, 0)
      return
    }
    if (action === 'rien') return
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
    <div className="min-h-dvh overflow-x-clip" onTouchStart={debutToucher} onTouchMove={deplacerToucher} onTouchEnd={finToucher} onTouchCancel={annulerToucher}>
      <main ref={page} key={`${onglet}-${accueil}`} className={`pb-32 ${entree}`}>
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
