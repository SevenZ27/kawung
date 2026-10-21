import { expect, test } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { collectErrors } from './helpers'

const MOTIFS = ['kawung', 'parang', 'truntum', 'ceplok']
const PALETTES = ['sogan', 'nila', 'gading']
const SHOTS = 'qa/readability'

// 4 motifs x 3 palettes on the lock screen, with the clock contrast the app reports.
test('lock screen readability matrix', async ({ browser }) => {
  mkdirSync(SHOTS, { recursive: true })
  test.setTimeout(180_000)
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    screen: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const errors = collectErrors(page)
  const rows: Array<{ m: string; p: string; ratio: number; tone: string; file: string }> = []

  for (const m of MOTIFS) {
    for (const p of PALETTES) {
      await page.goto(`/?m=${m}&s=4821&p=${p}&d=5&w=4&r=0&v=hp`)
      const status = page.getByRole('status').filter({ hasText: 'kontras' })
      await expect(status).toBeVisible()
      await page.waitForTimeout(400)
      const text = (await status.textContent()) ?? ''
      const ratio = Number(text.match(/area jam ([\d,]+):1/)?.[1].replace(',', '.'))
      const tone = await page.locator('.lock-light, .lock-dark').first().getAttribute('class')
      const file = `lock-${m}-${p}.jpg`
      await page.locator('figure').screenshot({ path: `${SHOTS}/${file}`, quality: 82, type: 'jpeg' })
      rows.push({ m, p, ratio, tone: tone?.includes('lock-light') ? 'light' : 'dark', file })
      expect(ratio).toBeGreaterThanOrEqual(1)
      expect(ratio).toBeLessThanOrEqual(21)
    }
  }
  expect(errors).toEqual([])

  const lines = [
    '# Clock readability, 4 motifs x 3 palettes',
    '',
    'Written by `e2e/matrix.spec.ts` (seed 4821, density 5, weight 4, rotation 0, phone 393 x 852).',
    'Ratio is the P10 regional contrast proxy between the clock colour and the wallpaper pixels behind the date and clock, as reported in the app.',
    '',
    '| Motif | Palette | Clock tone | P10 contrast | Screenshot |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.m} | ${r.p} | ${r.tone} | ${r.ratio.toFixed(1)}:1 | [${r.file}](screenshots/${r.file}) |`),
    '',
  ]
  writeFileSync(`${SHOTS}/readability.md`, lines.join('\n'))

  const cells = rows
    .map((r) => {
      const b64 = readFileSync(`${SHOTS}/${r.file}`).toString('base64')
      return `<figure><img src="data:image/jpeg;base64,${b64}"><figcaption>${r.m} / ${r.p} / ${r.ratio.toFixed(1)}:1</figcaption></figure>`
    })
    .join('')
  const sheet = await context.newPage()
  await sheet.setViewportSize({ width: 1180, height: 800 })
  await sheet.setContent(
    `<style>body{margin:0;padding:24px;background:#f2eee6;font:13px -apple-system,Segoe UI,sans-serif;color:#2b2118}
    main{display:grid;grid-template-columns:repeat(6,1fr);gap:18px 14px}figure{margin:0}img{width:100%;display:block}
    figcaption{margin-top:6px;text-align:center}</style><main>${cells}</main>`,
  )
  await sheet.screenshot({ path: `${SHOTS}/lock-matrix.jpg`, fullPage: true, quality: 80, type: 'jpeg' })
  await context.close()
})
