import { mix } from '../color'
import { PathBuilder } from '../path'
import { cellSeed, mulberry32 } from '../prng'
import type { Layer, MotifContext } from '../types'

// Original procedural interpretations. See docs/MOTIF-REFERENCES.md for the
// textiles studied and the boundary between structural reference and attribution.
function mark(p: PathBuilder, x: number, y: number, w: number, h = w) {
  p.rect(x,y,w,h)
}

export function nitikRefined(ctx: MotifContext): Layer[] {
  const {unit:s,pal,rng,sw}=ctx
  const light=new PathBuilder(), warm=new PathBuilder(), ground=new PathBuilder()
  const n=ctx.extent(s), step=s/24
  const size=s*(.0065+rng()*.0015)+sw*.055
  const petal=4+Math.floor(rng()*2), inset=rng()<.5?2:3
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++) {
    const x=i*s,y=j*s
    if(!ctx.inView(x,y,s*.72))continue
    // Four stepped petals, a dotted diamond girdle and small corner flowers.
    // Separate square/dash marks retain the woven quality even at low density.
    for(let a=-12;a<12;a++)for(let b=-12;b<12;b++) {
      const ax=Math.abs(a),by=Math.abs(b), sum=ax+by
      const petalDistance=Math.min(ax+Math.abs(by-6),by+Math.abs(ax-6))
      const corner=Math.abs(ax-12)+Math.abs(by-12)
      if(petalDistance===petal || sum===11 || sum===2 || corner===4)
        mark(light,x+a*step,y+b*step,size*(ax===by?1.15:1),size)
      else if(petalDistance===inset || corner===1 || (a===0&&b===0))
        mark(warm,x+a*step,y+b*step,size*.92)
      else if((ax%2===0&&by%2===0) && petalDistance>petal && sum>3 && corner>5)
        mark(ground,x+a*step,y+b*step,size*.6)
    }
  }
  return [{d:ground.toString(),fill:mix(pal.bg,pal.line,.48)},
    {d:light.toString(),fill:pal.line},{d:warm.toString(),fill:pal.accent}]
}

// A returning, tapered cloud contour. Upper and lower lobes follow one continuous
// silhouette; nested contours preserve the long tail instead of making bubbles.
function mendung(p: PathBuilder, x:number,y:number,s:number,sx:number,sy:number) {
  const X=(v:number)=>x+v*s*sx, Y=(v:number)=>y+v*s*sy
  p.move(X(-.57),Y(.11))
    .cubic(X(-.39),Y(.08),X(-.32),Y(-.10),X(-.19),Y(-.07))
    .cubic(X(-.30),Y(-.24),X(-.16),Y(-.37),X(.01),Y(-.30))
    .cubic(X(.12),Y(-.26),X(.12),Y(-.17),X(.08),Y(-.14))
    .cubic(X(.25),Y(-.29),X(.48),Y(-.18),X(.40),Y(-.04))
    .cubic(X(.37),Y(.01),X(.48),Y(.04),X(.57),Y(.01))
    .cubic(X(.50),Y(.13),X(.36),Y(.22),X(.21),Y(.15))
    .cubic(X(.12),Y(.10),X(.19),Y(.01),X(.25),Y(.06))
    .cubic(X(.17),Y(-.05),X(.03),Y(.04),X(.07),Y(.13))
    .cubic(X(.13),Y(.29),X(-.10),Y(.34),X(-.22),Y(.22))
    .cubic(X(-.32),Y(.12),X(-.43),Y(.17),X(-.57),Y(.11)).close()
}

export function megamendungRefined(ctx: MotifContext): Layer[] {
  const {unit:s,pal,sw,rng}=ctx
  const paths=Array.from({length:7},()=>new PathBuilder())
  const n=ctx.extent(s)*2, stretch=.92+rng()*.075, height=.76+rng()*.12
  const shift=rng()*.12
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++) {
    const x=(i+(Math.abs(j%2)*.5)+shift)*s*1.06,y=j*s*.51
    if(!ctx.inView(x,y,s*.72))continue
    for(let k=0;k<paths.length;k++) {
      const scale=1-k*.105
      mendung(paths[k],x,y,s,stretch*scale,height*scale)
    }
  }
  return paths.map((p,k)=>({d:p.toString(),fill:mix(pal.deep,pal.line,k/7),
    stroke:k===0?pal.line:pal.deep,sw:Math.min(s*.006,sw*.22)}))
}

