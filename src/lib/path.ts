// Two decimals is plenty at a 1000-unit short side and keeps the SVG string short
// and byte-identical between runs.
export function num(v: number): string {
  const r = Math.round(v * 100) / 100
  return r === 0 ? '0' : String(r)
}

const DEG = Math.PI / 180

export class PathBuilder {
  private parts: string[] = []

  get isEmpty(): boolean {
    return this.parts.length === 0
  }

  move(x: number, y: number): this {
    this.parts.push(`M${num(x)} ${num(y)}`)
    return this
  }

  line(x: number, y: number): this {
    this.parts.push(`L${num(x)} ${num(y)}`)
    return this
  }

  quad(cx: number, cy: number, x: number, y: number): this {
    this.parts.push(`Q${num(cx)} ${num(cy)} ${num(x)} ${num(y)}`)
    return this
  }

  cubic(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this {
    this.parts.push(`C${num(c1x)} ${num(c1y)} ${num(c2x)} ${num(c2y)} ${num(x)} ${num(y)}`)
    return this
  }

  close(): this {
    this.parts.push('Z')
    return this
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, angleDeg = 0): this {
    const a = angleDeg * DEG
    const dx = rx * Math.cos(a)
    const dy = rx * Math.sin(a)
    const arc = `A${num(rx)} ${num(ry)} ${num(angleDeg)} 0 1`
    this.parts.push(
      `M${num(cx + dx)} ${num(cy + dy)}${arc} ${num(cx - dx)} ${num(cy - dy)}${arc} ${num(cx + dx)} ${num(cy + dy)}Z`,
    )
    return this
  }

  circle(cx: number, cy: number, r: number): this {
    return this.ellipse(cx, cy, r, r, 0)
  }

  polygon(points: Array<[number, number]>): this {
    points.forEach(([x, y], k) => (k === 0 ? this.move(x, y) : this.line(x, y)))
    return this.close()
  }

  // Star with `n` points, alternating outer and inner radius.
  star(cx: number, cy: number, outer: number, inner: number, n: number, rotDeg = 0): this {
    const pts: Array<[number, number]> = []
    for (let k = 0; k < n * 2; k++) {
      const r = k % 2 === 0 ? outer : inner
      const a = (rotDeg - 90 + (k * 180) / n) * DEG
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
    return this.polygon(pts)
  }

  // Pointed leaf from radius r0 to r1 along an angle, `width` is the half width at the middle.
  lens(cx: number, cy: number, r0: number, r1: number, width: number, angleDeg: number): this {
    const a = angleDeg * DEG
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    const mid = (r0 + r1) / 2
    const k = width * 2
    const x0 = cx + ux * r0
    const y0 = cy + uy * r0
    const x1 = cx + ux * r1
    const y1 = cy + uy * r1
    const mx = cx + ux * mid
    const my = cy + uy * mid
    this.move(x0, y0)
    this.quad(mx - uy * k, my + ux * k, x1, y1)
    this.quad(mx + uy * k, my - ux * k, x0, y0)
    return this.close()
  }

  segment(x0: number, y0: number, x1: number, y1: number): this {
    return this.move(x0, y0).line(x1, y1)
  }

  toString(): string {
    return this.parts.join('')
  }
}
