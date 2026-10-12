import { describe, expect, it } from 'vitest'
import { doitProposerInstallation, estAppareilApple } from './installation'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'

describe('estAppareilApple', () => {
  it("reconnaît l'iPhone", () => {
    expect(estAppareilApple({ userAgent: IPHONE, pointsDeContact: 5 })).toBe(true)
  })
  it("reconnaît l'iPad qui se présente comme un Mac, mais pas un vrai Mac", () => {
    expect(estAppareilApple({ userAgent: IPAD, pointsDeContact: 5 })).toBe(true)
    expect(estAppareilApple({ userAgent: IPAD, pointsDeContact: 0 })).toBe(false)
  })
  it('ignore Android', () => {
    expect(estAppareilApple({ userAgent: ANDROID, pointsDeContact: 5 })).toBe(false)
  })
})

describe('doitProposerInstallation', () => {
  const iphoneSafari = { userAgent: IPHONE, pointsDeContact: 5, installee: false }
  it("s'affiche sur iPhone dans Safari", () => {
    expect(doitProposerInstallation(iphoneSafari, false)).toBe(true)
  })
  it("ne s'affiche plus une fois « Ne plus afficher » coché", () => {
    expect(doitProposerInstallation(iphoneSafari, true)).toBe(false)
  })
  it("ne s'affiche pas quand l'appli est ouverte depuis l'écran d'accueil", () => {
    expect(doitProposerInstallation({ ...iphoneSafari, installee: true }, false)).toBe(false)
  })
  it("ne s'affiche pas sur Android ni sur ordinateur", () => {
    expect(doitProposerInstallation({ userAgent: ANDROID, pointsDeContact: 5, installee: false }, false)).toBe(false)
    expect(doitProposerInstallation({ userAgent: IPAD, pointsDeContact: 0, installee: false }, false)).toBe(false)
  })
})
