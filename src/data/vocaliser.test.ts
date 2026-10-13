import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { MOTS } from '.'
import { decouperLatin, vocaliser } from './vocaliser'

const sansDiacritiques = (s: string) => s.replace(/[ً-ْ]/g, '')

describe('decouperLatin', () => {
  it('reconnaît les sons à deux lettres, les doubles et les voyelles', () => {
    expect(decouperLatin('khobz').map((u) => (u.type === 'consonne' ? u.son : u.type))).toEqual(['kh', 'voyelle', 'b', 'z'])
    expect(decouperLatin('ssba7')[0]).toEqual({ type: 'consonne', son: 's', double: true })
    expect(decouperLatin('chouf')[1]).toEqual({ type: 'voyelle', son: 'u' })
    // « shel » = سهل : s puis h, pas ش.
    expect(decouperLatin('shel')[0]).toEqual({ type: 'consonne', son: 's', double: false })
  })
})

describe('vocaliser', () => {
  it.each([
    ['bzaf', 'بزاف', 'بْزَافْ'],
    ['mzyan', 'مزيان', 'مْزْيَانْ'],
    ['3afak', 'عافاك', 'عَافَاكْ'],
    ['ktab', 'كتاب', 'كْتَابْ'],
    ['salam', 'سلام', 'سَلَامْ'],
    ['kelb', 'كلب', 'كلْبْ'],
    ['ssba7', 'الصباح', 'الصّبَاحْ'],
    ['3amma', 'عمة', 'عَمَّة'],
    ['chokran', 'شكرا', 'شُكْرًا'],
    ['b ssaboun', 'بالصابون', 'بْالصَّابُونْ'],
    ['lpenalty', 'البينالتي', 'الْبِينَالْتِي'],
  ])('%s', (latin, arabe, attendu) => {
    expect(vocaliser(latin, arabe)).toBe(attendu.normalize('NFC'))
  })

  it('soukoun sur les consonnes qui s’enchaînent, sans voyelle de l’arabe standard', () => {
    // « kayn » : pas de voyelle entre y et n.
    expect(vocaliser('kayn', 'كاين')).toBe('كَايْنْ')
  })

  it('renonce quand le latin et l’arabe ne se correspondent pas', () => {
    expect(vocaliser('taxi', 'طاكسي')).toBeNull()
    expect(vocaliser('bzaf', 'شكرا')).toBeNull()
  })

  it('n’ajoute que des voyelles : l’arabe reste lettre pour lettre le même', () => {
    for (const m of MOTS) {
      const v = vocaliser(m.latin, m.arabe)
      if (v) expect(sansDiacritiques(v)).toBe(m.arabe.normalize('NFC'))
    }
  })

  it('vocalise au moins 95 % des mots du programme', () => {
    const faits = MOTS.filter((m) => vocaliser(m.latin, m.arabe)).length
    expect(faits / MOTS.length).toBeGreaterThan(0.95)
  })
})

describe('scripts/voix.json', () => {
  it('est à jour (sinon : npm run voix)', () => {
    expect(() => execFileSync('node', ['scripts/voix.mjs', '--verifier'], { stdio: 'pipe' })).not.toThrow()
  })
})
