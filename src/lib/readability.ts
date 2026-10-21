import { contrastRatio, luminance } from './color'

export const CLOCK_LIGHT = '#fffdf8'
export const CLOCK_DARK = '#1b1510'
export interface ContrastStats { median: number; p10: number; below3: number; below45: number }
export function contrastStats(text: string, lums: number[]): ContrastStats {
  if (!lums.length) return { median: 1, p10: 1, below3: 1, below45: 1 }
  const l = luminance(text)
  const values = lums.map(v => contrastRatio(l,v)).sort((a,b)=>a-b)
  return {
    median: (values[Math.floor((values.length-1)/2)] + values[Math.ceil((values.length-1)/2)]) / 2,
    p10: values[Math.floor((values.length-1)*.1)],
    below3: values.filter(v=>v<3).length/values.length,
    below45: values.filter(v=>v<4.5).length/values.length,
  }
}
// Minimise weak-area coverage first, then the lower contrast tail. Unlike a
// median-only choice, a large uniform background cannot hide low-contrast detail.
export function chooseClock(lums: number[]) {
  const light=contrastStats(CLOCK_LIGHT,lums), dark=contrastStats(CLOCK_DARK,lums)
  const useLight = light.below3 < dark.below3 || (light.below3 === dark.below3 && light.p10 >= dark.p10)
  return { tone: useLight ? 'light' as const : 'dark' as const, ...(useLight ? light : dark) }
}
