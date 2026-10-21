import { MOTIFS } from './motifs'
import { mix } from './color'
import { resolvePalette } from './palettes'
import type { Params } from './params'
import { cellSeed, mulberry32 } from './prng'
import type { MotifContext, Scene } from './types'

export interface Size {
  w: number
  h: number
}

const SALT = { kawung: 1, parang: 2, truntum: 3, ceplok: 4, nitik: 5, jlamprang: 6, megamendung: 7, tambal: 8, gringsing: 9, semen: 10 } as const

// Logical canvas: the short side is always 1000 units, so density and line weight
// look the same on a phone, a desktop, and in the small thumbnails.
export function logicalSize(aspect: number): Size {
  return aspect >= 1 ? { w: 1000 * aspect, h: 1000 } : { w: 1000, h: 1000 / aspect }
}

export function buildScene(p: Params, size: Size): Scene {
  const def = MOTIFS[p.m]
  const base = resolvePalette(p.p, p.c)
  const dim = Math.max(-80, Math.min(80, p.dim ?? 0))
  const shade = (c: string) => dim ? mix(c, dim < 0 ? '#000000' : '#ffffff', Math.abs(dim) / 100) : c
  const pal = { bg: shade(base.bg), deep: shade(base.deep), line: shade(base.line), accent: shade(base.accent) }
  const short = Math.min(size.w, size.h)
  const unit = short / def.repeats(p.d)
  const rotation = (p.r + def.angle) % 360
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = size.w / 2
  const hh = size.h / 2

  const ctx: MotifContext = {
    unit,
    sw: unit * (0.004 + 0.0034 * p.w),
    pal,
    seed: p.s,
    generation: p.g ?? 1,
    rng: mulberry32(cellSeed(p.s, 0, 0, SALT[p.m])),
    inView: (x, y, m) => Math.abs(x * cos - y * sin) <= hw + m && Math.abs(x * sin + y * cos) <= hh + m,
    extent: (step) => Math.ceil(Math.hypot(hw, hh) / step) + 1,
  }

  return {
    w: size.w,
    h: size.h,
    bg: def.background(pal),
    rotation,
    layers: def.draw(ctx).filter((layer) => layer.d.length > 0),
  }
}
