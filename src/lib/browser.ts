import { luminanceRgb } from './color'
import { chooseClock } from './readability'
export { CLOCK_LIGHT, CLOCK_DARK } from './readability'
import type { Device, Params } from './params'
import { drawScene } from './render'
import { buildScene, logicalSize } from './scene'
import { exportSize, type ScreenInfo } from './screen'

// Part of the wallpaper that sits behind the date and clock, as fractions of the screen.
export const CLOCK_BOX: Record<Device, { x0: number; x1: number; y0: number; y1: number }> = {
  hp: { x0: 0.18, x1: 0.82, y0: 0.1, y1: 0.28 },
  desktop: { x0: 0.34, x1: 0.66, y0: 0.24, y1: 0.46 },
}

export interface ClockReading {
  tone: 'light' | 'dark'
  ratio: number
  median?: number
  below3?: number
  below45?: number
}

// Region-based proxy, not a measurement of real OS glyphs or human readability.
// Width 240 reduces aliasing compared with the former 90px sample.
export function sampleClock(params: Params, aspect: number, w = 240): number[] {
  const h = Math.max(1, Math.round(w / aspect))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  drawScene(ctx, buildScene(params, logicalSize(aspect)), w, h)
  const box = CLOCK_BOX[params.v]
  const x0 = Math.floor(box.x0 * w)
  const y0 = Math.floor(box.y0 * h)
  const bw = Math.max(1, Math.floor((box.x1 - box.x0) * w))
  const bh = Math.max(1, Math.floor((box.y1 - box.y0) * h))
  const data = ctx.getImageData(x0, y0, bw, bh).data
  const lums: number[] = []
  for (let k = 0; k < data.length; k += 4) lums.push(luminanceRgb([data[k], data[k + 1], data[k + 2]]))
  return lums
}

export function readClock(params: Params, aspect: number): ClockReading {
  const chosen = chooseClock(sampleClock(params, aspect))
  return { tone: chosen.tone, ratio: chosen.p10, median: chosen.median, below3: chosen.below3, below45: chosen.below45 }
}

export async function downloadPng(params: Params, device: Device, screen: ScreenInfo): Promise<void> {
  const size = exportSize(screen, device, params)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia')
  const scene = buildScene({ ...params, v: device }, logicalSize(size.width / size.height))
  drawScene(ctx, scene, size.width, size.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Gagal membuat PNG')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kawung-${params.m}-${params.s}-${size.width}x${size.height}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
