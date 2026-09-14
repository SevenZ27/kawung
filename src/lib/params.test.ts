import { describe, expect, it } from 'vitest'
import { DEFAULTS, parseParams, toSearch } from './params'

describe('share link params', () => {
  it('round-trips every setting through the URL', () => {
    const p = { m: 'truntum', s: 123, p: 'bebas', c: 'a1b2c3', d: 9, w: 2, r: 135, v: 'desktop' } as const
    expect(parseParams(toSearch(p))).toEqual(p)
  })

  it('reads the example link from the spec', () => {
    const p = parseParams('?m=kawung&s=4821&p=nila')
    expect(p).toMatchObject({ m: 'kawung', s: 4821, p: 'nila' })
  })

  it('falls back or clamps bad values', () => {
    const p = parseParams('?m=batik&s=abc&p=merah&c=zzz&d=99&w=-4&r=720&v=tv')
    expect(p).toEqual({ ...DEFAULTS, d: 10, w: 1, r: 179 })
  })

  it('uses the given seed when the link has none', () => {
    expect(parseParams('?m=parang', 555).s).toBe(555)
  })

  it('writes keys in a fixed order and only adds c for the free colour', () => {
    expect(toSearch({ ...DEFAULTS })).toBe('?m=kawung&s=4821&p=sogan&d=5&w=4&r=0&v=hp')
    expect(toSearch({ ...DEFAULTS, p: 'bebas' })).toContain('&c=3f6b5a&')
  })
})
