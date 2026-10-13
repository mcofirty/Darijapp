import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { MOTS } from '.'
import { decouperLatin, vocaliser } from './vocaliser'

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
    ['salam', 'سلام', 'سَلَامْ'],
    ['kelb', 'كلب', 'كلْبْ'],
    ['kayn', 'كاين', 'كَايْنْ'],
    ['3amma', 'عمة', 'عَمَّة'],
    ['chokran', 'شكرا', 'شُكْرًا'],
    // L'article que le latin ne prononce pas disparaît ; l'assimilation reste (ssba7).
    ['lkhobz', 'الخبز', 'لْخُبْزْ'],
    ['ssba7', 'الصباح', 'صّبَاحْ'],
    ['chmes 7arra', 'الشمس حارة', 'شْمسْ حَارَّة'],
    ['l7amdollah', 'الحمد لله', 'لْحَمْدُ للَهْ'],
  ])('%s', (latin, arabe, attendu) => {
    expect(vocaliser(latin, arabe)).toBe(attendu.normalize('NFC'))
  })

  it('garde les consonnes lourdes que le latin n’écrit pas', () => {
    expect(vocaliser('sbe3', 'صبع')).toBe('صْبعْ')
    expect(vocaliser('wst', 'وسط')).toBe('وْسْطْ')
  })

  it('suit le latin quand l’arabe dit autre chose', () => {
    // باسات (basat) écrit, « bousat » prononcé.
    expect(vocaliser('bousat', 'باسات')).toBe('بُسَاتْ')
  })

  it('lit le latin seul quand l’arabe ne lui correspond pas', () => {
    expect(vocaliser('taxi', 'طاكسي')).toBe('تَكْسِي')
    expect(vocaliser('bzaf', 'شكرا')).toBe('بْزَفْ')
  })

  it('écrit tout le programme en arabe, sans lettre latine', () => {
    for (const m of MOTS) {
      for (const [latin, arabe] of [
        [m.latin, m.arabe],
        [m.exemple.latin, m.exemple.arabe],
      ]) {
        if (!latin) continue
        const v = vocaliser(latin, arabe)
        expect(v, latin).toBeTruthy()
        expect(v, latin).not.toMatch(/[a-z0-9]/i)
      }
    }
  })
})

describe('scripts/voix.json', () => {
  it('est à jour (sinon : npm run voix)', () => {
    expect(() => execFileSync('node', ['scripts/voix.mjs', '--verifier'], { stdio: 'pipe' })).not.toThrow()
  })
})
