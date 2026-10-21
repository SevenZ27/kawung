// Application resources, not standalone GLBs. The browser needs the key to render:
// this deters direct file reuse, but is not DRM or an extraction-proof boundary.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto'
import assert from 'node:assert/strict'

await mkdir('.device-assets', { recursive: true })
const manifest = {}, report = []
for (const id of ['iphone', 'studio-display']) {
  const input = await readFile(`qa/assets/no-logo/${id}.glb`)
  const key = randomBytes(32), iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(input), cipher.final(), cipher.getAuthTag()])
  const packaged = Buffer.concat([Buffer.from('KWP1'), iv, encrypted])
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  const name = `${sha(packaged).slice(0, 24)}.kwp`
  const decrypt = payload => {
    const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(4, 16))
    decipher.setAuthTag(payload.subarray(-16))
    return Buffer.concat([decipher.update(payload.subarray(16, -16)), decipher.final()])
  }
  assert.deepEqual(decrypt(packaged), input)
  const corrupt = Buffer.from(packaged); corrupt[32] ^= 1
  assert.throws(() => decrypt(corrupt))
  await writeFile(`.device-assets/${name}`, packaged)
  manifest[id] = { file: name, key: key.toString('base64') }
  report.push({ id, sourceSha256: sha(input), resourceSha256: sha(packaged), bytes: packaged.length, roundTripIdentical: true, tamperRejected: true })
}
await writeFile('.device-assets/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
await writeFile('docs/verification/device-packaging.json', JSON.stringify({ date: '2026-10-21', format: 'KWP1 / AES-256-GCM', models: report }, null, 2) + '\n')
console.log('Packaged both no-logo models; round-trip and tamper checks passed.')
