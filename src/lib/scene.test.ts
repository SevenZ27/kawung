import { describe, expect, it } from 'vitest'
import { DEFAULTS, MOTIF_IDS, PALETTE_IDS, type Params } from './params'
import { sceneToSvg } from './render'
import { buildScene, logicalSize } from './scene'

const phone = logicalSize(393 / 852)
const svgFor = (over: Partial<Params>, size = phone) => sceneToSvg(buildScene({ ...DEFAULTS, ...over }, size))

describe('scene', () => {
  it.each(MOTIF_IDS)('%s: same seed gives an identical SVG', (m) => {
    const a = svgFor({ m, s: 4821 })
    const b = svgFor({ m, s: 4821 })
    expect(a).toBe(b)
    expect(a).toMatchSnapshot()
  })

  it.each(MOTIF_IDS)('%s: a different seed changes the SVG', (m) => {
    const seeds = [1, 2, 3, 4821, 77777].map((s) => svgFor({ m, s }))
    expect(new Set(seeds).size).toBeGreaterThan(1)
  })

  it('never writes NaN or Infinity into paths', () => {
    for (const m of MOTIF_IDS) {
      for (const p of PALETTE_IDS) {
        for (const d of [1, 10]) {
          for (const r of [0, 33, 179]) {
            const svg = svgFor({ m, p, d, r, w: 10, c: '112233' })
            expect(svg).not.toMatch(/NaN|Infinity|undefined/)
          }
        }
      }
    }
  })

  it('keeps the geometry inside a reasonable size at the highest density', () => {
    for (const m of MOTIF_IDS) {
      const svg = svgFor({ m, d: 10, r: 45 })
      expect(svg.length).toBeLessThan(900_000)
    }
  })

  it('uses the short side as the 1000 unit reference', () => {
    expect(logicalSize(0.5)).toEqual({ w: 1000, h: 2000 })
    expect(logicalSize(2)).toEqual({ w: 2000, h: 1000 })
  })
})
