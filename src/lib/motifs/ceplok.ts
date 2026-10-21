import { PathBuilder } from '../path'
import { pick } from '../prng'
import type { MotifContext, MotifDef } from '../types'

// Ceplok: one symmetric rosette per square, repeated on a grid, with small ornaments
// where four squares meet. Every choice is made once for the whole cloth so each
// square keeps its symmetry.
function draw(ctx: MotifContext) {
  const { unit: s, sw, pal, rng } = ctx
  const frame = pick(rng, ['circle', 'diamond'] as const)
  const count = pick(rng, [4, 8] as const)
  const shape = pick(rng, ['lens', 'oval'] as const)
  const corner = pick(rng, ['star', 'clover', 'diamond'] as const)
  const alternate = rng() < 0.5
  // Preserve the 48-combination legacy generator for old links. New seeds use
  // bounded continuous proportions without breaking rotational symmetry.
  const petalScale = ctx.generation >= 2 ? 0.82 + rng() * 0.25 : 1
  const frameScale = ctx.generation >= 2 ? 0.93 + rng() * 0.07 : 1

  const frames = new PathBuilder()
  const petals = new PathBuilder()
  const leaves = new PathBuilder()
  const centres = new PathBuilder()
  const corners = new PathBuilder()
  const dots = new PathBuilder()

  const n = ctx.extent(s / 2)
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = i * s
      const y = j * s
      if (ctx.inView(x, y, s)) {
        const turn = alternate && ((i + j) % 2 !== 0) ? 45 : 0
        if (frame === 'circle') frames.circle(x, y, s * 0.44 * frameScale)
        else {
          const r = s * 0.47 * frameScale
          frames.polygon([
            [x, y - r],
            [x + r, y],
            [x, y + r],
            [x - r, y],
          ])
        }
        for (let k = 0; k < count; k++) {
          const ang = turn + (k * 360) / count - 90
          if (shape === 'lens') petals.lens(x, y, s * 0.07, s * 0.36 * petalScale, s * (count === 4 ? 0.075 : 0.05), ang)
          else {
            const a = (ang * Math.PI) / 180
            const len = s * 0.14 * petalScale
            petals.ellipse(x + Math.cos(a) * s * 0.215, y + Math.sin(a) * s * 0.215, len, s * (count === 4 ? 0.07 : 0.045), ang)
          }
          if (count === 4) {
            const la = ang + 45
            leaves.lens(x, y, s * 0.12, s * 0.28, s * 0.03, la)
          }
        }
        centres.circle(x, y, s * 0.065)
      }

      const cx = x + s / 2
      const cy = y + s / 2
      if (ctx.inView(cx, cy, s / 2)) {
        if (corner === 'star') corners.star(cx, cy, s * 0.2, s * 0.06, 4, 0)
        else if (corner === 'clover') {
          const o = s * 0.075
          corners.circle(cx - o, cy, s * 0.045).circle(cx + o, cy, s * 0.045)
          corners.circle(cx, cy - o, s * 0.045).circle(cx, cy + o, s * 0.045)
        } else {
          const r = s * 0.12
          corners.polygon([
            [cx, cy - r],
            [cx + r, cy],
            [cx, cy + r],
            [cx - r, cy],
          ])
        }
        dots.circle(x + s / 2, y, s * 0.022).circle(x, y + s / 2, s * 0.022)
      }
    }
  }

  return [
    { d: frames.toString(), fill: pal.deep, stroke: pal.line, sw },
    { d: leaves.toString(), fill: pal.accent },
    { d: petals.toString(), fill: pal.line },
    { d: centres.toString(), fill: pal.accent, stroke: pal.line, sw: sw * 0.8 },
    { d: corners.toString(), fill: pal.line },
    { d: dots.toString(), fill: pal.line },
  ]
}

export const ceplok: MotifDef = {
  repeats: (d) => 1.5 + d * 0.55,
  angle: 0,
  background: (pal) => pal.bg,
  draw,
}
