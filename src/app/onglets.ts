export type Onglet = 'apprendre' | 'parcours' | 'quiz' | 'progres' | 'profil'

export const ONGLETS: { id: Onglet; libelle: string; icone: string }[] = [
  { id: 'apprendre', libelle: 'Apprendre', icone: '📖' },
  { id: 'parcours', libelle: 'Parcours', icone: '🧭' },
  { id: 'quiz', libelle: 'Quiz', icone: '❓' },
  { id: 'progres', libelle: 'Progrès', icone: '🌱' },
  { id: 'profil', libelle: 'Profil', icone: '👤' },
]
