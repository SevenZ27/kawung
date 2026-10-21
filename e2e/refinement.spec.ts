import { expect, test } from '@playwright/test'
import { wallpaperSvg, pickRadio } from './helpers'

for (const reduced of [false, true]) {
  test(`front composition preserves native proportions and interrupts motion safely (reduced=${reduced})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/?m=tambal&s=4821&g=3&v=hp&x=1320&y=2868')
    await page.getByRole('button', { name: 'Komposisi', exact: true }).click()
    const surface = page.locator('.preview-surface')
    await expect(surface).toHaveAttribute('data-preview-view', 'composition')
    const original = await wallpaperSvg(page)
    await expect(page.getByRole('button', { name: 'Jam', exact: true })).toHaveCount(0)
    await expect(page.locator('.lock-clock')).toBeVisible()
    await page.getByRole('radio', { name: 'Desktop', exact: true }).click()
    await expect(page).toHaveURL(/x=2880&y=5120/)
    await expect(surface).toHaveAttribute('data-preview-device', 'desktop')
    await expect.poll(async () => {
      const b = await page.locator('.lock-screen').boundingBox()
      return Math.abs(b!.width / b!.height - 16 / 9)
    }).toBeLessThan(.002)
    await expect(page.locator('.desk-clock')).toBeVisible()
    const frame = await page.locator('.composition-artboard').evaluate(el => ({ shadow: getComputedStyle(el).boxShadow, transform: getComputedStyle(el).transform }))
    expect(frame).toEqual({ shadow: 'none', transform: 'none' })
    const foot = await page.locator('.front-foot').boundingBox()
    expect(foot!.y + foot!.height).toBeLessThan(900)
    // Interrupt both direction and mode changes within the exit interval.
    await page.evaluate(async () => {
      const device = (v: string) => (document.querySelector(`[data-device="${v}"]`) as HTMLButtonElement).click()
      device('hp'); await new Promise(r => setTimeout(r, 35)); device('desktop')
      await new Promise(r => setTimeout(r, 35)); device('hp')
    })
    await expect(surface).toHaveAttribute('data-preview-device', 'hp')
    await expect(surface).toHaveAttribute('data-leaving', 'false')
    await expect.poll(() => wallpaperSvg(page)).toBe(original)
    await page.getByRole('button', { name: 'Perangkat 3D', exact: true }).click()
    await page.getByRole('button', { name: 'Komposisi', exact: true }).click()
    await expect(surface).toHaveAttribute('data-preview-view', 'composition')
    await expect.poll(() => surface.evaluate(el => getComputedStyle(el).opacity)).toBe('1')
    await expect(page.locator('.lock-clock')).toBeVisible()
    if (reduced) expect(await surface.evaluate(el => parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThan(.001)
  })
}

test('rapid motif changes settle on the final artwork without stale fade layers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?m=nitik&s=4821&g=3&v=hp&x=360&y=780')
  for (const name of ['Megamendung', 'Tambal', 'Nitik', 'Tambal']) {
    await pickRadio(page, name)
  }
  await expect(page).toHaveURL(/m=tambal/)
  await expect(page.locator('.wallpaper-leaving')).toHaveCount(0)
  const svg = await wallpaperSvg(page)
  await page.reload()
  expect(await wallpaperSvg(page)).toBe(svg)
  await expect(page.locator('.lock-clock')).toBeVisible()
})
