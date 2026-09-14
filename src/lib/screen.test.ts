import { describe, expect, it } from 'vitest'
import { MAX_CANVAS_AREA, exportSize, previewAspect } from './screen'

describe('exportSize', () => {
  it('multiplies the screen by devicePixelRatio for a phone', () => {
    expect(exportSize({ width: 393, height: 852, dpr: 3 }, 'hp')).toEqual({ width: 1179, height: 2556, capped: false })
  })

  it('handles screens that report landscape order', () => {
    expect(exportSize({ width: 852, height: 393, dpr: 3 }, 'hp')).toEqual({ width: 1179, height: 2556, capped: false })
  })

  it('rounds fractional ratios', () => {
    expect(exportSize({ width: 412, height: 915, dpr: 2.625 }, 'hp')).toEqual({ width: 1082, height: 2402, capped: false })
  })

  it('gives a landscape size for the desktop option', () => {
    expect(exportSize({ width: 1440, height: 900, dpr: 2 }, 'desktop')).toEqual({ width: 2880, height: 1800, capped: false })
    expect(exportSize({ width: 1440, height: 900, dpr: 2 }, 'hp')).toEqual({ width: 1800, height: 2880, capped: false })
  })

  it('treats a missing ratio as 1', () => {
    expect(exportSize({ width: 1920, height: 1080, dpr: 0 }, 'desktop')).toEqual({ width: 1920, height: 1080, capped: false })
  })

  it('caps very large screens to the canvas area limit and keeps the ratio', () => {
    const out = exportSize({ width: 3008, height: 1692, dpr: 2 }, 'desktop')
    expect(out.capped).toBe(true)
    expect(out.width * out.height).toBeLessThanOrEqual(MAX_CANVAS_AREA)
    expect(out.width / out.height).toBeCloseTo(3008 / 1692, 2)
  })
})

describe('previewAspect', () => {
  it('follows the real screen on a phone', () => {
    expect(previewAspect({ width: 393, height: 852, dpr: 3 }, 'hp')).toBeCloseTo(393 / 852)
  })

  it('uses a phone shape on a laptop and the real ratio for desktop', () => {
    expect(previewAspect({ width: 1440, height: 900, dpr: 2 }, 'hp')).toBeCloseTo(9 / 19.5)
    expect(previewAspect({ width: 1440, height: 900, dpr: 2 }, 'desktop')).toBeCloseTo(1.6)
  })
})
