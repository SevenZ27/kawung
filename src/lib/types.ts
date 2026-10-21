import type { Palette } from './palettes'

export interface Layer {
  d: string
  fill?: string
  stroke?: string
  sw?: number
}

export interface Scene {
  w: number
  h: number
  bg: string
  rotation: number
  layers: Layer[]
}

export interface MotifContext {
  unit: number
  sw: number
  pal: Palette
  seed: number
  rng: () => number
  generation: number
  // x, y are relative to the pattern centre, before rotation.
  inView: (x: number, y: number, margin: number) => boolean
  extent: (step: number) => number
}

export interface MotifDef {
  // how many base cells fit across the short side for a given density value
  repeats: (density: number) => number
  angle: number
  background: (pal: Palette) => string
  draw: (ctx: MotifContext) => Layer[]
}
