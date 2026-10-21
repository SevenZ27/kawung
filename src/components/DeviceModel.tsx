import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import type { Params } from '../lib/params'
import { drawScene } from '../lib/render'
import { buildScene, logicalSize } from '../lib/scene'
import { readClock, CLOCK_LIGHT, CLOCK_DARK } from '../lib/browser'
import { deviceResource } from '../lib/deviceResource'

interface Props { params: Params; aspect: number; onError: () => void; reduced: boolean }
type RenderState = { texture: THREE.CanvasTexture; canvas: HTMLCanvasElement; render: () => void }

export default function DeviceModel({params,aspect,onError,reduced}:Props) {
  const [limited,setLimited]=useState(false)
  const host=useRef<HTMLDivElement>(null)
  const renderState=useRef<RenderState|null>(null)
  const modelRef=useRef<THREE.Group|null>(null)
  const rotationFrame=useRef(0)
  const rotationTarget=useRef({x:0,y:0})
  const stopRotation=()=>{cancelAnimationFrame(rotationFrame.current);rotationFrame.current=0;if(host.current)host.current.dataset.moving='false'}
  const latest=useRef({params,aspect});latest.current={params,aspect}
  const draw=()=>{
    const state=renderState.current;if(!state)return
    const {params:p,aspect:a}=latest.current, {canvas,texture}=state
    const ctx=canvas.getContext('2d')!;const w=canvas.width,h=canvas.height
    ctx.fillStyle='#070709';ctx.fillRect(0,0,w,h)
    const ah=Math.min(h,w/a),aw=ah*a,x=(w-aw)/2,y=(h-ah)/2
    ctx.save();ctx.translate(x,y)
    drawScene(ctx,buildScene(p,logicalSize(a)),aw,ah)
    const reading=readClock(p,a)
    ctx.fillStyle=reading.tone==='light'?CLOCK_LIGHT:CLOCK_DARK
    ctx.textAlign='center';ctx.textBaseline='top'
    ctx.shadowColor=reading.tone==='light'?'#00000066':'#ffffff66';ctx.shadowBlur=3
    const hp=p.v==='hp'
    ctx.font=`560 ${aw*(hp?.046:.019)}px "Inter Variable", sans-serif`
    ctx.fillText(new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long'}).format(new Date()),aw/2,ah*(hp?.105:.26))
    ctx.font=`620 ${aw*(hp?.23:.09)}px "Inter Variable", sans-serif`
    ctx.fillText('9:41',aw/2,ah*(hp?.14:.31))
    ctx.restore();texture.needsUpdate=true;state.render()
  }
  useEffect(()=>{ draw() },[params,aspect])
  useEffect(()=>{
    const el=host.current;if(!el)return
    delete el.dataset.ready
    let renderer:THREE.WebGLRenderer
    // This viewer renders on demand. Retain its last frame between interactions,
    // including when the browser composites a high-DPR canvas after a fade.
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}) } catch { onError();return }
    let cancelled=false
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,3))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1
    renderer.domElement.setAttribute('aria-label',params.v==='hp'?'Model 3D iPhone 18 Pro Max Burgundy':'Model 3D Studio Display')
    renderer.domElement.setAttribute('role','img')
    renderer.domElement.dataset.testid='device-canvas'
    el.appendChild(renderer.domElement)
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,30)
    camera.position.set(0,0,4);camera.lookAt(0,0,0)
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment()
    const env=pmrem.fromScene(room,.04);scene.environment=env.texture
    room.dispose();pmrem.dispose()
    scene.add(new THREE.HemisphereLight(0xffffff,0x6b5145,.6))
    const key=new THREE.DirectionalLight(0xffffff,1.5);key.position.set(-3,4,5);scene.add(key)
    const canvas=document.createElement('canvas')
    const targetWidth=params.v==='hp'?1320:5120,targetHeight=params.v==='hp'?2868:2880
    const scale=Math.min(1,renderer.capabilities.maxTextureSize/Math.max(targetWidth,targetHeight))
    canvas.width=Math.floor(targetWidth*scale);canvas.height=Math.floor(targetHeight*scale)
    setLimited(scale<1)
    el.dataset.textureSize=`${canvas.width}x${canvas.height}`
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace
    texture.anisotropy=renderer.capabilities.getMaxAnisotropy()
    const render=()=>{if(!cancelled)renderer.render(scene,camera)}
    renderState.current={canvas,texture,render}
    let group:THREE.Group|null=null
    const resize=()=>{
      const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return
      const a=w/h,modelWidth=params.v==='hp'?.58:1.45
      const half=Math.max(.58,modelWidth/a/2)
      camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()
      renderer.setSize(w,h,false);render()
    }
    const ro=new ResizeObserver(resize);ro.observe(el);resize()
    const request = new AbortController()
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    deviceResource(params.v==='hp'?'iphone':'studio-display', request.signal)
      .then(bytes => { if(cancelled) return null; return loader.parseAsync(bytes, '') })
      .then(gltf=>{
      if(!gltf)return
      if(cancelled){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});return}
      group=gltf.scene;modelRef.current=group
      let screen=false
      group.traverse(o=>{if(o instanceof THREE.Mesh && o.name==='WallpaperScreen'){
        // The compressed model has no baked image, so its unused UVs may be
        // pruned. Map the actual screen mesh, including its rounded perimeter.
        o.geometry.computeBoundingBox()
        const bounds=o.geometry.boundingBox!,pos=o.geometry.attributes.position
        const uv=new Float32Array(pos.count*2)
        for(let i=0;i<pos.count;i++){
          uv[i*2]=(pos.getX(i)-bounds.min.x)/(bounds.max.x-bounds.min.x)
          uv[i*2+1]=(pos.getY(i)-bounds.min.y)/(bounds.max.y-bounds.min.y)
        }
        o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        // Calibrate the model's horizontal proportion to the native display.
        // This keeps the texture undistorted while retaining the source bezel.
        group!.scale.x=(targetWidth/targetHeight)/((bounds.max.x-bounds.min.x)/(bounds.max.y-bounds.min.y));
        (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())
        o.material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})
        screen=true
      }})
      if(!screen){onError();return}
      group.rotation.y=params.v==='hp'?-.22:.18
      scene.add(group);draw();resize()
      // Ready includes the final font-backed screen texture, not the transient
      // fallback-font frame. This also keeps front-view comparisons stable.
      document.fonts.ready.then(()=>{if(!cancelled){draw();el.dataset.ready='true'}})
    }).catch(()=>{if(!cancelled)onError()})
    let drag:{x:number;y:number;rx:number;ry:number}|null=null
    const down=(e:PointerEvent)=>{if(!group)return;stopRotation();drag={x:e.clientX,y:e.clientY,rx:group.rotation.x,ry:group.rotation.y};renderer.domElement.setPointerCapture(e.pointerId)}
    const move=(e:PointerEvent)=>{if(!drag||!group)return;group.rotation.y=drag.ry+(e.clientX-drag.x)*.009;group.rotation.x=Math.max(-.35,Math.min(.35,drag.rx+(e.clientY-drag.y)*.006));render()}
    const up=()=>{drag=null}
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up)
    const lost=(e:Event)=>{e.preventDefault();onError()};renderer.domElement.addEventListener('webglcontextlost',lost)
    return()=>{
      cancelled=true;request.abort();stopRotation();ro.disconnect();modelRef.current=null;renderState.current=null
      renderer.domElement.removeEventListener('webglcontextlost',lost)
      renderer.domElement.remove();texture.dispose();env.dispose()
      if(group)group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}})
      renderer.dispose();renderer.forceContextLoss()
    }
  },[params.v,onError])
  const turn=(direction:number)=>{
    const m=modelRef.current;if(!m)return
    const from={x:m.rotation.x,y:m.rotation.y}
    const to=direction===0?{x:0,y:0}:{x:m.rotation.x,y:(rotationFrame.current?rotationTarget.current.y:m.rotation.y)+direction*.35}
    stopRotation();rotationTarget.current=to
    if(reduced){m.rotation.set(to.x,to.y,0);renderState.current?.render();return}
    if(host.current)host.current.dataset.moving='true'
    const start=performance.now()
    const step=(now:number)=>{
      const t=Math.min(1,(now-start)/260),ease=1-Math.pow(1-t,3)
      m.rotation.set(from.x+(to.x-from.x)*ease,from.y+(to.y-from.y)*ease,0)
      renderState.current?.render()
      if(t<1)rotationFrame.current=requestAnimationFrame(step)
      else stopRotation()
    }
    rotationFrame.current=requestAnimationFrame(step)
  }
  return <div className="device-3d-wrap">
    <div ref={host} className="device-3d-host" data-testid="device-3d"><p className="model-loading" role="status">Menyiapkan perangkat 3D…</p></div>
    <div className="device-view-controls" aria-label="Sudut perangkat">
      <button type="button" onClick={()=>turn(-1)} aria-label="Putar perangkat ke kiri"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 4 9l4 4M4 9h9a6 6 0 1 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      <button type="button" onClick={()=>turn(0)}>Tampak depan</button>
      <button type="button" onClick={()=>turn(1)} aria-label="Putar perangkat ke kanan"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m16 5 4 4-4 4m4-4h-9a6 6 0 1 0 0 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    </div>
    <p className="device-hint">Geser perangkat untuk memutar{limited?' · Resolusi preview disesuaikan dengan GPU':''}</p>
  </div>
}
