import { PathBuilder } from '../path'
import { pick, range } from '../prng'
import type { MotifContext, MotifDef } from '../types'

const odd = (n: number) => ((n % 2) + 2) % 2 === 1

// Parang: slanted bands that repeat. Inside a band, S-shaped blades lean in the same
// direction; between bands runs a thin strip of small diamonds. The whole pattern is
// drawn flat and turned 45 degrees by the scene.
function draw(ctx: MotifContext) {
  const { unit: P, sw, pal, rng } = ctx
  const strip = P * range(rng, 0.17, 0.22)
  const band = P - strip
  const pad = band * 0.07
  const L = band * range(rng, 1.0, 1.15)
  const pitch = band * range(rng, 0.4, 0.48)
  const g = L * range(rng, 0.2, 0.27)
  const curl = range(rng, 0.82, 0.95)
  const style = pick(rng, ['solid', 'alternate', 'rib'] as const)
  const gem = pick(rng, ['diamond', 'eye', 'quad'] as const)
  const doubleBorder = rng() < 0.5

  const strips = new PathBuilder()
  const borders = new PathBuilder()
  const bladesA = new PathBuilder()
  const bladesB = new PathBuilder()
  const ribs = new PathBuilder()
  const gems = new PathBuilder()
  const gemDots = new PathBuilder()

  const n = ctx.extent(Math.min(P, pitch))
  const span = n * Math.min(P, pitch)
  const nb = Math.ceil(span / P) + 1

  for (let k = -nb; k <= nb; k++) {
    const v = k * P

    strips.polygon([
      [-span, v - strip / 2],
      [span, v - strip / 2],
      [span, v + strip / 2],
      [-span, v + strip / 2],
    ])
    borders.segment(-span, v - strip / 2, span, v - strip / 2).segment(-span, v + strip / 2, span, v + strip / 2)
    if (doubleBorder) {
      const o = strip / 2 + sw * 2.4
      borders.segment(-span, v - o, span, v - o).segment(-span, v + o, span, v + o)
    }

    const top = v + strip / 2 + pad
    const bottom = v + P - strip / 2 - pad
    const shift = odd(k) ? pitch / 2 : 0
    const nm = Math.ceil(span / pitch) + 2
    for (let m = -nm; m <= nm; m++) {
      const u0 = m * pitch + shift - L / 2
      const cx = u0 + L / 2
      const cy = (top + bottom) / 2
      if (!ctx.inView(cx, cy, L)) continue
      const c1x = u0 + curl * L
      const c2x = u0 + (1 - curl) * L
      const target = style === 'alternate' && odd(m) ? bladesB : bladesA
      target
        .move(u0, top)
        .cubic(c1x, top, c2x, bottom, u0 + L, bottom)
        .cubic(c2x + g, bottom, c1x + g, top, u0, top)
        .close()
      if (style === 'rib') {
        ribs.move(u0 + L * 0.12, top + (bottom - top) * 0.02)
        ribs.cubic(c1x + g / 2, top, c2x + g / 2, bottom, u0 + L * 0.88, bottom - (bottom - top) * 0.02)
      }
    }

    const nq = Math.ceil(span / pitch) + 2
    for (let q = -nq; q <= nq; q++) {
      const gx = q * pitch + (odd(k) ? 0 : pitch / 2)
      if (!ctx.inView(gx, v, strip)) continue
      const hy = strip * 0.32
      const hx = Math.min(pitch * 0.34, hy * 1.5)
      if (gem === 'quad') {
        gemDots.circle(gx - hx * 0.5, v, hy * 0.36).circle(gx + hx * 0.5, v, hy * 0.36)
        gemDots.circle(gx, v - hy * 0.55, hy * 0.3).circle(gx, v + hy * 0.55, hy * 0.3)
      } else {
        gems.polygon([
          [gx - hx, v],
          [gx, v - hy],
          [gx + hx, v],
          [gx, v + hy],
        ])
        if (gem === 'eye') gemDots.circle(gx, v, hy * 0.3)
      }
    }
  }

  return [
    { d: strips.toString(), fill: pal.deep },
    { d: bladesA.toString(), fill: pal.deep, stroke: pal.line, sw },
    { d: bladesB.toString(), fill: pal.accent, stroke: pal.line, sw },
    { d: ribs.toString(), stroke: pal.line, sw: sw * 0.7 },
    { d: borders.toString(), stroke: pal.line, sw: sw * 0.8 },
    { d: gems.toString(), fill: pal.line },
    { d: gemDots.toString(), fill: gem === 'eye' ? pal.deep : pal.line },
  ]
}

export const parang: MotifDef = {
  repeats: (d) => 1.5 + d * 0.55,
  angle: 45,
  background: (pal) => pal.bg,
  draw,
}
