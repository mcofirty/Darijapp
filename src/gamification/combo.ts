/** Combo dans les sessions : à partir de la 5e bonne réponse d'affilée, chacune rapporte 1 XP de plus (logique pure). */

export const COMBO_DEPART = 5
export const XP_COMBO = 1

export class Combo {
  /** Bonnes réponses d'affilée. */
  suite = 0
  /** XP de bonus gagné. */
  bonus = 0

  /** Note une réponse ; rend la suite quand elle atteint un palier à fêter (5, 10, 15…), sinon null. */
  noter(juste: boolean): number | null {
    if (!juste) {
      this.suite = 0
      return null
    }
    this.suite++
    if (this.suite >= COMBO_DEPART) this.bonus += XP_COMBO
    return this.suite % COMBO_DEPART === 0 ? this.suite : null
  }
}

/** Double XP : 15 minutes après la théière ou un trésor. */
export const DUREE_DOUBLE_XP = 15 * 60 * 1000

export function multiplicateurXp(maintenant: number, doubleJusqua: number | null | undefined): number {
  return doubleJusqua && maintenant < doubleJusqua ? 2 : 1
}
