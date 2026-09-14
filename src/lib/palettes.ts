import { luminance, mix } from './color'
import type { PaletteId } from './params'

export interface Palette {
  bg: string
  deep: string
  line: string
  accent: string
}

export const PALETTES: Record<Exclude<PaletteId, 'bebas'>, Palette> = {
  sogan: { bg: '#8b5a2b', deep: '#5c3819', line: '#efe6d2', accent: '#2b2118' },
  nila: { bg: '#1f3a5f', deep: '#15294a', line: '#efe6d2', accent: '#b8894f' },
  gading: { bg: '#efe6d2', deep: '#dccaa6', line: '#2b2118', accent: '#8b5a2b' },
}

export const PALETTE_LABELS: Record<PaletteId, string> = {
  sogan: 'Sogan',
  nila: 'Nila',
  gading: 'Gading',
  bebas: 'Bebas',
}

// A custom colour becomes the ground, the rest is derived from it so any pick still
// has a readable line colour.
export function customPalette(hex: string): Palette {
  const bg = `#${hex.replace('#', '')}`
  const dark = luminance(bg) < 0.2
  return dark
    ? { bg, deep: mix(bg, '#000000', 0.3), line: mix(bg, '#f7f1e6', 0.88), accent: mix(bg, '#f7f1e6', 0.42) }
    : { bg, deep: mix(bg, '#000000', 0.12), line: mix(bg, '#1e1812', 0.86), accent: mix(bg, '#1e1812', 0.45) }
}

export function resolvePalette(id: PaletteId, custom: string): Palette {
  return id === 'bebas' ? customPalette(custom) : PALETTES[id]
}
