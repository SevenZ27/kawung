import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

export const PHONE = {
  viewport: { width: 393, height: 852 },
  screen: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

// Width and height straight from the PNG IHDR chunk.
export function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

export async function wallpaperSvg(page: Page): Promise<string> {
  return page.getByTestId('wallpaper').innerHTML()
}

export async function openSheetIfMobile(page: Page) {
  const handle = page.getByRole('button', { name: /Atur wallpaper/ })
  if (await handle.isVisible()) {
    await handle.click()
    await page.waitForTimeout(500)
  }
}

// Radios are visually hidden inside their label, so click the label like a user would.
export async function pickRadio(page: Page, name: string) {
  await page.locator('label', { has: page.getByRole('radio', { name, exact: true }) }).click()
}
