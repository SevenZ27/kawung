import { describe, expect, it } from 'vitest'
import { chooseClock, contrastStats, CLOCK_LIGHT, CLOCK_DARK } from './readability'
import { luminance } from './color'
import { parseParams, toSearch, DEFAULTS } from './params'
import { buildScene } from './scene'
import { sceneToSvg } from './render'

describe('region contrast proxy', () => {
  it('keeps a low contrast minority visible instead of hiding it in a median', () => {
    const s = contrastStats(CLOCK_LIGHT, [...Array(80).fill(0), ...Array(20).fill(luminance(CLOCK_LIGHT))])
    expect(s.median).toBeGreaterThan(19)
    expect(s.p10).toBe(1)
    expect(s.below3).toBe(.2)
  })
  it('chooses the tone with less weak-area coverage, including exact ties', () => {
    for (const values of [[0], [1], [.18], [0,0,0,1,1], [.02,.2,.8,.95]]) {
      const choice = chooseClock(values)
      expect(choice.below3).toBe(Math.min(contrastStats(CLOCK_LIGHT,values).below3,contrastStats(CLOCK_DARK,values).below3))
    }
  })
  it('does not treat absent samples as proof of readability', () => {
    expect(chooseClock([]).p10).toBe(1)
    expect(chooseClock([]).below3).toBe(1)
  })
})

describe('dim and generator compatibility', () => {
  it('round-trips signed dim and generator version and clamps hostile input', () => {
    const p={...DEFAULTS, dim:-65,g:2}
    expect(parseParams(toSearch(p))).toEqual(p)
    expect(parseParams('?dim=999').dim).toBe(80)
    expect(parseParams('?dim=-999').dim).toBe(-80)
    expect(parseParams('?dim=NaN').dim).toBe(0)
    expect(parseParams('?s=4821').g).toBeUndefined()
  })
  it('changes colours monotonically without changing geometry', () => {
    const scenes=[-80,0,80].map(dim=>buildScene({...DEFAULTS,dim},{w:1000,h:1600}))
    expect(scenes[0].layers.map(x=>x.d)).toEqual(scenes[2].layers.map(x=>x.d))
    expect(luminance(scenes[0].bg)).toBeLessThan(luminance(scenes[1].bg))
    expect(luminance(scenes[2].bg)).toBeGreaterThan(luminance(scenes[1].bg))
  })
  it('retains the known Ceplok legacy collision but separates the expanded generator', () => {
    const svg=(s:number,g?:number)=>sceneToSvg(buildScene({...DEFAULTS,m:'ceplok',s,g},{w:1000,h:1000}))
    expect(svg(0)).toBe(svg(11))
    expect(svg(0,2)).not.toBe(svg(11,2))
  })
})
