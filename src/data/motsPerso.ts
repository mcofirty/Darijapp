import type { MotPerso } from '../db/db'
import type { Mot } from './types'

/** Thème des mots ajoutés par l'utilisateur (absent de THEMES : pas de fichier JSON). */
export const THEME_PERSO = 'mes-mots'

const ARABE = /[؀-ۿ]/
const LETTRE_LATINE = /[a-z]/i
// Même alphabet que les mots du programme : lettres, chiffres 3 7 9 de la translittération, ponctuation simple.
const LATIN_AUTORISE = /^[a-z379 ?!.,'’—/-]+$/i

const CORRESPONDANCES: [string, string][] = [
  ['ح', '7'],
  ['ع', '3'],
  ['ق', '9'],
  ['خ', 'kh'],
  ['غ', 'gh'],
  ['ش', 'ch'],
]

export interface ChampsMot {
  latin: string
  arabe: string
  fr: string
}

/** Ce qui accompagne un mot envoyé par lien : quand et d'où il a été ajouté (facultatif). */
export interface Provenance {
  ajouteLe?: number
  lieu?: string
}

export type MotRecu = ChampsMot & Provenance

export interface ErreursMot {
  latin?: string
  arabe?: string
  fr?: string
}

function compter(texte: string, motif: string): number {
  return texte.split(motif).length - 1
}

/**
 * Vérifie un mot saisi : les trois champs sont obligatoires, le latin n'emploie que la translittération
 * du programme, l'arabe ne contient que de l'arabe, et chaque lettre 3 7 9 kh gh ch correspond des deux côtés.
 */
export function validerMot({ latin, arabe, fr }: ChampsMot): ErreursMot {
  const erreurs: ErreursMot = {}
  const l = latin.trim()
  const a = arabe.trim()
  if (!fr.trim()) erreurs.fr = 'Écris la traduction en français.'
  if (!l) erreurs.latin = 'Écris le mot avec nos lettres.'
  else if (!LATIN_AUTORISE.test(l)) erreurs.latin = 'Lettres a–z, chiffres 3, 7 et 9 seulement.'
  if (!a) erreurs.arabe = 'Écris le mot avec les lettres arabes.'
  else if (!ARABE.test(a) || LETTRE_LATINE.test(a)) erreurs.arabe = 'Utilise uniquement des lettres arabes.'
  if (!erreurs.latin && !erreurs.arabe) {
    for (const [lettre, code] of CORRESPONDANCES) {
      if (compter(l.toLowerCase(), code) !== compter(a, lettre)) {
        erreurs.latin = `Le ${lettre} s'écrit « ${code} » : vérifie qu'il est présent des deux côtés.`
        break
      }
    }
  }
  return erreurs
}

export function motValide(champs: ChampsMot): boolean {
  return Object.keys(validerMot(champs)).length === 0
}

/** Un mot ajouté devient un mot comme les autres ; sans MP3, la lecture passe par la synthèse vocale. */
export function versMot(perso: MotPerso): Mot {
  return {
    id: perso.id,
    latin: perso.latin,
    arabe: perso.arabe,
    fr: perso.fr,
    theme: THEME_PERSO,
    niveau: 1,
    prononciation: '',
    audio: `audio/${perso.id}.mp3`,
    exemple: { latin: '', arabe: '', fr: '', audio: '' },
  }
}

/** Mots ajoutés d'abord (l'utilisateur les veut en priorité), puis le programme. */
export function assemblerMots(perso: MotPerso[], programme: Mot[]): Mot[] {
  const tries = [...perso].sort((a, b) => a.creeLe - b.creeLe).map(versMot)
  return [...tries, ...programme]
}

const PREFIXE_LIEN = '#mot='
const LONGUEUR_MAX = 80
export const LONGUEUR_MAX_LIEU = 60

/**
 * Adresse qui propose un mot : « <adresse de l'appli>#mot=[latin, arabe, français, ajouté le, lieu] ».
 * L'heure et le lieu sont ceux de l'ajout sur le téléphone de la personne qui envoie.
 */
export function lienDeMot(adresseAppli: string, { latin, arabe, fr, ajouteLe, lieu }: MotRecu): string {
  const valeur = [latin.trim(), arabe.trim(), fr.trim(), ajouteLe ?? null, lieu?.trim() ?? '']
  return adresseAppli.split('#')[0] + PREFIXE_LIEN + encodeURIComponent(JSON.stringify(valeur))
}

function textesValides(valeurs: unknown[]): valeurs is string[] {
  return valeurs.every((v) => typeof v === 'string' && v.length <= LONGUEUR_MAX)
}

/**
 * Lit un mot proposé dans le hash de l'adresse ; null si absent, mal formé ou invalide.
 * Accepte aussi les liens d'avant l'heure et le lieu (trois valeurs).
 */
export function motDuLien(hash: string): MotRecu | null {
  if (!hash.startsWith(PREFIXE_LIEN)) return null
  try {
    const valeur: unknown = JSON.parse(decodeURIComponent(hash.slice(PREFIXE_LIEN.length)))
    if (!Array.isArray(valeur) || (valeur.length !== 3 && valeur.length !== 5)) return null
    const [ajouteLe, lieu] = (valeur as unknown[]).slice(3)
    const textes = (valeur as unknown[]).slice(0, 3)
    if (!textesValides(textes)) return null
    const [latin, arabe, fr] = textes
    const champs: MotRecu = { latin: latin.trim(), arabe: arabe.trim(), fr: fr.trim() }
    if (!motValide(champs)) return null
    if (valeur.length === 5) {
      if (ajouteLe !== null && !(typeof ajouteLe === 'number' && Number.isFinite(ajouteLe) && ajouteLe > 0)) return null
      if (typeof lieu !== 'string' || lieu.length > LONGUEUR_MAX_LIEU) return null
      if (ajouteLe !== null) champs.ajouteLe = ajouteLe
      if (lieu.trim()) champs.lieu = lieu.trim()
    }
    return champs
  } catch {
    return null
  }
}

/** « Ajouté le 13 octobre à 14 h 32, à Casablanca » (heure du téléphone qui affiche) ; null sans rien à dire. */
export function decrireProvenance({ ajouteLe, lieu }: Provenance): string | null {
  const morceaux: string[] = []
  if (ajouteLe) {
    const d = new Date(ajouteLe)
    const jour = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const minutes = String(d.getMinutes()).padStart(2, '0')
    morceaux.push(`le ${jour} à ${d.getHours()} h ${minutes}`)
  }
  if (lieu?.trim()) morceaux.push(`à ${lieu.trim()}`)
  return morceaux.length ? `Ajouté ${morceaux.join(', ')}` : null
}
