import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { openSheetIfMobile, pickRadio, pngSize, wallpaperSvg } from './helpers'

test('shared output survives a different screen and an orientation change', async ({ browser }) => {
  const phone = await browser.newContext({ viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const a = await phone.newPage()
  await a.goto('/?m=parang&s=4821')
  await expect(a).toHaveURL(/x=1179&y=2556/)
  const link = a.url(), svg = await wallpaperSvg(a)
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const p = await desk.newPage(); await p.goto(link)
  expect(await wallpaperSvg(p)).toBe(svg)
  const [d] = await Promise.all([p.waitForEvent('download'), p.getByTestId('download-hp').click()])
  expect(pngSize((await d.path())!)).toEqual({ width: 1179, height: 2556 })
  await a.setViewportSize({ width: 852, height: 393 })
  expect(a.url()).toBe(link)
  expect(await wallpaperSvg(a)).toBe(svg)
  await p.getByRole('button', { name: 'Gunakan ukuran layar ini' }).click()
  await expect(p).toHaveURL(/x=1800&y=2880/)
  await phone.close(); await desk.close()
})

for (const motif of ['kawung', 'parang', 'truntum', 'ceplok', 'nitik', 'jlamprang', 'megamendung', 'tambal', 'gringsing', 'semen']) {
  test(`${motif}: preview artwork and both PNG orientations share the same composition`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/?m=${motif}&s=4821&p=nila&d=7&w=6&r=33&dim=-35&g=3&x=360&y=780`)
    for (const device of ['hp', 'desktop']) {
      await page.getByRole('radio', { name: device === 'hp' ? 'HP' : 'Desktop', exact: true }).click()
      const width = device === 'hp' ? 360 : 780, height = device === 'hp' ? 780 : 360
      await expect.poll(async () => page.getByTestId('wallpaper').locator('svg').getAttribute('viewBox')).toBe(`0 0 ${device === 'hp' ? '1000 2166.67' : '2166.67 1000'}`)
      const box = await page.locator('.lock-screen').boundingBox()
      expect(Math.abs(box!.width / box!.height - width / height)).toBeLessThan(.002)
      const svg = await wallpaperSvg(page)
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(`download-${device}`).click()])
      const path = (await download.path())!
      expect(pngSize(path)).toEqual({ width, height })
      const png = `data:image/png;base64,${readFileSync(path).toString('base64')}`
      const delta = await page.evaluate(async ({ svg, png, width, height }) => {
        async function pixels(src: string) {
          const img = new Image(); img.src = src; await img.decode()
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0, width, height)
          return ctx.getImageData(0, 0, width, height).data
        }
        const rendered = svg.replace('<svg ', `<svg width="${width}" height="${height}" `)
        const url = URL.createObjectURL(new Blob([rendered], { type: 'image/svg+xml' }))
        try {
          const a = await pixels(url), b = await pixels(png); let error = 0, different = 0
          for (let i = 0; i < a.length; i += 4) {
            let max = 0
            for (let k = 0; k < 3; k++) { const d = Math.abs(a[i + k] - b[i + k]); error += d; max = Math.max(max, d) }
            if (max > 24) different++
          }
          return { meanChannelError: error / (width * height * 3), visiblyDifferentFraction: different / (width * height) }
        } finally { URL.revokeObjectURL(url) }
      }, { svg, png, width, height })
      expect(delta.meanChannelError).toBeLessThan(2)
      expect(delta.visiblyDifferentFraction).toBeLessThan(.02)
    }
  })
}

test('mobile modal contains focus, closes with Escape and restores its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/?s=4821')
  const trigger = page.getByRole('button', { name: 'Atur wallpaper', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Pengaturan wallpaper' })
  await expect(dialog).toBeVisible(); await expect(page.locator('main')).toHaveAttribute('inert', '')
  const close = dialog.getByRole('button', { name: 'Tutup pengaturan', exact: true })
  await expect(close).toBeFocused(); await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Salin', exact: true })).toBeFocused()
  await page.keyboard.press('Tab'); await expect(close).toBeFocused()
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused(); await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  await trigger.click()
  await page.getByTestId('settings-backdrop').click({ position: { x: 10, y: 10 } })
  await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
  await expect(page.getByText('Yang digambar di sini', { exact: false })).toBeHidden()
})

test('tablet labels stay visible and landscape keeps a usable preview', async ({ browser }) => {
  for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [812, 375], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, screen: { width, height } })
    const page = await ctx.newPage(); await page.goto('/?s=4821')
    await page.getByTestId('wallpaper').waitFor()
    for (const name of ['Kawung', 'Parang', 'Truntum', 'Ceplok']) {
      const label = page.locator('label', { has: page.getByRole('radio', { name, exact: true }) })
      if(width<700&&height<=650){await expect(label).toBeHidden();continue}
      const box = await label.boundingBox(); expect(box!.y + box!.height).toBeLessThanOrEqual(height)
    }
    const figure = await page.locator('figure').boundingBox()
    expect(figure!.height).toBeGreaterThan(120)
    const overflow = await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))
    expect(overflow).toEqual({ x: 0, y: 0 })
    await openSheetIfMobile(page)
    await page.getByTestId('download-hp').scrollIntoViewIfNeeded(); await expect(page.getByTestId('download-hp')).toBeInViewport()
    await ctx.close()
  }
})

test('clipboard denied reports failure and leaves a selectable URL', async ({ page }) => {
  await page.goto('/?s=4821'); await openSheetIfMobile(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('denied') } } })
    document.execCommand = () => false
  })
  await page.getByRole('button', { name: 'Salin', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Belum tersalin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tersalin', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Link berbagi')).toBeFocused()
  expect(await page.getByLabel('Link berbagi').evaluate((e: HTMLInputElement) => e.selectionEnd! - e.selectionStart!)).toBeGreaterThan(0)
})

test('clipboard success is verified, and stale success clears after settings change', async ({ page }) => {
  await page.goto('/?s=4821'); await openSheetIfMobile(page)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }))
  await page.getByRole('button', { name: 'Salin', exact: true }).click(); await expect(page.getByRole('button', { name: 'Tersalin', exact: true })).toBeVisible()
  await pickRadio(page, 'Parang'); await expect(page.getByRole('button', { name: 'Tersalin', exact: true })).toHaveCount(0)
})

test('legacy clipboard fallback only reports success when the browser accepts it', async ({ page }) => {
  await page.goto('/?s=4821'); await openSheetIfMobile(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('denied') } } })
    document.execCommand = () => true
  })
  await page.getByRole('button', { name: 'Salin', exact: true }).click(); await expect(page.getByRole('button', { name: 'Tersalin', exact: true })).toBeVisible()
})

test('a pending clipboard request cannot announce success for a newer link', async ({ page }) => {
  await page.goto('/?s=4821'); await openSheetIfMobile(page)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { (window as any).finishCopy = resolve }) } }))
  await page.getByRole('button', { name: 'Salin', exact: true }).click()
  await pickRadio(page, 'Parang'); await page.evaluate(() => (window as any).finishCopy())
  await expect(page.getByRole('button', { name: 'Tersalin', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Salin', exact: true })).toBeEnabled()
})

test('failed PNG export reports an error and can be retried', async ({ page }) => {
  await page.goto('/?s=4821'); await openSheetIfMobile(page)
  await page.evaluate(() => { (window as any).originalToBlob = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = (callback) => callback(null) })
  await page.getByTestId('download-hp').click(); await expect(page.getByRole('alert')).toHaveText('Gagal membuat PNG')
  await expect(page.getByTestId('download-hp')).toBeEnabled()
  await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = (window as any).originalToBlob })
  await Promise.all([page.waitForEvent('download'), page.getByTestId('download-hp').click()]); await expect(page.getByRole('alert')).toHaveCount(0)
})
