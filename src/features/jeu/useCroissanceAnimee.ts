import { useEffect, useRef, useState } from 'react'
import type { EtapeAnimation } from '../../gamification/jardin'

export interface EtatPlante {
  stade: number
  avancement: number
  /** Numéro du dernier changement de palier (0 = aucun) : relance le rebond et les étincelles. */
  pop: number
  enCours: boolean
}

/** Durée d'une étape : plus elle pousse, plus elle prend de temps. */
const duree = (e: EtapeAnimation) => 300 + 2400 * (e.a - e.de)
const PAUSE_STADE = 450

const sansAnimation = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Fait pousser la plante le long des étapes (requestAnimationFrame) ; `cle` relance l'animation.
 * Avec « Réduire les animations », la plante est montrée tout de suite à son état final.
 */
export function useCroissanceAnimee(etapes: EtapeAnimation[], final: { stade: number; avancement: number }, cle: number): EtatPlante & { passer: () => void } {
  const [etat, setEtat] = useState<EtatPlante>({ ...final, pop: 0, enCours: false })
  const arret = useRef<() => void>(() => {})

  useEffect(() => {
    if (etapes.length === 0 || sansAnimation()) {
      setEtat({ ...final, pop: 0, enCours: false })
      return
    }
    let image = 0
    let annule = false
    let pop = 0
    let index = 0
    let debut = performance.now()
    const finir = () => {
      annule = true
      cancelAnimationFrame(image)
      setEtat({ ...final, pop, enCours: false })
    }
    arret.current = finir
    const tour = (maintenant: number) => {
      if (annule) return
      const e = etapes[index]
      const t = Math.min(1, Math.max(0, (maintenant - debut) / duree(e)))
      // Départ lent, arrivée douce.
      const lisse = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      setEtat({ stade: e.stade, avancement: e.de + (e.a - e.de) * lisse, pop, enCours: true })
      if (t < 1) {
        image = requestAnimationFrame(tour)
        return
      }
      index++
      if (index >= etapes.length) {
        finir()
        return
      }
      // Nouveau palier : rebond et étincelles, puis il pousse à son tour après une courte pause.
      const nouveau = etapes[index].stade !== e.stade || etapes[index].palier !== e.palier
      if (nouveau) pop++
      setEtat({ stade: etapes[index].stade, avancement: etapes[index].de, pop, enCours: true })
      debut = maintenant + (nouveau ? PAUSE_STADE : 0)
      image = requestAnimationFrame(tour)
    }
    setEtat({ stade: etapes[0].stade, avancement: etapes[0].de, pop: 0, enCours: true })
    image = requestAnimationFrame(tour)
    return () => {
      annule = true
      cancelAnimationFrame(image)
    }
    // Les étapes et l'état final sont figés pour une même clé.
  }, [cle])

  return { ...etat, passer: () => arret.current() }
}
