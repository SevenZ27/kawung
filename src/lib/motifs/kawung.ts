import { PathBuilder } from '../path'
import { cellSeed, mulberry32, pick, range } from '../prng'
import type { MotifContext, MotifDef } from '../types'

const odd = (n: number) => ((n % 2) + 2) % 2 === 1

// Kawung: four ellipses around one centre point. The ellipses sit on the edges of a
// diagonal lattice, so every junction gathers four petal tips and every gap between
// petals becomes a small four-pointed space.
function draw(ctx: MotifContext) {
  const { unit, sw, pal, rng, seed } = ctx
  const h = unit / 2
  const reach = (h * Math.SQRT2) / 2
  // Two petals that share a junction stay apart when A^2 + B^2 < reach^2, so the
  // length is solved from the chosen fatness to keep them just short of touching.
  const fat = range(rng, 0.5, 0.62)
  const A = reach * Math.sqrt(range(rng, 0.9, 0.96) / (1 + fat * fat))
  const B = A * fat
  const inner = pick(rng, ['ring', 'seed', 'rib'] as const)
  const hub = pick(rng, ['dot', 'ring', 'star'] as const)
  const gaps = pick(rng, ['all', 'checker', 'scatter'] as const)

  const petals = new PathBuilder()
  const innerLine = new PathBuilder()
  const innerFill = new PathBuilder()
  const hubFill = new PathBuilder()
  const hubLine = new PathBuilder()
  const gapFill = new PathBuilder()

  const n = ctx.extent(h)
  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      const x = (a + 0.5) * h
      const y = (b + 0.5) * h
      if (!ctx.inView(x, y, A)) continue
      const ang = odd(a + b) ? -45 : 45
      petals.ellipse(x, y, A, B, ang)
      if (inner === 'ring') innerLine.ellipse(x, y, A * 0.62, B * 0.5, ang)
      else if (inner === 'seed') innerFill.ellipse(x, y, A * 0.36, B * 0.3, ang)
      else {
        const t = (ang * Math.PI) / 180
        const dx = Math.cos(t) * A * 0.62
        const dy = Math.sin(t) * A * 0.62
        innerLine.segment(x - dx, y - dy, x + dx, y + dy)
      }
    }
  }

  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = i * h
      const y = j * h
      if (!ctx.inView(x, y, h)) continue
      if (!odd(i + j)) {
        // junction where four tips meet
        if (hub === 'dot') hubFill.circle(x, y, B * 0.24)
        else if (hub === 'ring') {
          hubLine.circle(x, y, B * 0.3)
          hubFill.circle(x, y, B * 0.1)
        } else hubFill.star(x, y, B * 0.42, B * 0.12, 4, 0)
      } else {
        const show =
          gaps === 'all' ||
          (gaps === 'checker' && !odd(Math.floor((i + 1) / 2) + Math.floor(j / 2))) ||
          (gaps === 'scatter' && mulberry32(cellSeed(seed, i, j, 11))() < 0.55)
        if (show) gapFill.star(x, y, h * 0.2, h * 0.06, 4, 0)
      }
    }
  }

  return [
    { d: petals.toString(), fill: pal.deep, stroke: pal.line, sw },
    { d: innerFill.toString(), fill: pal.line },
    { d: innerLine.toString(), stroke: pal.line, sw: sw * 0.75 },
    { d: gapFill.toString(), fill: pal.accent },
    { d: hubLine.toString(), stroke: pal.line, sw: sw * 0.75 },
    { d: hubFill.toString(), fill: pal.line },
  ]
}

export const kawung: MotifDef = {
  repeats: (d) => 1.4 + d * 0.62,
  angle: 0,
  background: (pal) => pal.bg,
  draw,
}
