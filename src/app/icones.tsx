import { BookOpen, ChartNoAxesColumn, Map as IconeCarte, Brain, UserRound } from 'lucide-react'
import type { Onglet } from './onglets'

const ICONES = {
  apprendre: BookOpen,
  parcours: IconeCarte,
  quiz: Brain,
  progres: ChartNoAxesColumn,
  profil: UserRound,
}

/** Icônes de la barre d'onglets : traits fins de 22 pt, un peu plus épais pour l'onglet actif. */
export function IconeOnglet({ onglet, actif = false }: { onglet: Onglet; actif?: boolean }) {
  const Icone = ICONES[onglet]
  return <Icone className="h-[22px] w-[22px]" strokeWidth={actif ? 2.4 : 1.9} aria-hidden />
}
