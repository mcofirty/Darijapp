export type Onglet = 'apprendre' | 'parcours' | 'quiz' | 'progres' | 'profil'

export const ONGLETS: { id: Onglet; libelle: string }[] = [
  { id: 'apprendre', libelle: 'Apprendre' },
  { id: 'parcours', libelle: 'Parcours' },
  { id: 'quiz', libelle: 'Quiz' },
  { id: 'progres', libelle: 'Progrès' },
  { id: 'profil', libelle: 'Profil' },
]
