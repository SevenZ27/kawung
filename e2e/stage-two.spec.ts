import { expect, test } from '@playwright/test'
import { openSheetIfMobile, pickRadio, pngSize, wallpaperSvg } from './helpers'

test('Dim changes the shared artwork in both directions and restores the original', async ({ page, context }) => {
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?m=megamendung&s=137&g=2&x=360&y=780')
  const original=await wallpaperSvg(page),slider=page.getByLabel('Dim · gelap ke terang',{exact:true})
  await slider.fill('-80');await expect(page).toHaveURL(/dim=-80/)
  const dark=await wallpaperSvg(page);expect(dark).not.toBe(original)
  await expect(page.getByRole('status').filter({hasText:'Estimasi kontras'})).toContainText('0% area di bawah')
  const shared=await context.newPage();await shared.goto(page.url());expect(await wallpaperSvg(shared)).toBe(dark);await shared.close()
  await slider.fill('80');await expect(page).toHaveURL(/dim=80/)
  const light=await wallpaperSvg(page);expect(light).not.toBe(dark)
  await expect(page.getByRole('status').filter({hasText:'Estimasi kontras'})).toContainText('0% area di bawah')
  const backgrounds=await page.evaluate(({dark,light})=>{
    const parser=new DOMParser()
    return [dark,light].map(svg=>parser.parseFromString(svg,'image/svg+xml').querySelector('rect')!.getAttribute('fill'))
  },{dark,light})
  expect(backgrounds[0]).not.toBe(backgrounds[1])
  await page.getByRole('button',{name:'Kembalikan warna asli'}).click()
  await expect.poll(()=>wallpaperSvg(page)).toBe(original)
  await expect(page.locator('a[href]')).toHaveCount(0)
})

test('device resolution presets export actual iPhone pixels and Studio Display 5K',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/?m=nitik&s=90523&g=2')
  await page.getByRole('button',{name:'Komposisi',exact:true}).click()
  for(const [preset,device,width,height] of [['iphone','hp',1320,2868],['studio','desktop',5120,2880]] as const){
    await page.getByLabel('Ukuran wallpaper',{exact:true}).selectOption(preset)
    await expect(page.getByRole('radio',{name:device==='hp'?'HP':'Desktop',exact:true})).toHaveAttribute('aria-checked','true')
    await expect.poll(async()=>{const box=await page.locator('.lock-screen').boundingBox();return Math.abs(box!.width/box!.height-width/height)}).toBeLessThan(.002)
    const [file]=await Promise.all([page.waitForEvent('download'),page.getByTestId(`download-${device}`).click()])
    expect(pngSize((await file.path())!)).toEqual({width,height})
  }
})

test('all ten motifs remain selectable on a narrow touch layout',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/?s=4821')
  await openSheetIfMobile(page)
  const names=['Kawung','Parang','Truntum','Ceplok','Nitik','Jlamprang','Megamendung','Tambal','Gringsing','Semen']
  for(const name of names){
    await pickRadio(page,name);await expect(page.getByRole('radio',{name,exact:true})).toBeChecked()
    expect(await wallpaperSvg(page)).toContain('<path')
  }
  await page.keyboard.press('Escape')
  await expect(page.locator('#selected-style')).toContainText('Semen')
  const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
  expect(over).toBe(false)
})
