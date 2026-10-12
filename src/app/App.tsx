import { useRef, useState, type TouchEvent } from 'react'
import { Apprendre } from '../features/apprendre/Apprendre'
import { Parcours } from '../features/parcours/Parcours'
import { Profil } from '../features/profil/Profil'
import { Progres } from '../features/progres/Progres'
import { Quiz } from '../features/quiz/Quiz'
import { BarreOnglets } from './BarreOnglets'
import { sensDuBalayage } from './glisser'
import { ONGLETS, type Onglet } from './onglets'

interface Toucher {
  x: number
  y: number
  t: number
}

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('apprendre')
  const [entree, setEntree] = useState<'entree-droite' | 'entree-gauche' | ''>('')
  const depart = useRef<Toucher | null>(null)

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
