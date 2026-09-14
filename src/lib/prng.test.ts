import { describe, expect, it } from 'vitest'
import { cellSeed, mulberry32 } from './prng'

describe('mulberry32', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = mulberry32(4821)
    const b = mulberry32(4821)
    const seqA = Array.from({ length: 50 }, a)
    const seqB = Array.from({ length: 50 }, b)
    expect(seqA).toEqual(seqB)
  })

  it('stays in [0, 1)', () => {
    const r = mulberry32(1)
    for (let k = 0; k < 10_000; k++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('matches known first values', () => {
    const r = mulberry32(0)
    expect([r(), r(), r()].map((v) => v.toFixed(8))).toMatchSnapshot()
  })

  it('gives different cells different seeds', () => {
    const seen = new Set<number>()
    for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) seen.add(cellSeed(4821, i, j))
    expect(seen.size).toBe(41 * 41)
  })
})
