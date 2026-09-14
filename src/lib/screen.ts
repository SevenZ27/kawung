import type { Device } from './params'

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

// iOS Safari refuses canvases above 16,777,216 pixels, other browsers allow more.
export const MAX_CANVAS_AREA = 16_777_216
export const MAX_CANVAS_SIDE = 16_384
// Below this short side (CSS px) we treat the screen as a phone.
export const PHONE_MAX_SHORT_SIDE = 600
const REFERENCE_PHONE = 19.5 / 9
const REFERENCE_DESKTOP = 16 / 10

export function isPhoneScreen(s: ScreenInfo): boolean {
  return Math.min(s.width, s.height) <= PHONE_MAX_SHORT_SIDE
}

// Resolution comes from the screen that is showing the page: screen size times
// devicePixelRatio. Phones may report width and height swapped in landscape, so the
// short and long sides are sorted first.
export function exportSize(s: ScreenInfo, device: Device): ExportSize {
  const short = Math.min(s.width, s.height)
  const long = Math.max(s.width, s.height)
  const dpr = s.dpr > 0 && Number.isFinite(s.dpr) ? s.dpr : 1
  let width = Math.round((device === 'hp' ? short : long) * dpr)
  let height = Math.round((device === 'hp' ? long : short) * dpr)
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
  return { width, height, capped }
}

// Aspect (width / height) of the preview frame. On a phone the hp frame follows the real
// screen, on a laptop it uses a common phone shape so the mockup still reads as a phone.
export function previewAspect(s: ScreenInfo, device: Device): number {
  const short = Math.min(s.width, s.height)
  const long = Math.max(s.width, s.height)
  const phone = isPhoneScreen(s)
  if (device === 'hp') return phone ? short / long : 1 / REFERENCE_PHONE
  return phone ? REFERENCE_DESKTOP : long / short
}

export function readScreen(): ScreenInfo {
  return {
    width: window.screen.width,
    height: window.screen.height,
    dpr: window.devicePixelRatio || 1,
  }
}
