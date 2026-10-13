import donnees from '../data/parler/dialogues.json'
import { melanger } from './session'

/** Dialogues courts (logique pure) : on écoute une scène, puis on y tient son rôle avec Dis-le. */

export interface TexteReplique {
  id: string
  latin: string
  arabe: string
  fr: string
  audio: string
}

export interface Replique extends TexteReplique {
  /** `moi` : la réplique de l'utilisateur ; `autre` : celle du personnage, lue par la voix. */
  qui: 'moi' | 'autre'
  /** Version quand l'utilisateur est une femme (elle parle d'elle, ou on s'adresse à elle). */
  feminin?: TexteReplique
}

export interface Scene {
  id: string
  titre: string
  /** Situation, en une phrase. */
  contexte: string
  /** Le personnage à qui l'on parle (« Le serveur »). */
  autre: string
  repliques: Replique[]
}

export const SCENES = donnees.scenes as Scene[]

/** Le texte d'une réplique accordé au genre de l'utilisateur (masculin par défaut). */
export function accorder(replique: Replique, genre: 'm' | 'f' | null): TexteReplique & { qui: Replique['qui'] } {
  const texte = genre === 'f' && replique.feminin ? replique.feminin : replique
  return { id: texte.id, latin: texte.latin, arabe: texte.arabe, fr: texte.fr, audio: texte.audio, qui: replique.qui }
}

/** Les répliques de la scène, accordées au genre. */
export function repliquesDe(scene: Scene, genre: 'm' | 'f' | null) {
  return scene.repliques.map((r) => accorder(r, genre))
}

/** Nombre de répliques à dire dans la scène. */
export function aDire(scene: Scene): number {
  return scene.repliques.filter((r) => r.qui === 'moi').length
}

/** Meilleurs résultats par scène (répliques réussies), mis à jour si la partie fait mieux. */
export function meilleurResultat(meilleurs: Record<string, number>, sceneId: string, reussies: number): Record<string, number> {
  return reussies > (meilleurs[sceneId] ?? -1) ? { ...meilleurs, [sceneId]: reussies } : meilleurs
}

/**
 * Sans parler : la réplique à retrouver parmi 4 répliques à dire, les leurres pris d'abord dans la scène,
 * puis dans les autres scènes (graphies et traductions toutes différentes), accordés au genre.
 */
export function propositionsReplique(
  replique: TexteReplique,
  scene: Scene,
  genre: 'm' | 'f' | null,
  alea: () => number = Math.random,
): TexteReplique[] {
  const aDireDe = (s: Scene) => repliquesDe(s, genre).filter((r) => r.qui === 'moi')
  const autresScenes = melanger(SCENES.filter((s) => s.id !== scene.id).flatMap(aDireDe), alea)
  const leurres: TexteReplique[] = []
  for (const r of [...melanger(aDireDe(scene), alea), ...autresScenes]) {
    if (leurres.length === 3) break
    const deja = [replique, ...leurres]
    if (!deja.some((l) => l.latin === r.latin || l.fr === r.fr)) leurres.push(r)
  }
  return melanger([replique, ...leurres], alea).map(({ id, latin, arabe, fr, audio }) => ({ id, latin, arabe, fr, audio }))
}
