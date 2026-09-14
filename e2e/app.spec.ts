import { expect, test } from '@playwright/test'
import { PHONE, collectErrors, openSheetIfMobile, pickRadio, pngSize, wallpaperSvg } from './helpers'

const SHOTS = 'docs/screenshots'

test.describe('layout', () => {
  test('375 px: renders without console errors', async ({ browser }) => {
    const context = await browser.newContext({ ...PHONE, viewport: { width: 375, height: 812 }, screen: { width: 375, height: 812 } })
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto('/?m=kawung&s=4821&p=sogan&d=5&w=4&r=0&v=hp')
    await expect(page.getByTestId('wallpaper').locator('svg')).toBeVisible()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${SHOTS}/app-375.png` })
    await openSheetIfMobile(page)
    await page.screenshot({ path: `${SHOTS}/app-375-sheet.png` })
    await page.getByRole('heading', { name: 'Simpan' }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${SHOTS}/app-375-sheet-save.png` })
    expect(errors).toEqual([])
    await context.close()
  })

  test('1440 px: renders without console errors', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto('/?m=parang&s=2207&p=nila&d=5&w=4&r=0&v=hp')
    await expect(page.getByTestId('wallpaper').locator('svg')).toBeVisible()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${SHOTS}/app-1440.png` })
    await page.getByRole('radio', { name: 'Desktop' }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SHOTS}/app-1440-desktop.png` })
    expect(errors).toEqual([])
    await context.close()
  })
})

test('same seed renders the same SVG after a reload', async ({ page }) => {
  await page.goto('/?m=ceplok&s=31337&p=gading')
  const first = await wallpaperSvg(page)
  await page.reload()
  expect(await wallpaperSvg(page)).toBe(first)
})

test('first visit without a seed picks one and writes it to the URL', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/[?&]s=\d+/)
})

test('share link opened in a new tab shows the same wallpaper', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('/?m=kawung&s=10&p=sogan')

  await pickRadio(page, 'Truntum')
  await pickRadio(page, 'Bebas')
  await page.getByLabel('Warna dasar').fill('#2f4f3a')
  await page.getByLabel('Kepadatan').fill('8')
  await page.getByLabel('Ketebalan garis').fill('6')
  await page.getByLabel('Rotasi').fill('30')
  await page.getByRole('button', { name: 'Acak' }).click()
  await page.getByRole('radio', { name: 'Desktop' }).click()
  await page.waitForTimeout(700)

  const link = await page.getByLabel('Link berbagi').inputValue()
  expect(link).toContain('m=truntum')
  expect(link).toContain('p=bebas')
  expect(link).toContain('c=2f4f3a')
  expect(link).toContain('d=8')
  expect(link).toContain('w=6')
  expect(link).toContain('r=30')
  expect(link).toContain('v=desktop')
  expect(page.url()).toBe(link)
  const original = await wallpaperSvg(page)

  const tab = await context.newPage()
  await tab.goto(link)
  await expect(tab.getByTestId('wallpaper').locator('svg')).toBeVisible()
  expect(await wallpaperSvg(tab)).toBe(original)
  expect(await tab.getByLabel('Link berbagi').inputValue()).toBe(link)
  await context.close()
})

test.describe('PNG export size', () => {
  test('phone: 393 x 852 at 3x gives 1179 x 2556', async ({ browser }) => {
    const context = await browser.newContext({ ...PHONE, acceptDownloads: true })
    const page = await context.newPage()
    await page.goto('/?m=kawung&s=4821&p=nila')
    await openSheetIfMobile(page)
    const button = page.getByTestId('download-hp')
    await expect(button).toContainText('1.179 x 2.556 px')
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
    const file = await download.path()
    expect(pngSize(file)).toEqual({ width: 1179, height: 2556 })
    expect(download.suggestedFilename()).toBe('kawung-kawung-4821-1179x2556.png')
    await context.close()
  })

  test('desktop: 1440 x 900 at 2x gives 2880 x 1800 and a 1800 x 2880 phone option', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, screen: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true })
    const page = await context.newPage()
    await page.goto('/?m=parang&s=12&p=gading&v=desktop')
    const [desk] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-desktop').click()])
    expect(pngSize(await desk.path())).toEqual({ width: 2880, height: 1800 })
    const [hp] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-hp').click()])
    expect(pngSize(await hp.path())).toEqual({ width: 1800, height: 2880 })
    await context.close()
  })
})

test('keyboard: motif, palette and sliders work without a mouse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?m=kawung&s=5&p=sogan&d=5')
  await page.getByRole('radio', { name: 'Kawung' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Parang' })).toBeChecked()
  await expect(page).toHaveURL(/m=parang/)
  await page.getByRole('radio', { name: 'Sogan' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/p=nila/)
  await page.getByLabel('Kepadatan').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/d=6/)
  const outline = await page.getByLabel('Kepadatan').evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

test('reduced motion: motif change swaps instantly', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('/?m=kawung&s=5')
  await pickRadio(page, 'Ceplok')
  await expect(page.locator('.wallpaper-leaving')).toHaveCount(0)
  await context.close()
})

test('with motion: motif change fades the old wallpaper out', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?m=kawung&s=5')
  await pickRadio(page, 'Ceplok')
  await expect(page.locator('.wallpaper-leaving')).toHaveCount(1)
  await expect(page.locator('.wallpaper-leaving')).toHaveCount(0, { timeout: 3000 })
})

test('no request leaves the site', async ({ page }) => {
  const outside: string[] = []
  page.on('request', (req) => {
    if (!req.url().startsWith('http://localhost:4174') && !req.url().startsWith('data:') && !req.url().startsWith('blob:')) outside.push(req.url())
  })
  await page.goto('/?m=truntum&s=9')
  await page.waitForLoadState('networkidle')
  await pickRadio(page, 'Parang')
  await page.waitForTimeout(600)
  expect(outside).toEqual([])
})
