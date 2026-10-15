import { afterEach, describe, expect, it, vi } from 'vitest'
import { enregistrerRetour, faireRetour, retourDisponible } from './retour'

const retraits: (() => void)[] = []
afterEach(() => {
  retraits.splice(0).forEach((r) => r())
})
const inscrire = (action?: () => void) => {
  const r = enregistrerRetour(() => action)
  retraits.push(r)
  return r
}

describe('pile des retours', () => {
  it('sans page ouverte : pas de retour', () => {
    expect(retourDisponible()).toBe(false)
    expect(faireRetour()).toBe(false)
  })

  it('appelle le retour de la page ouverte', () => {
    const retour = vi.fn()
    inscrire(retour)
    expect(retourDisponible()).toBe(true)
    expect(faireRetour()).toBe(true)
    expect(retour).toHaveBeenCalledOnce()
  })

  it('appelle d’abord la page du dessus, puis celle d’en dessous une fois retirée', () => {
    const dessous = vi.fn()
    const dessus = vi.fn()
    inscrire(dessous)
    const retirer = inscrire(dessus)
    faireRetour()
    expect(dessus).toHaveBeenCalledOnce()
    expect(dessous).not.toHaveBeenCalled()
    retirer()
    faireRetour()
    expect(dessous).toHaveBeenCalledOnce()
  })

  it('ignore une page sans retour (racine d’un onglet)', () => {
    const retour = vi.fn()
    inscrire(retour)
    inscrire(undefined)
    expect(faireRetour()).toBe(true)
    expect(retour).toHaveBeenCalledOnce()
  })

  it('une page retirée ne répond plus', () => {
    const retour = vi.fn()
    inscrire(retour)()
    expect(faireRetour()).toBe(false)
    expect(retour).not.toHaveBeenCalled()
  })
})
