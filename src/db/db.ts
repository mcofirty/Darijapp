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
  apparence: Apparence
  /** « Ne plus afficher » coché sous l'aide à l'installation sur l'écran d'accueil. */
  masquerAideInstallation: boolean
  /** Meilleur score du Quiz express (bonnes réponses en 60 s). */
  recordExpress: number
  /** Meilleur score de la Chasse aux sons (points en 60 s, combos compris). */
  recordSons: number
  /** Heure du rappel quotidien (« 19:00 »), pour le fichier calendrier. */
  heureRappel: string
  /** Décor choisi au souk : couleur de l'appli, zellige de la carte du jour, pot de la plante. */
  couleur: string
  zellige: string
  pot: string
  /** Jardin (« Mon jardin ») : espèce de la plante, fond, objets affichés autour du pot. */
  espece: string
  fond: string
  objets: string[]
  /** Sons de réponse et confettis du bilan, choisis au souk. */
  sons: string
  confettis: string
  /** XP total la dernière fois que « Mon jardin » a été ouvert : la plante pousse en animation depuis là. */
  jardinXpVu: number | null
  /** Dis-le avec le micro et un score ; sinon, auto-évaluation (mode sans micro). */
  micro: boolean
  /** Distances de mots bien dits par l'utilisateur, pour régler le score sur sa voix. */
  reglageVoix: number[]
}

/** Apparence de l'appli : suit l'iPhone, ou forcée en clair ou en sombre. */
export type Apparence = 'systeme' | 'clair' | 'sombre'

/** Mot ajouté par l'utilisateur depuis la page cachée « #ajout » : les trois champs sont obligatoires. */
export interface MotPerso {
  id: string
  latin: string
  arabe: string
  fr: string
  /** Horodatage de création, pour garder l'ordre d'ajout. */
  creeLe: number
  /** Lieu facultatif écrit par la personne qui a ajouté le mot (ex. « Casablanca »), envoyé avec le mot. */
  lieu?: string
  /** Mot reçu par lien : heure à laquelle l'autre personne l'avait ajouté sur son téléphone. */
  ajouteLe?: number
}

export interface SessionFaite {
  id?: number
  /** Jour local « AAAA-MM-JJ ». */
  date: string
  xp: number
  bonnes: number
  mauvaises: number
  nouveaux: number
  /** Absent pour une session du jour (historique d'avant le Quiz). */
  type?: TypeActivite
}

/** Activité enregistrée dans l'historique : toutes comptent pour l'XP et la série. */
export type TypeActivite = 'session' | 'quiz' | 'express' | 'sons' | 'marchandage' | 'taxi' | 'grammaire' | 'dialogue'

/** Ce qui ne va pas dans un mot signalé. */
export type MotifSignalement = 'traduction' | 'ecriture' | 'prononciation'

/**
 * Favori ou signalement d'un mot (table `marques`, depuis la v4). À part de la progression :
 * marquer un mot jamais vu ne doit pas le compter comme vu ni le retirer des nouveaux mots.
 */
export interface Marque {
  id: string
  favori: boolean
  signale: MotifSignalement | null
  /** Horodatage de la dernière modification. */
  date: number
}

/** Ce qui se passe dans la journée hors activités (table `journal`, depuis la v5). */
export interface Journal {
  /** Jour local « AAAA-MM-JJ ». */
  date: string
  /** Mots entendus en mode écoute (quête « Écoute 10 mots »). */
  ecoutes: number
  /** Théière-coffre ouverte ce jour-là (son XP n'est donné qu'une fois). */
  coffre: boolean
}

/** XP gagnés hors activités : théière-coffre, plus tard trésors (table `bonus`, depuis la v5). */
export interface Bonus {
  id?: number
  date: string
  xp: number
  raison: 'coffre' | 'tresor'
  /** Trésor ouvert (« tresor-tanger ») : chacun ne rapporte qu'une fois. */
  cle?: string
}

/** Article acheté au souk (table `achats`, depuis la v6). */
export interface Achat {
  id: string
  date: string
  prix: number
}

export const PROFIL_DEFAUT: Profil = {
  id: 'moi',
  prenom: '',
  genre: null,
  afficherArabe: true,
  apparence: 'systeme',
  masquerAideInstallation: false,
  recordExpress: 0,
  recordSons: 0,
  heureRappel: '19:00',
  couleur: 'drapeau',
  zellige: 'aucun',
  pot: 'terre',
  espece: 'menthe',
  fond: 'ciel',
  objets: [],
  sons: 'classique',
  confettis: 'papiers',
  jardinXpVu: null,
  micro: true,
  reglageVoix: [],
}

export class DarijaDB extends Dexie {
  progression!: Table<ProgressionMot, string>
  profil!: Table<Profil, string>
  motsPerso!: Table<MotPerso, string>
  sessions!: Table<SessionFaite, number>
  marques!: Table<Marque, string>
  journal!: Table<Journal, string>
  bonus!: Table<Bonus, number>
  achats!: Table<Achat, string>

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
    // v3 : mots ajoutés par l'utilisateur (index sur la date de création). Aucune donnée existante n'est touchée.
    this.version(3).stores({
      motsPerso: 'id, creeLe',
    })
    // v4 : favoris et mots signalés. Ajout de table seul : rien n'est perdu.
    this.version(4).stores({
      marques: 'id',
    })
    // v5 : journal du jour (écoutes, théière) et XP bonus. Ajout de tables seul : rien n'est perdu.
    this.version(5).stores({
      journal: 'date',
      bonus: '++id, date',
    })
    // v6 : achats du souk. Ajout de table seul : rien n'est perdu.
    this.version(6).stores({
      achats: 'id',
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
