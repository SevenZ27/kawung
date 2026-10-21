import { nitikRefined, megamendungRefined, tambalRefined } from './refined'
import { PathBuilder } from '../path'
import { cellSeed, mulberry32 } from '../prng'
import type { MotifContext, MotifDef, Layer } from '../types'

// Structural references and deliberate simplifications: docs/MOTIF-REFERENCES.md.
// These are original vector interpretations, not scans of traditional textiles.
function grid(ctx: MotifContext, fn: (x: number, y: number, i: number, j: number) => void, stagger = false) {
  const n = ctx.extent(ctx.unit)
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const x = (i + (stagger && Math.abs(j % 2) ? 0.5 : 0)) * ctx.unit
    const y = j * ctx.unit
    if (ctx.inView(x, y, ctx.unit)) fn(x, y, i, j)
  }
}
function square(p: PathBuilder, x: number, y: number, r: number) {
  p.polygon([[x-r,y-r],[x+r,y-r],[x+r,y+r],[x-r,y+r]])
}
const def = (draw: (ctx: MotifContext) => Layer[], density = 0.45): MotifDef => ({
  repeats: d => 2 + d * density, angle: 0, background: p => p.bg, draw,
})

// Nitik: discrete square marks arranged like a woven floral lattice.
export const nitik = def(ctx => {
  if(ctx.generation>=3) return nitikRefined(ctx)
  const { unit: s, pal, rng } = ctx
  const dots = new PathBuilder(), accents = new PathBuilder()
  const dot = s * (0.009 + rng() * 0.006) + ctx.sw * .24
  const arm = rng() < .5 ? 3 : 4
  const structure = Math.floor(rng()*3)
  const centreSize = s*(.018+rng()*.026)
  grid(ctx, (x,y) => {
    for (let a=-6; a<=6; a++) for (let b=-6; b<=6; b++) {
      const ax=Math.abs(a), by=Math.abs(b)
      const inside = structure === 0 ? ax+by<=6 : structure === 1 ? Math.max(ax,by)<=5 : ax+by<=8
      const mark = structure === 2 ? ax===by || ax===0 || by===0 || ax+by===8 : ax===by || ax===arm || by===arm || ax+by===6
      if (inside && mark)
        square(dots,x+a*s/14,y+b*s/14,dot)
      if ((ax===6 && by===6) || (a===0 && b===0)) square(accents,x+a*s/14,y+b*s/14,dot*1.25)
    }
    square(accents,x,y,centreSize)
  })
  return [{ d:dots.toString(),fill:pal.line },{ d:accents.toString(),fill:pal.accent }]
}, .32)

// Jlamprang: connected circular medallions, an eightfold flower and small diamonds.
export const jlamprang = def(ctx => {
  const { unit:s, sw, pal, rng }=ctx
  const rings=new PathBuilder(), petals=new PathBuilder(), isen=new PathBuilder()
  const reach=s*(.32+rng()*.06), waist=s*(.028+rng()*.018)
  grid(ctx,(x,y)=>{
    rings.circle(x,y,s*.46).circle(x,y,s*.405)
    for(let k=0;k<8;k++) petals.lens(x,y,s*.09,reach,waist,k*45)
    isen.circle(x,y,s*.055)
    for(let k=0;k<16;k++) {
      const a=k*Math.PI/8
      isen.circle(x+Math.cos(a)*s*.435,y+Math.sin(a)*s*.435,s*.009)
    }
    isen.star(x+s/2,y+s/2,s*.12,s*.055,4)
  })
  return [{d:rings.toString(),fill:pal.deep,stroke:pal.line,sw}, {d:petals.toString(),fill:pal.line}, {d:isen.toString(),fill:pal.accent}]
})

// Megamendung: elongated, lobed cloud outlines nested in horizontal staggered rows.
function cloud(p:PathBuilder,x:number,y:number,s:number) {
  p.move(x-s*.49,y+s*.04)
    .cubic(x-s*.40,y-s*.06,x-s*.36,y-s*.19,x-s*.21,y-s*.16)
    .cubic(x-s*.20,y-s*.35,x+s*.08,y-s*.37,x+s*.14,y-s*.17)
    .cubic(x+s*.29,y-s*.26,x+s*.39,y-s*.10,x+s*.36,y-s*.04)
    .cubic(x+s*.49,y-s*.02,x+s*.51,y+s*.11,x+s*.43,y+s*.16)
    .cubic(x+s*.27,y+s*.27,x+s*.08,y+s*.17,x-s*.02,y+s*.12)
    .cubic(x-s*.20,y+s*.24,x-s*.30,y+s*.13,x-s*.49,y+s*.04).close()
}
export const megamendung = def(ctx => {
  if(ctx.generation>=3) return megamendungRefined(ctx)
  const {unit:s,pal,rng,sw}=ctx
  const layers=Array.from({length:5},()=>new PathBuilder())
  const stretch=.88+rng()*.09
  grid(ctx,(x,y)=>layers.forEach((p,k)=>cloud(p,x,y+k*s*.006,s*stretch*(1-k*.135))),true)
  return layers.map((p,k)=>({d:p.toString(),fill:[pal.deep,pal.line,pal.accent,pal.line,pal.bg][k],stroke:pal.deep,sw:sw*.55}))
},.3)

