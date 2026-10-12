import Dexie, { type Table } from 'dexie'

export interface ProgressionMot {
  id: string
  boite: number
  prochaineRevision: string
  reussites: number
  echecs: number
  scores: number[]
  favori: boolean
  signale: boolean
  audioPerso: Blob | null
}

export interface Profil {
  id: 'moi'
  prenom: string
  genre: 'm' | 'f' | null
  afficherArabe: boolean
}

export interface MotPerso {
  id: string
  latin: string
  fr: string
  arabe: string | null
  audio: Blob | null
}

export interface SessionFaite {
  id?: number
  /** Jour local « AAAA-MM-JJ ». */
  date: string
  xp: number
  bonnes: number
  mauvaises: number
  nouveaux: number
}

export const PROFIL_DEFAUT: Profil = {
  id: 'moi',
  prenom: '',
  genre: null,
  afficherArabe: true,
}

export class DarijaDB extends Dexie {
  progression!: Table<ProgressionMot, string>
  profil!: Table<Profil, string>
  motsPerso!: Table<MotPerso, string>
  sessions!: Table<SessionFaite, number>

  constructor(nom = 'darijapp') {
    super(nom)
    this.version(1).stores({
      progression: 'id, prochaineRevision',
      profil: 'id',
      motsPerso: 'id',
    })
    // v2 : historique des sessions (XP, série). Ajout de table seul : rien n'est perdu.
    this.version(2).stores({
      sessions: '++id, date',
    })
  }
}

export const db = new DarijaDB()

export async function lireProfil(base: DarijaDB = db): Promise<Profil> {
  const profil = await base.profil.get('moi')
  return { ...PROFIL_DEFAUT, ...profil }
}

export async function modifierProfil(changements: Partial<Omit<Profil, 'id'>>, base: DarijaDB = db): Promise<Profil> {
  const profil = { ...(await lireProfil(base)), ...changements }
  await base.profil.put(profil)
  return profil
}
