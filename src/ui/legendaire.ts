import { createContext, useContext } from 'react'

/** Épreuve légendaire en cours : pas de ralenti ni d'indice dans les exercices. */
export const ModeLegendaire = createContext(false)

export const useLegendaire = () => useContext(ModeLegendaire)
