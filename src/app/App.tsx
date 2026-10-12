import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useProfil } from '../db/useProfil'
import { AjoutMots } from '../features/ajout/AjoutMots'
import { Apprendre } from '../features/apprendre/Apprendre'
import { Parcours } from '../features/parcours/Parcours'
import { Profil } from '../features/profil/Profil'
import { Progres } from '../features/progres/Progres'
import { Quiz } from '../features/quiz/Quiz'
import { appliquerApparence } from './apparence'
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
  const [ajout, setAjout] = useState(window.location.hash === LIEN_AJOUT)
  useEffect(() => {
    const suivre = () => setAjout(window.location.hash === LIEN_AJOUT)
    window.addEventListener('hashchange', suivre)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  const [onglet, setOnglet] = useState<Onglet>('apprendre')
  const [entree, setEntree] = useState<'entree-droite' | 'entree-gauche' | ''>('')
  const depart = useRef<Toucher | null>(null)
  const { apparence } = useProfil()

  useEffect(() => {
    appliquerApparence(apparence)
    // En mode automatique, suivre aussi les changements de l'iPhone (couleur de la barre d'état).
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const suivre = () => appliquerApparence(apparence)
    media.addEventListener('change', suivre)
    return () => media.removeEventListener('change', suivre)
  }, [apparence])

  function fermerAjout() {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setAjout(false)
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

  if (ajout) {
    return (
      <div className="min-h-dvh overflow-x-hidden pb-16">
        <AjoutMots onFermer={fermerAjout} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh overflow-x-hidden" onTouchStart={debutToucher} onTouchEnd={finToucher}>
      <main key={onglet} className={`pb-32 ${entree}`}>
        {onglet === 'apprendre' && <Apprendre />}
        {onglet === 'parcours' && <Parcours />}
        {onglet === 'quiz' && <Quiz />}
        {onglet === 'progres' && <Progres />}
        {onglet === 'profil' && <Profil />}
      </main>
      <BarreOnglets actif={onglet} onChange={changer} />
    </div>
  )
}
