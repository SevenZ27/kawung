import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'

const origin = process.env.QA_ORIGIN || 'https://kawung.vercel.app'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function list(folder, prefix = '') {
  const paths = []
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = prefix + item.name
    if (item.isDirectory()) paths.push(...await list(join(folder, item.name), path + '/'))
    else paths.push(path)
  }
  return paths
}
const files = []
for (const path of await list('dist')) {
  const local = await readFile(join('dist', path))
  const response = await fetch(`${origin}/${path === 'index.html' ? '' : path}`)
  const remote = new Uint8Array(await response.arrayBuffer())
  assert.equal(response.status, 200, path)
  assert.equal(sha(remote), sha(local), `Deployed bytes differ: ${path}`)
  files.push({ path, status: response.status, sha256: sha(remote), identical: true })
}
for (const path of ['models/iphone.glb', 'models/studio-display.glb', '.device-assets/manifest.json']) {
  const response = await fetch(`${origin}/${path}`)
  assert.equal(response.status, 404, `Raw or private resource is available: ${path}`)
  files.push({ path, status: response.status })
}
await writeFile('docs/verification/release-delivery.json', JSON.stringify({
  checkedAt: new Date().toISOString(), url: origin,
  sourceCommit: process.env.RELEASE_SOURCE_COMMIT || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID || null, files,
}, null, 2) + '\n')
console.log(`All ${files.filter(f => f.identical).length} build files match production; raw/private URLs return 404.`)
