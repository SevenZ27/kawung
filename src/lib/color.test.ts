import { describe, expect, it } from 'vitest'
import { contrastRatio, luminance, medianContrast, mix } from './color'
import { PALETTES, customPalette } from './palettes'

describe('color', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio(luminance('#000000'), luminance('#ffffff'))).toBeCloseTo(21, 5)
    expect(contrastRatio(luminance('#777777'), luminance('#777777'))).toBe(1)
  })

  it('mixes colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('takes the median of sampled pixels', () => {
    const white = luminance('#ffffff')
    expect(medianContrast(white, [0, 0, 1])).toBeCloseTo(21, 5)
    expect(medianContrast(white, [])).toBe(1)
  })

  it('keeps line colour readable on the fixed palettes', () => {
    for (const pal of Object.values(PALETTES)) {
      expect(contrastRatio(luminance(pal.line), luminance(pal.bg))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('derives a readable line colour from any custom ground', () => {
    for (const hex of ['000000', 'ffffff', 'ff0000', '3f6b5a', 'ffe600', '777777']) {
      const pal = customPalette(hex)
      expect(contrastRatio(luminance(pal.line), luminance(pal.bg))).toBeGreaterThanOrEqual(3)
    }
  })
})
