/** Défi du mois : un objectif par mois, un badge à la clé (logique pure, calculé depuis l'historique). */

export type MesureDefi = 'xp' | 'activites' | 'nouveaux'

export interface Defi {
  /** Mois « AAAA-MM ». */
  mois: string
  titre: string
  mesure: MesureDefi
  objectif: number
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Le nom du mois avec son article : « d'octobre », « de mars ». */
export function deMois(mois: string): string {
  const nom = MOIS[Number(mois.slice(5, 7)) - 1]
  return /^[aeiouo]/.test(nom) ? `d’${nom}` : `de ${nom}`
}

/** Le défi d'un mois : les mesures tournent d'un mois à l'autre (XP, activités, nouveaux mots). */
export function defiDuMois(mois: string): Defi {
  const n = Number(mois.slice(5, 7))
  const mesure: MesureDefi = (['xp', 'activites', 'nouveaux'] as const)[n % 3]
  const objectif = { xp: 300, activites: 20, nouveaux: 40 }[mesure]
  const quoi = { xp: `${objectif} XP`, activites: `${objectif} activités`, nouveaux: `${objectif} nouveaux mots` }[mesure]
  return { mois, titre: `Défi ${deMois(mois)} : ${quoi}`, mesure, objectif }
}

/** Activités et XP bonus datés, comme dans les tables `sessions` et `bonus`. */
export interface Datees {
  sessions: { date: string; xp: number; nouveaux: number }[]
  bonus: { date: string; xp: number }[]
}

/** Où en est le défi d'un mois. */
export function valeurDefi(defi: Defi, { sessions, bonus }: Datees): number {
  const duMois = <T extends { date: string }>(l: T[]) => l.filter((x) => x.date.startsWith(defi.mois))
  if (defi.mesure === 'activites') return duMois(sessions).length
  if (defi.mesure === 'nouveaux') return duMois(sessions).reduce((t, s) => t + s.nouveaux, 0)
  return [...duMois(sessions), ...duMois(bonus)].reduce((t, s) => t + s.xp, 0)
}

/** Les mois dont le défi est réussi, du plus ancien au plus récent. */
export function defisReussis(datees: Datees): Defi[] {
  const mois = [...new Set([...datees.sessions, ...datees.bonus].map((s) => s.date.slice(0, 7)))].sort()
  return mois.map(defiDuMois).filter((d) => valeurDefi(d, datees) >= d.objectif)
}
