import { luminance, luminanceRgb, medianContrast } from './color'
import type { Device, Params } from './params'
import { drawScene } from './render'
import { buildScene, logicalSize } from './scene'
import { exportSize, type ScreenInfo } from './screen'

export const CLOCK_LIGHT = '#fffdf8'
export const CLOCK_DARK = '#1b1510'

// Part of the wallpaper that sits behind the date and clock, as fractions of the screen.
const CLOCK_BOX: Record<Device, { x0: number; x1: number; y0: number; y1: number }> = {
  hp: { x0: 0.18, x1: 0.82, y0: 0.1, y1: 0.28 },
  desktop: { x0: 0.34, x1: 0.66, y0: 0.24, y1: 0.46 },
}

export interface ClockReading {
  tone: 'light' | 'dark'
  ratio: number
}

// Renders a small copy of the wallpaper, samples the pixels behind the clock and picks
// the text tone with the higher median contrast.
export function readClock(params: Params, aspect: number): ClockReading {
  const w = 90
  const h = Math.max(1, Math.round(w / aspect))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { tone: 'light', ratio: 1 }
  drawScene(ctx, buildScene(params, logicalSize(aspect)), w, h)
  const box = CLOCK_BOX[params.v]
  const x0 = Math.floor(box.x0 * w)
  const y0 = Math.floor(box.y0 * h)
  const bw = Math.max(1, Math.floor((box.x1 - box.x0) * w))
  const bh = Math.max(1, Math.floor((box.y1 - box.y0) * h))
  const data = ctx.getImageData(x0, y0, bw, bh).data
  const lums: number[] = []
  for (let k = 0; k < data.length; k += 4) lums.push(luminanceRgb([data[k], data[k + 1], data[k + 2]]))
  const light = medianContrast(luminance(CLOCK_LIGHT), lums)
  const dark = medianContrast(luminance(CLOCK_DARK), lums)
  return light >= dark ? { tone: 'light', ratio: light } : { tone: 'dark', ratio: dark }
}

export async function downloadPng(params: Params, device: Device, screen: ScreenInfo): Promise<void> {
  const size = exportSize(screen, device)
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
