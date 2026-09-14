import { isHex6 } from './color'

export const MOTIF_IDS = ['kawung', 'parang', 'truntum', 'ceplok'] as const
export const PALETTE_IDS = ['sogan', 'nila', 'gading', 'bebas'] as const
export const DEVICE_IDS = ['hp', 'desktop'] as const

export type MotifId = (typeof MOTIF_IDS)[number]
export type PaletteId = (typeof PALETTE_IDS)[number]
export type Device = (typeof DEVICE_IDS)[number]

export interface Params {
  m: MotifId
  s: number
  p: PaletteId
  c: string
  d: number
  w: number
  r: number
  v: Device
}

export const LIMITS = {
  s: { min: 0, max: 99999 },
  d: { min: 1, max: 10 },
  w: { min: 1, max: 10 },
  r: { min: 0, max: 179 },
} as const

export const DEFAULTS: Params = {
  m: 'kawung',
  s: 4821,
  p: 'sogan',
  c: '3f6b5a',
  d: 5,
  w: 4,
  r: 0,
  v: 'hp',
}

function oneOf<T extends string>(value: string | null, list: readonly T[], fallback: T): T {
  return value !== null && (list as readonly string[]).includes(value) ? (value as T) : fallback
}

function intIn(value: string | null, lim: { min: number; max: number }, fallback: number): number {
  if (value === null || !/^-?\d+$/.test(value.trim())) return fallback
  const n = parseInt(value, 10)
  return Math.min(lim.max, Math.max(lim.min, n))
}

export function randomSeed(rand: () => number = Math.random): number {
  return Math.floor(rand() * (LIMITS.s.max + 1))
}

export function parseParams(search: string, seedIfMissing: number = DEFAULTS.s): Params {
  const q = new URLSearchParams(search)
  const c = (q.get('c') ?? '').replace('#', '').toLowerCase()
  return {
    m: oneOf(q.get('m'), MOTIF_IDS, DEFAULTS.m),
    s: intIn(q.get('s'), LIMITS.s, seedIfMissing),
    p: oneOf(q.get('p'), PALETTE_IDS, DEFAULTS.p),
    c: isHex6(c) ? c : DEFAULTS.c,
    d: intIn(q.get('d'), LIMITS.d, DEFAULTS.d),
    w: intIn(q.get('w'), LIMITS.w, DEFAULTS.w),
    r: intIn(q.get('r'), LIMITS.r, DEFAULTS.r),
    v: oneOf(q.get('v'), DEVICE_IDS, DEFAULTS.v),
  }
}

// Fixed key order keeps share links stable and easy to read.
export function toSearch(p: Params): string {
  const q = new URLSearchParams()
  q.set('m', p.m)
  q.set('s', String(p.s))
  q.set('p', p.p)
  if (p.p === 'bebas') q.set('c', p.c)
  q.set('d', String(p.d))
  q.set('w', String(p.w))
  q.set('r', String(p.r))
  q.set('v', p.v)
  return `?${q.toString()}`
}
