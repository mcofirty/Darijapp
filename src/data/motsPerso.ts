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

/** Adresse qui propose un mot : « <adresse de l'appli>#mot=[latin, arabe, français] ». */
export function lienDeMot(adresseAppli: string, { latin, arabe, fr }: ChampsMot): string {
  return adresseAppli.split('#')[0] + PREFIXE_LIEN + encodeURIComponent(JSON.stringify([latin.trim(), arabe.trim(), fr.trim()]))
}

/** Lit un mot proposé dans le hash de l'adresse ; null si absent, mal formé ou invalide. */
export function motDuLien(hash: string): ChampsMot | null {
  if (!hash.startsWith(PREFIXE_LIEN)) return null
  try {
    const valeur: unknown = JSON.parse(decodeURIComponent(hash.slice(PREFIXE_LIEN.length)))
    if (!Array.isArray(valeur) || valeur.length !== 3 || valeur.some((v) => typeof v !== 'string' || v.length > LONGUEUR_MAX)) return null
    const [latin, arabe, fr] = valeur as string[]
    const champs = { latin: latin.trim(), arabe: arabe.trim(), fr: fr.trim() }
    return motValide(champs) ? champs : null
  } catch {
    return null
  }
}
