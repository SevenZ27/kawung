import { PathBuilder } from '../path'
import { cellSeed, mulberry32, pick, range } from '../prng'
import type { MotifContext, MotifDef } from '../types'

type Bloom = 'petal' | 'star' | 'dots'

// Truntum: small blossoms spread evenly over a dark ground, on a diagonal grid.
// The seed decides which blossom type dominates and how often a second type appears.
function draw(ctx: MotifContext) {
  const { unit: s, sw, pal, rng, seed } = ctx
  const types: Bloom[] = ['petal', 'star', 'dots']
  const main = pick(rng, types)
  const second = pick(rng, types.filter((t) => t !== main))
  const mixRate = range(rng, 0.12, 0.38)
  const R = s * range(rng, 0.2, 0.24)
  const sparkle = pick(rng, ['four', 'one'] as const)

  const petals = new PathBuilder()
  const cores = new PathBuilder()
  const coreDots = new PathBuilder()
  const rings = new PathBuilder()
  const sparks = new PathBuilder()

  const bloom = (x: number, y: number, ci: number, cj: number) => {
    const cr = mulberry32(cellSeed(seed, ci, cj, 7))
    const type = cr() < mixRate ? second : main
    const r = R * range(cr, 0.86, 1.05)
    const rot = cr() < 0.5 ? 0 : 22.5
    if (type === 'petal') {
      for (let k = 0; k < 8; k++) {
        const a = ((rot + k * 45) * Math.PI) / 180
        petals.ellipse(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58, r * 0.4, r * 0.15, rot + k * 45)
      }
      cores.circle(x, y, r * 0.22)
    } else if (type === 'star') {
      petals.star(x, y, r, r * 0.42, 8, rot)
      coreDots.circle(x, y, r * 0.17)
    } else {
      for (let k = 0; k < 8; k++) {
        const a = ((rot + k * 45) * Math.PI) / 180
        petals.circle(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74, r * 0.15)
      }
      rings.circle(x, y, r * 0.36)
      petals.circle(x, y, r * 0.12)
    }
  }

  const n = ctx.extent(s / 2)
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = (i * s) / 2
      const y = (j * s) / 2
      if (!ctx.inView(x, y, s / 2)) continue
      const evenI = ((i % 2) + 2) % 2 === 0
      const evenJ = ((j % 2) + 2) % 2 === 0
      if (evenI === evenJ) bloom(x, y, i, j)
      else if (sparkle === 'four') {
        const o = s * 0.07
        const dr = s * 0.02
        sparks.circle(x - o, y, dr).circle(x + o, y, dr).circle(x, y - o, dr).circle(x, y + o, dr)
      } else sparks.circle(x, y, s * 0.028)
    }
  }

  return [
    { d: petals.toString(), fill: pal.line },
    { d: cores.toString(), fill: pal.accent, stroke: pal.line, sw: sw * 0.6 },
    { d: coreDots.toString(), fill: pal.accent },
    { d: rings.toString(), stroke: pal.line, sw: sw * 0.8 },
    { d: sparks.toString(), fill: pal.line },
  ]
}

export const truntum: MotifDef = {
  repeats: (d) => 1.2 + d * 0.7,
  angle: 0,
  background: (pal) => pal.bg,
  draw,
}
