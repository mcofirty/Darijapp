import donnees from '../data/parler/dialogues.json'

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
