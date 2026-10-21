import type { Device, Params } from './params'

export interface ScreenInfo {
  width: number
  height: number
  dpr: number
}

export interface ExportSize {
  width: number
  height: number
  // true when the size had to be reduced to stay inside browser canvas limits
  capped: boolean
}

// Conservative app limits; actual canvas support varies by browser and device.
export const MAX_CANVAS_AREA = 16_777_216
export const MAX_CANVAS_SIDE = 16_384
// Below this short side (CSS px) we treat the screen as a phone.
export const PHONE_MAX_SHORT_SIDE = 600

export const DEVICE_SIZE = {
  hp: { x: 1320, y: 2868 },
  desktop: { x: 2880, y: 5120 },
} as const

export function matchesDeviceSize(p: Pick<Params, 'v'|'x'|'y'>): boolean {
  return p.x === DEVICE_SIZE[p.v].x && p.y === DEVICE_SIZE[p.v].y
}

export function isPhoneScreen(s: ScreenInfo): boolean {
  return Math.min(s.width, s.height) <= PHONE_MAX_SHORT_SIDE
}

// Resolution comes from the screen that is showing the page: screen size times
// devicePixelRatio. Phones may report width and height swapped in landscape, so the
// short and long sides are sorted first.
export function exportSize(s: ScreenInfo, device: Device, target?: Pick<Params, 'x' | 'y'>): ExportSize {
  const safeSide = (v: number) => Number.isFinite(v) && v > 0 ? v : 1
  const short = Math.min(safeSide(s.width), safeSide(s.height))
  const long = Math.max(safeSide(s.width), safeSide(s.height))
  const dpr = s.dpr > 0 && Number.isFinite(s.dpr) ? s.dpr : 1
  const pinned = target?.x && target?.y && Number.isFinite(target.x) && Number.isFinite(target.y) && target.x > 0 && target.y > 0
  const x = pinned ? Math.min(target.x!, target.y!) : short * dpr
  const y = pinned ? Math.max(target.x!, target.y!) : long * dpr
  let width = Math.max(1, Math.round(device === 'hp' ? x : y))
  let height = Math.max(1, Math.round(device === 'hp' ? y : x))
  let capped = false

  const area = width * height
  if (area > MAX_CANVAS_AREA) {
    const k = Math.sqrt(MAX_CANVAS_AREA / area)
    width = Math.floor(width * k)
    height = Math.floor(height * k)
    capped = true
  }
  const side = Math.max(width, height)
  if (side > MAX_CANVAS_SIDE) {
    const k = MAX_CANVAS_SIDE / side
    width = Math.floor(width * k)
    height = Math.floor(height * k)
    capped = true
  }
  return { width: Math.max(1, width), height: Math.max(1, height), capped }
}

// The artwork (inside its decorative frame) uses the exact export aspect.
export function previewAspect(s: ScreenInfo, device: Device, target?: Pick<Params, 'x' | 'y'>): number {
  const size = exportSize(s, device, target)
  return size.width / size.height
}

export function readScreen(): ScreenInfo {
  return {
    width: window.screen.width,
    height: window.screen.height,
    dpr: window.devicePixelRatio || 1,
  }
}
