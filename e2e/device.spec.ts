import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { pngSize, wallpaperSvg } from './helpers'

for (const device of ['hp','desktop'] as const) {
  test(`${device}: native screen texture matches PNG and rotates with the device`, async ({page}) => {
    await page.setViewportSize({width:1440,height:900})
    await page.addInitScript(() => {
      for(const method of ['texImage2D','texSubImage2D'] as const) {
        const original=WebGL2RenderingContext.prototype[method]
        ;(WebGL2RenderingContext.prototype as any)[method]=function(...args:any[]) {
          const canvas=args.find(x=>x instanceof HTMLCanvasElement && [1320,5120].includes(x.width))
          if(canvas) (window as any).uploadedScreen=canvas.toDataURL('image/png')
          return (original as any).apply(this,args)
        }
      }
    })
    const width=device==='hp'?1320:5120,height=device==='hp'?2868:2880
    await page.goto(`/?m=${device==='hp'?'nitik':'megamendung'}&s=4821&d=6&g=3&dim=-25&v=${device}&x=${Math.min(width,height)}&y=${Math.max(width,height)}`)
    const host=page.getByTestId('device-3d'),canvas=page.getByTestId('device-canvas')
    await expect(host).toHaveAttribute('data-ready','true')
    await expect(host).toHaveAttribute('data-texture-size',`${width}x${height}`)
    await page.getByRole('button',{name:'Tampak depan',exact:true}).click()
    await expect(host).toHaveAttribute('data-moving','false')
    await expect.poll(()=>page.evaluate(()=>!!(window as any).uploadedScreen)).toBe(true)
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId(`download-${device}`).click()])
    expect(pngSize((await download.path())!)).toEqual({width,height})
    const png=`data:image/png;base64,${readFileSync((await download.path())!).toString('base64')}`
    const difference=await page.evaluate(async({png,width,height})=>{
      const pixels=async(src:string)=>{
        const img=new Image();img.src=src;await img.decode()
        const c=document.createElement('canvas');c.width=width;c.height=height
        const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);return ctx.getImageData(0,0,width,height).data
      }
      const a=await pixels((window as any).uploadedScreen),b=await pixels(png)
      let error=0,n=0
      // The lower half contains wallpaper only: date/clock are intentionally preview-only.
      for(let y=Math.ceil(height*.55);y<height;y+=3)for(let x=0;x<width;x+=3)for(let k=0;k<3;k++){
        const i=(y*width+x)*4+k;error+=Math.abs(a[i]-b[i]);n++
      }
      return error/n
    },{png,width,height})
    expect(difference).toBeLessThan(.1)
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).opacity)).toBe('1')
    // An idle canvas must retain real pixels, not merely report data-ready.
    const coverage=await canvas.evaluate(async el=>{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
      const gl=(el as HTMLCanvasElement).getContext('webgl2')!
      const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4)
      gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
      let visible=0,total=0
      for(let i=3;i<pixels.length;i+=40){if(pixels[i]>20)visible++;total++}
      return visible/total
    })
    expect(coverage).toBeGreaterThan(.05)
    const front=await canvas.screenshot()
    await page.getByRole('button',{name:'Putar perangkat ke kanan',exact:true}).click()
    await expect(host).toHaveAttribute('data-moving','false')
    expect((await canvas.screenshot()).equals(front)).toBe(false)
    await page.getByRole('button',{name:'Tampak depan',exact:true}).click()
    await expect(host).toHaveAttribute('data-moving','false')
    // Rotation can finish before the browser compositor presents that frame.
    await expect.poll(async()=> (await canvas.screenshot()).equals(front)).toBe(true)
    const box=(await canvas.boundingBox())!
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2)
    await page.mouse.down();await page.mouse.move(box.x+box.width/2+60,box.y+box.height/2+20,{steps:8});await page.mouse.up()
    expect((await canvas.screenshot()).equals(front)).toBe(false)
    await page.getByLabel('Dim · gelap ke terang',{exact:true}).fill('40')
    await expect(page).toHaveURL(/dim=40/)
    await page.getByRole('button',{name:'Tampak depan',exact:true}).click()
    await expect(host).toHaveAttribute('data-moving','false')
    expect((await canvas.screenshot()).equals(front)).toBe(false)
    await page.screenshot({path:`qa/verified-3d-${device}.png`})
    const artwork=await wallpaperSvg(page)
    await page.getByRole('button',{name:'Komposisi',exact:true}).click()
    expect(await wallpaperSvg(page)).toBe(artwork)
  })
}

test('an existing custom composition is preserved until the user chooses a native 3D screen',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?m=parang&s=4821&v=desktop&x=1179&y=2556')
  await expect(page.getByRole('button',{name:'Komposisi',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page).toHaveURL(/x=1179&y=2556/)
  await page.getByRole('button',{name:'Perangkat 3D',exact:true}).click()
  await expect(page).toHaveURL(/x=2880&y=5120/)
  await expect(page.getByTestId('device-3d')).toHaveAttribute('data-ready','true')
  await page.getByRole('radio',{name:'HP',exact:true}).click()
  await expect(page).toHaveURL(/x=1320&y=2868/)
  await expect(page.getByTestId('device-3d')).toHaveAttribute('data-texture-size','1320x2868')
  await page.getByRole('button',{name:'Gunakan ukuran layar ini',exact:true}).click()
  await expect(page.getByRole('button',{name:'Komposisi',exact:true})).toHaveAttribute('aria-pressed','true')
})

test('a failed model load falls back to usable composition and PNG export',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  for (const failure of ['unavailable','corrupted']) {
    await page.route('**/device-resources/*.kwp',async route=>{
      if(failure==='unavailable')return route.abort()
      const response=await route.fetch(),body=await response.body()
      body[32]^=1
      return route.fulfill({response,body})
    })
    await page.goto('/?m=kawung&s=4821&v=hp&x=1320&y=2868')
    await expect(page.getByRole('status').filter({hasText:'3D belum tersedia'})).toBeVisible()
    await expect(page.getByTestId('wallpaper')).toBeVisible()
    await Promise.all([page.waitForEvent('download'),page.getByTestId('download-hp').click()])
    await page.unroute('**/device-resources/*.kwp')
  }
})

test('a failed 3D code download preserves the editor',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.route('**/assets/DeviceModel-*.js',route=>route.abort())
  await page.goto('/?m=kawung&s=4821&v=hp&x=1320&y=2868')
  await expect(page.getByRole('status').filter({hasText:'3D belum tersedia'})).toBeVisible()
  await expect(page.getByTestId('wallpaper')).toBeVisible()
  await page.getByLabel('Dim · gelap ke terang',{exact:true}).fill('-40')
  await expect(page).toHaveURL(/dim=-40/)
})
