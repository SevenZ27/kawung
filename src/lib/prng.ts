// mulberry32: tiny 32-bit PRNG, good enough for visual variation and fully deterministic.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Mixes seed and grid position into one 32-bit number, so every cell gets its own
// stream that does not depend on how many cells were drawn before it.
export function cellSeed(seed: number, i: number, j: number, salt = 0): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (i | 0), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13) ^ (j | 0), 0xc2b2ae35) >>> 0
  h = Math.imul(h ^ (h >>> 16) ^ salt, 0x27d4eb2f) >>> 0
  return (h ^ (h >>> 15)) >>> 0
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length]
}

export function range(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng()
}
