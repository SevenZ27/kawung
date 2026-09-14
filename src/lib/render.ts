import { num } from './path'
import type { Scene } from './types'

export function sceneToSvg(scene: Scene): string {
  const w = num(scene.w)
  const h = num(scene.h)
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`
  out += `<rect width="${w}" height="${h}" fill="${scene.bg}"/>`
  out += `<g transform="translate(${num(scene.w / 2)} ${num(scene.h / 2)}) rotate(${num(scene.rotation)})" stroke-linejoin="round" stroke-linecap="round">`
  for (const layer of scene.layers) {
    const stroke = layer.stroke ? ` stroke="${layer.stroke}" stroke-width="${num(layer.sw ?? 1)}"` : ''
    out += `<path d="${layer.d}" fill="${layer.fill ?? 'none'}"${stroke}/>`
  }
  return `${out}</g></svg>`
}

// Same scene, drawn with Path2D so the export does not depend on SVG-to-image support.
export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, pxW: number, pxH: number): void {
  ctx.save()
  ctx.scale(pxW / scene.w, pxH / scene.h)
  ctx.fillStyle = scene.bg
  ctx.fillRect(0, 0, scene.w, scene.h)
  ctx.translate(scene.w / 2, scene.h / 2)
  ctx.rotate((scene.rotation * Math.PI) / 180)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const layer of scene.layers) {
    const path = new Path2D(layer.d)
    if (layer.fill) {
      ctx.fillStyle = layer.fill
      ctx.fill(path)
    }
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke
      ctx.lineWidth = layer.sw ?? 1
      ctx.stroke(path)
    }
  }
  ctx.restore()
}
