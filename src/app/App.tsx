import { useState } from 'react'
import { Apprendre } from '../features/apprendre/Apprendre'
import { Parcours } from '../features/parcours/Parcours'
import { Profil } from '../features/profil/Profil'
import { Progres } from '../features/progres/Progres'
import { Quiz } from '../features/quiz/Quiz'
import { BarreOnglets } from './BarreOnglets'
import { EnTete } from './EnTete'
import type { Onglet } from './onglets'

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('apprendre')

  return (
    <div className="min-h-dvh">
      <EnTete />
      <main className="mx-auto max-w-xl px-4 pb-28 pt-4">
        {onglet === 'apprendre' && <Apprendre />}
        {onglet === 'parcours' && <Parcours />}
        {onglet === 'quiz' && <Quiz />}
        {onglet === 'progres' && <Progres />}
        {onglet === 'profil' && <Profil />}
      </main>
      <BarreOnglets actif={onglet} onChange={setOnglet} />
    </div>
  )
}
