import { test } from '@playwright/test'
import { DEFAULTS } from '../src/lib/params'
import { sceneToSvg } from '../src/lib/render'
import { buildScene } from '../src/lib/scene'

// npm run og: draws public/og.jpg with the app's own renderer.
test('make og image @og', async ({ page }) => {
  const svg = sceneToSvg(buildScene({ ...DEFAULTS, m: 'kawung', p: 'sogan', s: 4821, d: 4 }, { w: 1905, h: 1000 }))
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(`<style>
    body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Georgia,serif}
    .bg{position:absolute;inset:0}.bg svg{width:100%;height:100%;display:block}
    .card{position:absolute;left:64px;bottom:64px;background:#f2eee6;color:#2b2118;padding:34px 44px 30px;border-radius:22px}
    h1{margin:0;font-size:84px;font-weight:400;line-height:1}
    p{margin:12px 0 0;font:500 25px -apple-system,Segoe UI,sans-serif;color:#62544a}
  </style><div class="bg">${svg}</div><div class="card"><h1>Kawung</h1><p>Wallpaper batik geometris, digambar dari kode</p></div>`)
  await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 84 })
})