export function tambalRefined(ctx: MotifContext): Layer[] {
  const {pal,sw,seed}=ctx
  const s=ctx.unit*1.32
  const fields=[new PathBuilder(),new PathBuilder(),new PathBuilder()]
  const shapes=new PathBuilder(), fine=new PathBuilder(), dots=new PathBuilder(), seams=new PathBuilder()
  const n=ctx.extent(s)*2, thin=Math.min(s*.008,sw*.3)
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++) {
    const x=(i+Math.abs(j%2)*.5)*s,y=j*s*.5
    if(!ctx.inView(x,y,s*.55))continue
    const rng=mulberry32(cellSeed(seed,i,j,103))
    const style=Math.floor(rng()*4), col=Math.abs(i+2*j)%3
    const vertices:Array<[number,number]>=[[x,y-s*.5],[x+s*.5,y],[x,y+s*.5],[x-s*.5,y]]
    fields[col].polygon(vertices);seams.polygon(vertices)
    // Dotted hems stay inside each diamond. They connect patches visually without
    // clipping or allowing their different interior repeats to bleed across seams.
    for(let edge=0;edge<4;edge++)for(let t=1;t<8;t++) {
      const a=vertices[edge],b=vertices[(edge+1)%4],u=t/8
      dots.dot(x+((a[0]-x)*(1-u)+(b[0]-x)*u)*.92,y+((a[1]-y)*(1-u)+(b[1]-y)*u)*.92,s*.0045)
    }
    if(style===0) {
      // Four Kawung-like paired lobes, with fine inner veins and cecek.
      for(const [cx,cy] of [[0,0],[-.23,0],[.23,0],[0,-.23],[0,.23]]) {
        const px=x+cx*s,py=y+cy*s,r=s*.105
        for(let k=0;k<4;k++) {
          shapes.lens(px,py,r*.12,r,r*.24,45+k*90)
          fine.lens(px,py,r*.28,r*.83,r*.085,45+k*90)
        }
        dots.dot(px,py,s*.009)
      }
    } else if(style===1) {
      // Diagonal undulating ribbons, with small mlinjon-like diamonds between.
      for(let k=-2;k<=2;k++) {
        const cx=x+k*s*.085,cy=y-k*s*.085
        shapes.move(cx-s*.16,cy-s*.16)
          .cubic(cx+s*.02,cy-s*.22,cx-s*.08,cy+s*.09,cx+s*.16,cy+s*.16)
          .cubic(cx-s*.04,cy+s*.22,cx+s*.05,cy-s*.08,cx-s*.16,cy-s*.16).close()
        fine.move(cx-s*.105,cy-s*.11).cubic(cx+s*.025,cy-s*.13,cx-s*.04,cy+s*.075,cx+s*.105,cy+s*.11)
      }
      for(const t of [-1,1])dots.star(x+t*s*.31,y,s*.022,s*.01,4)
    } else if(style===2) {
      for(let k=0;k<8;k++) {
        shapes.lens(x,y,s*.055,s*.27,s*.033,k*45)
        fine.lens(x,y,s*.09,s*.23,s*.012,k*45)
      }
      dots.dot(x,y,s*.034)
      for(let k=0;k<16;k++) {
        const a=k*Math.PI/8,r=s*(k%2?.30:.335)
        dots.dot(x+Math.cos(a)*r,y+Math.sin(a)*r,s*.008)
      }
    } else {
      for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)if(Math.abs(a)+Math.abs(b)<=4) {
        const px=x+a*s*.075,py=y+b*s*.075
        if((a+b)%2===0) {
          for(let k=0;k<4;k++)shapes.lens(px,py,s*.005,s*.027,s*.007,k*90)
          dots.dot(px,py,s*.005)
        } else dots.dot(px,py,s*.008)
      }
    }
  }
  return [...fields.map((p,k)=>({d:p.toString(),fill:[pal.deep,mix(pal.bg,pal.deep,.55),mix(pal.accent,pal.deep,.6)][k]})),
    {d:shapes.toString(),fill:pal.line},{d:fine.toString(),stroke:pal.deep,sw:thin*.65},
    {d:dots.toString(),fill:pal.line},{d:seams.toString(),stroke:pal.line,sw:thin}]
}