// Tambal: a patchwork of triangular fields. The fill marks are contained within
// each triangle by barycentric placement; they cannot spill into adjacent patches.
export const tambal = def(ctx=>{
  if(ctx.generation>=3) return tambalRefined(ctx)
  const {unit:s,pal,sw,seed}=ctx
  const patches=[new PathBuilder(),new PathBuilder()], ornaments=new PathBuilder(), seams=new PathBuilder()
  grid(ctx,(x,y,i,j)=>{
    const rng=mulberry32(cellSeed(seed,i,j,81))
    const a:[number,number]=[x-s/2,y-s/2], b:[number,number]=[x+s/2,y-s/2], c:[number,number]=[x+s/2,y+s/2], d:[number,number]=[x-s/2,y+s/2]
    const tris = rng()<.5 ? [[a,b,c],[a,c,d]] : [[a,b,d],[b,c,d]]
    tris.forEach((t,k)=>{
      patches[(Math.abs(i+j)+k)%2].polygon(t)
      seams.polygon(t)
      const style=rng()<.5, radius=s*(.012+rng()*.008)
      for(let u=1;u<6;u++) for(let v=1;v<6-u;v++) {
        const px=t[0][0]+(t[1][0]-t[0][0])*u/6+(t[2][0]-t[0][0])*v/6
        const py=t[0][1]+(t[1][1]-t[0][1])*u/6+(t[2][1]-t[0][1])*v/6
        if(style) ornaments.circle(px,py,radius)
        else ornaments.lens(px,py,-s*.025,s*.025,s*.009,45)
      }
    })
  })
  return [{d:patches[0].toString(),fill:pal.deep},{d:patches[1].toString(),fill:pal.accent},{d:ornaments.toString(),fill:pal.line},{d:seams.toString(),stroke:pal.line,sw}]
})

// Gringsing (batik, not Balinese double-ikat): touching scale-like round cells
// with a central dot. Rows are drawn top to bottom so their overlap forms scales.
export const gringsing = def(ctx=>{
  const {unit:s,pal,rng,sw}=ctx
  const layers:Layer[]=[], n=ctx.extent(s), dot=s*(.025+rng()*.035)
  const isen=Math.floor(rng()*3), inset=s*(.10+rng()*.07)
  for(let j=-n*2;j<=n*2;j++) {
    const outlines=new PathBuilder(), centres=new PathBuilder(), inner=new PathBuilder()
    for(let i=-n;i<=n;i++) {
      const x=(i+(Math.abs(j%2)*.5))*s,y=j*s*.5
      if(!ctx.inView(x,y,s))continue
      outlines.circle(x,y,s*.5)
      // Isen sits in the exposed upper cap, above the following row's overlap.
      if(isen===0) centres.circle(x,y-s*.18,dot)
      else if(isen===1) centres.circle(x-dot*1.4,y-s*.18,dot*.6).circle(x+dot*1.4,y-s*.18,dot*.6)
      else centres.star(x,y-s*.18,dot*1.4,dot*.5,4)
      inner.move(x-inset,y-s*.22).quad(x,y-s*.39,x+inset,y-s*.22)
    }
    layers.push({d:outlines.toString(),fill:pal.bg,stroke:pal.line,sw}, {d:inner.toString(),stroke:pal.line,sw:sw*.7}, {d:centres.toString(),fill:pal.accent})
  }
  return layers
},.6)

// Semen: a general vegetal interpretation (not Semen Rama or a named court cloth).
// Repeating mirrored curling stems, paired leaves, buds and a flower.
export const semen = def(ctx=>{
  const {unit:s,sw,pal,rng}=ctx
  const stems=new PathBuilder(), leaves=new PathBuilder(), flowers=new PathBuilder(), dots=new PathBuilder()
  const spread=.24+rng()*.09, reach=.28+rng()*.06
  grid(ctx,(x,y)=>{
    for(const sign of [-1,1]) {
      stems.move(x,y+s*.4).cubic(x+sign*s*.05,y+s*.1,x+sign*s*.48,y+s*.12,x+sign*s*spread,y-s*.2)
        .cubic(x+sign*s*.12,y-s*.36,x-sign*s*.02,y-s*.12,x+sign*s*.13,y-s*.1)
      for(let k=0;k<3;k++) {
        const lx=x+sign*s*(.07+k*.08),ly=y+s*(.25-k*.14)
        leaves.lens(lx,ly,0,s*reach*.55,s*.035,sign>0?-50:230)
        leaves.lens(lx,ly,0,s*reach*.4,s*.026,sign>0?35:145)
      }
    }
    for(let k=0;k<8;k++) flowers.lens(x,y-s*.34,s*.015,s*.11,s*.022,k*45)
    dots.circle(x,y-s*.34,s*.025)
    dots.circle(x,y+s*.43,s*.015)
  },true)
  return [{d:stems.toString(),stroke:pal.line,sw:sw*1.4},{d:leaves.toString(),fill:pal.deep,stroke:pal.line,sw},{d:flowers.toString(),fill:pal.line},{d:dots.toString(),fill:pal.accent}]
},.32)
