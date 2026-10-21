// Prepare a static Vercel Build Output API deployment from the already tested dist.
import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const files = await readdir('dist', { recursive: true, withFileTypes: true })
assert.ok(!files.some(f => f.isFile() && /\.(glb|fbx|usdz)$/i.test(f.name)), 'Raw model in build')
const entries = JSON.parse(await readFile('.device-assets/manifest.json', 'utf8'))
assert.equal(Object.keys(entries).length, 2, 'Both device resources are required')
for (const item of Object.values(entries)) {
  assert.deepEqual(await readFile(`dist/device-resources/${item.file}`), await readFile(`.device-assets/${item.file}`))
}
// Refuse a stale output directory rather than silently retaining old release files.
await mkdir('.vercel/output', { recursive: true })
assert.equal((await readdir('.vercel/output')).length, 0, 'Archive the previous .vercel/output before preparing a new release')
await cp('dist', '.vercel/output/static', { recursive: true })
await writeFile('.vercel/output/config.json', JSON.stringify({ version: 3, routes: [
  { src: '/(?:assets|device-resources)/.*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' }, continue: true },
  { handle: 'filesystem' },
  { src: '/.*', status: 404 },
] }, null, 2) + '\n')
const index = await readFile('dist/index.html')
console.log(JSON.stringify({ indexSha256: createHash('sha256').update(index).digest('hex'), resources: Object.values(entries).map(x => x.file), rawModelsAbsent: true }))
