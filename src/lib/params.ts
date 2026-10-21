import { isHex6 } from './color'

export const MOTIF_IDS = ['kawung', 'parang', 'truntum', 'ceplok', 'nitik', 'jlamprang', 'megamendung', 'tambal', 'gringsing', 'semen'] as const
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
  dim?: number
  // Version 3 refines Nitik, Megamendung and Tambal; previous links retain their geometry.
  g?: number
  // Physical output dimensions, short side first. Omitted by legacy links.
  x?: number
  y?: number
}

export const LIMITS = {
  s: { min: 0, max: 99999 },
  d: { min: 1, max: 10 },
  w: { min: 1, max: 10 },
  r: { min: 0, max: 179 },
  dim: { min: -80, max: 80 },
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
  const dimensions = ['x', 'y'].map((key) => q.get(key))
  const validSize = dimensions.every((value) => value !== null && /^\d+$/.test(value) && Number(value) >= 64 && Number(value) <= 16384)
  const size = validSize ? { x: Math.min(...dimensions.map(Number)), y: Math.max(...dimensions.map(Number)) } : {}
  return {
    m: oneOf(q.get('m'), MOTIF_IDS, DEFAULTS.m),
    s: intIn(q.get('s'), LIMITS.s, seedIfMissing),
    p: oneOf(q.get('p'), PALETTE_IDS, DEFAULTS.p),
    c: isHex6(c) ? c : DEFAULTS.c,
    d: intIn(q.get('d'), LIMITS.d, DEFAULTS.d),
    w: intIn(q.get('w'), LIMITS.w, DEFAULTS.w),
    r: intIn(q.get('r'), LIMITS.r, DEFAULTS.r),
    v: oneOf(q.get('v'), DEVICE_IDS, DEFAULTS.v),
    ...(q.has('dim') ? { dim: intIn(q.get('dim'), LIMITS.dim, 0) } : {}),
    ...(['2', '3'].includes(q.get('g') ?? '') ? { g: Number(q.get('g')) } : {}),
    ...size,
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
  if (p.dim) q.set('dim', String(p.dim))
  if (p.g === 2 || p.g === 3) q.set('g', String(p.g))
  if (p.x && p.y) {
    q.set('x', String(p.x))
    q.set('y', String(p.y))
  }
  return `?${q.toString()}`
}
