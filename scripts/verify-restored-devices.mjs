const {chromium,webkit}=await import(process.env.UI_PLAYWRIGHT_ENTRY || '@playwright/test')
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const baseURL=process.env.QA_ORIGIN||'http://127.0.0.1:4186'
const tag=process.env.QA_TAG||'restored'
await mkdir('docs/screenshots/release',{recursive:true})
const rows=[]
for(const [engine,type] of [['chrome',chromium],['webkit',webkit]]) {
 if(process.env.QA_ENGINE&&process.env.QA_ENGINE!==engine)continue
 const browser=await type.launch(engine==='chrome'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}:{headless:true})
 for(const width of [1440,390])for(const device of ['hp','desktop']) {
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},deviceScaleFactor:width===1440?1:3,reducedMotion:'reduce',acceptDownloads:true})
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  if(process.env.QA_BUFFER==='true')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')args[0]={...args[0],preserveDrawingBuffer:true};return get.call(this,type,...args)}})
  const x=device==='hp'?1320:2880,y=device==='hp'?2868:5120
  await page.goto(`${baseURL}/?m=${device==='hp'?'tambal':'megamendung'}&s=4821&p=sogan&d=2&w=5&r=0&g=3&v=${device}&x=${x}&y=${y}`)
  await page.getByTestId('device-3d').filter({visible:true}).waitFor()
  await page.waitForFunction(()=>document.querySelector('[data-testid="device-3d"]')?.getAttribute('data-ready')==='true')
  await page.getByRole('button',{name:'Tampak depan',exact:true}).click()
  const screenshot=await page.getByTestId('device-canvas').screenshot()
  const visiblePixels=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let count=0,total=0;for(let i=0;i<d.length;i+=40){if(d[i]+d[i+1]+d[i+2]<500&&d[i+3]>20)count++;total++}return count/total},`data:image/png;base64,${screenshot.toString('base64')}`)
  assert.ok(visiblePixels>.05,`Blank device: ${engine}/${width}/${device}, visible pixels ${visiblePixels}`)
  await page.screenshot({path:`docs/screenshots/release/${tag}-${engine}-${width}-${device}-front.png`})
  await page.getByRole('button',{name:'Putar perangkat ke kanan',exact:true}).click()
  await page.screenshot({path:`docs/screenshots/release/${tag}-${engine}-${width}-${device}-angle.png`})
  if(tag.startsWith('restored')) {
   for(let i=0;i<8;i++)await page.getByRole('button',{name:'Putar perangkat ke kanan',exact:true}).click()
   await page.screenshot({path:`docs/screenshots/release/${tag}-${engine}-${width}-${device}-rear.png`})
   await page.getByRole('button',{name:'Tampak depan',exact:true}).click()
  }
  await page.addScriptTag({path:process.env.UI_AXE_PATH || 'node_modules/axe-core/axe.min.js'})
  const violations=await page.evaluate(async()=> (await window.axe.run()).violations.map(x=>({id:x.id,impact:x.impact})))
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
  rows.push({engine,version:browser.version(),width,device,visiblePixels,errors,violations,overflow,texture:await page.getByTestId('device-3d').getAttribute('data-texture-size')})
  await context.close()
 }
 await browser.close()
}
await writeFile(`docs/verification/release-${tag}.json`,JSON.stringify({baseURL,cases:rows},null,2))
console.log(JSON.stringify(rows,null,2))
if(rows.some(r=>r.errors.length||r.violations.length||r.overflow))process.exitCode=1
