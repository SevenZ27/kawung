export type RGB = [number, number, number]

export function isHex6(value: string): boolean {
  return /^[0-9a-f]{6}$/i.test(value)
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16)) as RGB
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex([0, 1, 2].map((k) => x[k] + (y[k] - x[k]) * t) as RGB)
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

// WCAG relative luminance.
export function luminanceRgb([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function luminance(hex: string): number {
  return luminanceRgb(hexToRgb(hex))
}

export function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

// Median contrast between a text colour and a set of sampled background pixels.
export function medianContrast(textLum: number, pixelLums: number[]): number {
  if (pixelLums.length === 0) return 1
  const ratios = pixelLums.map((l) => contrastRatio(textLum, l)).sort((a, b) => a - b)
  const mid = Math.floor(ratios.length / 2)
  return ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2
}
