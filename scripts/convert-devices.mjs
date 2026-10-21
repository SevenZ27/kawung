import { chromium } from '@playwright/test'
import { writeFile, mkdir } from 'node:fs/promises'
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'})
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4185/')
 page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text().slice(0,200))})
 const pending=[]
 for(const id of ['studio-display','iphone']){
  const result=await page.evaluate(async id=>{
   const THREE=await import('/node_modules/three/build/three.module.js')
   const {USDLoader}=await import('/node_modules/three/examples/jsm/loaders/USDLoader.js')
   const {FBXLoader}=await import('/node_modules/three/examples/jsm/loaders/FBXLoader.js')
   const {GLTFExporter}=await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js')
   const manager=new THREE.LoadingManager()
   // Supplied materials reference HEIC/C4D assets unsupported by ordinary web
   // image decoders. Use neutral maps during conversion; authored PBR materials
   // are applied explicitly in the viewer, not silently claimed as original.
   const blank='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
   manager.setURLModifier(url=>/\.(heic|png|jpe?g|exr|webp)(\?|$)/i.test(url)||url.startsWith('blob:')?blank:url)
   const loader=id==='iphone'?new FBXLoader(manager):new USDLoader(manager)
   const model=await loader.loadAsync(`/qa/assets/${id==='iphone'?'iphone.fbx':'studio-display.usdz'}`)
   model.updateMatrixWorld(true)
   const rows=[]
   model.traverse(o=>{if(o.isMesh){
    const box=new THREE.Box3().setFromObject(o),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3())
    const old=Array.isArray(o.material)?o.material:[o.material]
    rows.push({name:o.name,vertices:o.geometry.attributes.position.count,center:center.toArray(),size:size.toArray(),materials:old.map(m=>({name:m.name,color:m.color?.getHexString(),metalness:m.metalness,roughness:m.roughness}))})
    const mats=old.map(m=>new THREE.MeshStandardMaterial({name:m.name,color:m.color||0xaaaaaa,metalness:m.metalness??.4,roughness:m.roughness??.4}))
    o.material=mats.length===1?mats[0]:mats
   }})
   const clean=new THREE.Group()
   const screenName=id==='iphone'?'rSYpIVXECynXeUU':'NYVmzMLiovxElXF'
   model.traverse(o=>{if(!o.isMesh)return
    const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new THREE.Vector3())
    if(id==='iphone'&&(c.y < -1000 || c.z < -100))return
    if(id==='studio-display'&&['oPLQEnWQussgAtE','kEeoAAisYLioNOC'].includes(o.name))return
    const geo=o.geometry.clone().applyMatrix4(o.matrixWorld)
    const materials=Array.isArray(o.material)?o.material:[o.material]
    const mats=materials.map(m=>{
      if(id==='studio-display')return m
      const body=/背面|按钮|金属/.test(m.name)
      const antenna=/天线/.test(m.name)
      const glass=/光泽|通用/.test(m.name)
      return new THREE.MeshStandardMaterial({name:m.name,color:antenna?0x35252c:body?0x602b40:glass?0x0e1017:0x34373d,metalness:body?.72:.3,roughness:glass?.19:.36})
    })
    const mesh=new THREE.Mesh(geo,mats.length===1?mats[0]:mats);mesh.name=o.name
    if(o.name===screenName){
      mesh.name='WallpaperScreen';geo.computeBoundingBox()
      const bb=geo.boundingBox,pos=geo.attributes.position,uv=new Float32Array(pos.count*2)
      for(let i=0;i<pos.count;i++){uv[i*2]=(pos.getX(i)-bb.min.x)/(bb.max.x-bb.min.x);uv[i*2+1]=(pos.getY(i)-bb.min.y)/(bb.max.y-bb.min.y)}
      geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.clearGroups()
      mesh.material=new THREE.MeshBasicMaterial({color:0x333333,side:THREE.DoubleSide})
    }
    // Export the neutral PBR scene; no C4D rendering environment is embedded.
    clean.add(mesh)
   })
   const box=new THREE.Box3().setFromObject(clean),center=box.getCenter(new THREE.Vector3()),scale=1/box.getSize(new THREE.Vector3()).y
   clean.children.forEach(o=>{o.geometry.translate(-center.x,-center.y,-center.z);o.geometry.scale(scale,scale,scale)})
   clean.updateMatrixWorld(true)
   const binary=await new GLTFExporter().parseAsync(clean,{binary:true,onlyVisible:true})
   let str='';const bytes=new Uint8Array(binary);for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192))
   return {base64:btoa(str),rows,bounds:{min:box.min.toArray(),max:box.max.toArray()}}
  },id)
  pending.push([id,result.base64])
  await writeFile(`qa/assets/${id}-nodes.json`,JSON.stringify({bounds:result.bounds,rows:result.rows},null,2))
  console.log(id,JSON.stringify({bounds:result.bounds,meshes:result.rows.length,bytes:Buffer.from(result.base64,'base64').length}))
 }
 await page.close()
 await mkdir('qa/assets/converted-local-only',{recursive:true})
 for(const [id,base64] of pending)await writeFile(`qa/assets/converted-local-only/${id}.glb`,Buffer.from(base64,'base64'))
}finally{await browser.close()}
