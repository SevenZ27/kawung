const {chromium,webkit}=await import(process.env.UI_PLAYWRIGHT_ENTRY || '@playwright/test');
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/verification/motif-revision';await mkdir(out,{recursive:true});await mkdir('docs/screenshots/motif-revision',{recursive:true});
const axe=await readFile(process.env.UI_AXE_PATH || 'node_modules/axe-core/axe.min.js','utf8'),results=[];
for(const name of ['chrome','webkit']){
 const b=await (name==='chrome'?chromium:webkit).launch(name==='chrome'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{});
 try{for(const [width,height,dpr] of [[1440,900,1],[390,844,3],[320,568,2],[812,375,2]]){
  const c=await b.newContext({viewport:{width,height},screen:{width,height},deviceScaleFactor:dpr,hasTouch:width<1000,isMobile:width<1000,reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const m of (width===1440?['nitik','megamendung','tambal']:['tambal']))for(const v of ['hp','desktop']){
   const x=v==='hp'?1320:2880,y=v==='hp'?2868:5120,aspect=v==='hp'?x/y:y/x;
   await p.goto(`http://127.0.0.1:4186/?m=${m}&s=4821&g=3&v=${v}&x=${x}&y=${y}&p=${m==='nitik'?'nila':'sogan'}&d=5&w=4`);
   await p.getByRole('button',{name:'Komposisi',exact:true}).click();
   const f=p.locator('.composition-artboard'),screen=p.locator('.lock-screen');await f.waitFor();
   const box=await f.boundingBox(),s=await screen.boundingBox();assert.ok(s&&box);assert.ok(Math.abs(s.width/s.height-aspect)<.002);
   assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);assert.ok(s.height>=100);if(v==='desktop'){const foot=await p.locator('.front-foot').boundingBox();assert.ok(foot.y+foot.height<height);}
   const style=await f.evaluate(e=>{const s=getComputedStyle(e);return{shadow:s.boxShadow,transform:s.transform,radius:s.borderRadius}});assert.equal(style.shadow,'none');assert.equal(style.transform,'none');
   assert.equal(await p.getByRole('button',{name:'Jam',exact:true}).count(),0);assert.equal(await p.locator('.lock-clock,.desk-clock').count(),1);await p.locator('.preview-surface[data-preview-view=composition][data-leaving=false]').waitFor();
   const shot=`docs/screenshots/motif-revision/${name}-${width}-${v}-${m}.png`;await p.screenshot({path:shot});
   await p.addScriptTag({content:axe});const violations=await p.evaluate(async()=> (await axe.run()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
   const overflow=await p.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}));
   results.push({name,version:b.version(),width,height,dpr,v,m,screen:s,frame:box,style,overflow,violations,errors:[...errors],shot});console.log(name,width,v,m,s.width.toFixed(1),s.height.toFixed(1),violations.length,errors.length);
  }
  await c.close();
 }}catch(e){results.push({name,failure:e.stack});console.log(name,e.stack)}finally{await b.close();await writeFile(`${out}/browser.json`,JSON.stringify(results,null,2))}
}
if(results.some(r=>r.failure||r.violations?.length||r.errors?.length||r.overflow?.x||r.overflow?.y))process.exitCode=1;
