import { MOTIFS } from './motifs'
import { resolvePalette } from './palettes'
import type { Params } from './params'
import { cellSeed, mulberry32 } from './prng'
import type { MotifContext, Scene } from './types'

export interface Size {
  w: number
  h: number
}

const SALT = { kawung: 1, parang: 2, truntum: 3, ceplok: 4 } as const

// Logical canvas: the short side is always 1000 units, so density and line weight
// look the same on a phone, a desktop, and in the small thumbnails.
export function logicalSize(aspect: number): Size {
  return aspect >= 1 ? { w: 1000 * aspect, h: 1000 } : { w: 1000, h: 1000 / aspect }
}

export function buildScene(p: Params, size: Size): Scene {
  const def = MOTIFS[p.m]
  const pal = resolvePalette(p.p, p.c)
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
