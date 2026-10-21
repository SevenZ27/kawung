const {chromium,webkit}=await import(process.env.UI_PLAYWRIGHT_ENTRY || '@playwright/test');
import {writeFile,readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const rows=process.env.QA_ENGINE?JSON.parse(await readFile('docs/verification/motif-revision/motion.json','utf8')).filter(r=>r.name!==process.env.QA_ENGINE):[],axe=await readFile(process.env.UI_AXE_PATH || 'node_modules/axe-core/axe.min.js','utf8');
for(const name of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chrome','webkit'])){
 const b=await(name==='chrome'?chromium:webkit).launch(name==='chrome'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{});
 try{for(const [width,height]of [[1440,900],[390,844]]){
  const c=await b.newContext({viewport:{width,height},deviceScaleFactor:2,hasTouch:width<1000,isMobile:width<1000});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4186/?m=megamendung&s=4821&g=3&v=desktop&x=2880&y=5120&p=nila&d=3');
  const host=p.getByTestId('device-3d');await host.locator('[role=status]').waitFor({state:'hidden'});await p.getByRole('button',{name:'Putar perangkat ke kanan',exact:true}).click();await p.waitForTimeout(60);
  const midMoving=await host.getAttribute('data-moving');assert.equal(midMoving,'true');await p.locator('[data-moving=false]').waitFor();
  await p.getByRole('button',{name:'Tampak depan',exact:true}).click();await p.locator('[data-moving=false]').waitFor();
  await p.getByRole('button',{name:'Komposisi',exact:true}).click();await p.locator('[data-preview-view=composition][data-leaving=false]').waitFor();await p.waitForTimeout(260);
  await p.evaluate(()=>{window.motionSamples=[];document.querySelector('[data-device=hp]').addEventListener('click',()=>{const start=performance.now();const tick=()=>{const el=document.querySelector('.preview-surface');window.motionSamples.push({ms:performance.now()-start,opacity:Number(getComputedStyle(el).opacity),leaving:el.dataset.leaving,device:el.dataset.previewDevice});if(performance.now()-start<420)requestAnimationFrame(tick)};requestAnimationFrame(tick)},{once:true})});
  await p.getByRole('radio',{name:'HP',exact:true}).click();await p.waitForTimeout(450);const motionSamples=await p.evaluate(()=>window.motionSamples);console.log(name,width,'samples',motionSamples);const midOpacity=motionSamples.find(s=>s.opacity>0&&s.opacity<1)?.opacity;assert.ok(midOpacity!==undefined);
  await p.getByRole('radio',{name:'Desktop',exact:true}).click();await p.waitForTimeout(450);assert.equal(await p.locator('.preview-surface').getAttribute('data-preview-device'),'desktop');
  if(width<1000)await p.getByRole('button',{name:'Atur wallpaper',exact:true}).click();
  await p.getByRole('radio',{name:'Bebas',exact:true}).locator('..').click();await p.waitForTimeout(350);await p.getByLabel('Warna dasar',{exact:true}).fill('#35634b');
  for(const [label,value]of [['Kepadatan','8'],['Ketebalan garis','6'],['Rotasi','23'],['Dim · gelap ke terang','-30']])await p.getByLabel(label,{exact:true}).fill(value);
  await p.getByRole('button',{name:'Acak',exact:true}).click();
  await p.getByTestId('download-desktop').scrollIntoViewIfNeeded();await p.screenshot({path:`qa/motion-${name}-${width}-settings.png`});
  await p.addScriptTag({content:axe});const violations=await p.evaluate(async()=> (await axe.run()).violations.map(v=>v.id));
  if(width<1000){await p.keyboard.press('Escape');await p.waitForTimeout(360);assert.equal(await p.getByRole('dialog').count(),0);}
  await p.screenshot({path:`qa/motion-${name}-${width}-final.png`});
  rows.push({name,version:b.version(),width,height,midMoving,midOpacity,motionSamples,violations,errors});console.log(rows.at(-1));assert.equal(violations.length,0);assert.equal(errors.length,0);await c.close();
 }}finally{await b.close();await writeFile('docs/verification/motif-revision/motion.json',JSON.stringify(rows,null,2))}
}
