import { chromium } from '@playwright/test'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

// Run against the local Vite source server. No remote analytics or services.
const origin=process.env.EVAL_ORIGIN || 'http://127.0.0.1:4185'
const generation=Number(process.env.EVAL_GENERATION || 2)
if (![2,3].includes(generation)) throw Error('EVAL_GENERATION must be 2 or 3')
const out=process.env.EVAL_OUT || (generation===3?'docs/verification/motif-revision':'docs/verification/stage-two')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'})
try {
  const page=await browser.newPage(); await page.goto(origin)
  const result=await page.evaluate(async(generation)=>{
    const {DEFAULTS,MOTIF_IDS}=await import('/src/lib/params.ts')
    const {buildScene,logicalSize}=await import('/src/lib/scene.ts')
    const {sceneToSvg,drawScene}=await import('/src/lib/render.ts')
    const {sampleClock}=await import('/src/lib/browser.ts')
    const {chooseClock,contrastStats,CLOCK_LIGHT,CLOCK_DARK}=await import('/src/lib/readability.ts')
    const {medianContrast,luminance}=await import('/src/lib/color.ts')
    const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',value)),v=>v.toString(16).padStart(2,'0')).join('')
    const encoder=new TextEncoder(),unique=[],samples=[],timing=[]
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64
    const ctx=canvas.getContext('2d',{willReadFrequently:true})
    for(const m of MOTIF_IDS){
      const hashes=new Set(),raster=new Set();let duplicate=null
      for(let s=0;s<500;s++){
        const scene=buildScene({...DEFAULTS,m,s,g:generation},{w:1000,h:1000})
        const h=await hash(encoder.encode(sceneToSvg(scene)))
        if(hashes.has(h)&&duplicate===null)duplicate=s
        hashes.add(h);drawScene(ctx,scene,64,64)
        const data=ctx.getImageData(0,0,64,64).data
        // Coarse thumbnail identity is stronger than path-string uniqueness,
        // but still not a perceptual distinctness or cultural fidelity score.
        for(let k=0;k<data.length;k++)if(k%4!==3)data[k]=Math.round(data[k]/16)*16
        raster.add(await hash(data))
      }
      unique.push({motif:m,seeds:500,uniqueSvg:hashes.size,uniqueQuantized64:raster.size,firstDuplicateSeed:duplicate})
      const times=[];let characters=0
      for(let n=0;n<26;n++){
        const start=performance.now();const svg=sceneToSvg(buildScene({...DEFAULTS,m,s:n,g:generation,d:10,w:10,r:45},logicalSize(1320/2868)))
        if(n)times.push(performance.now()-start);characters=svg.length
      }
      times.sort((a,b)=>a-b);timing.push({motif:m,n:25,medianMs:times[12],p95Ms:times[23],svgCharacters:characters})
    }
    // Locked evaluation seeds, not the development/demo seeds 0 and 4821.
    // 10 motifs × 4 palettes × 2 devices × 3 dim levels × 3 seeds = 720 cases.
    for(const m of MOTIF_IDS)for(const p of ['sogan','nila','gading','bebas'])for(const v of ['hp','desktop'])for(const dim of [-60,0,60])for(const [i,s] of [137,7919,90523].entries()){
      const params={...DEFAULTS,m,p,v,dim,s,g:generation,c:'888888',d:[1,5,10][i],w:[10,4,1][i],r:[0,33,179][i]}
      const aspect=v==='hp'?1320/2868:16/9
      const low=sampleClock(params,aspect,90)
      const oldTone=medianContrast(luminance(CLOCK_LIGHT),low)>=medianContrast(luminance(CLOCK_DARK),low)?'light':'dark'
      const start=performance.now(),chosen=chooseClock(sampleClock(params,aspect,240)),ms=performance.now()-start
      const reference=sampleClock(params,aspect,720)
      const old=contrastStats(oldTone==='light'?CLOCK_LIGHT:CLOCK_DARK,reference)
      const now=contrastStats(chosen.tone==='light'?CLOCK_LIGHT:CLOCK_DARK,reference)
      samples.push({m,p,v,dim,s,d:params.d,w:params.w,r:params.r,oldTone,newTone:chosen.tone,oldBelow3:old.below3,newBelow3:now.below3,oldP10:old.p10,newP10:now.p10,reportedP10:chosen.p10,referenceP10:now.p10,referenceBelow45:now.below45,readMs:ms})
    }
    const mean=(rows,key)=>rows.reduce((s,r)=>s+r[key],0)/rows.length
    const summary={cases:samples.length,meanOldBelow3:mean(samples,'oldBelow3'),meanNewBelow3:mean(samples,'newBelow3'),improved:samples.filter(r=>r.newBelow3<r.oldBelow3-1e-6).length,regressed:samples.filter(r=>r.newBelow3>r.oldBelow3+1e-6).length,unchanged:samples.filter(r=>Math.abs(r.newBelow3-r.oldBelow3)<=1e-6).length,meanP10AbsoluteError:samples.reduce((s,r)=>s+Math.abs(r.reportedP10-r.referenceP10),0)/samples.length,byDim:[-60,0,60].map(dim=>{const rows=samples.filter(r=>r.dim===dim);return{dim,n:rows.length,meanBelow3:mean(rows,'newBelow3'),allRegionAtLeast45:rows.filter(r=>r.referenceBelow45===0).length}}),byMotif:MOTIF_IDS.map(m=>{const rows=samples.filter(r=>r.m===m);return{m,n:rows.length,oldBelow3:mean(rows,'oldBelow3'),newBelow3:mean(rows,'newBelow3')}})}
    return {unique,timing,samples,summary}
  },generation)
  const hashes={}
  async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())await walk(p);else if(/\.(ts|tsx|css)$/.test(p))hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex')}}
  await walk('src')
  const manifest={schema:1,generation,runAt:new Date().toISOString(),browser:browser.version(),platform:process.platform,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceSha256:hashes,protocol:'docs/EVALUATION.md',limits:'Synthetic fixed configuration suite; no random population sample, human readability study, cultural expert validation, or physical-mobile performance claim.'}
  await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2))
  await writeFile(`${out}/results.json`,JSON.stringify(result,null,2))
  const keys=Object.keys(result.samples[0]);await writeFile(`${out}/readability.csv`,[keys.join(','),...result.samples.map(r=>keys.map(k=>r[k]).join(','))].join('\n'))
  console.log(JSON.stringify({unique:result.unique,summary:result.summary,timing:result.timing},null,2))
} finally { await browser.close() }
