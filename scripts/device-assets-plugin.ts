import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

export function deviceAssets(): Plugin {
  const id = 'virtual:kawung-devices', resolvedId = '\0' + id
  const folder = resolve('.device-assets')
  const manifest: Record<string, { file: string; key: string }> = existsSync(resolve(folder, 'manifest.json'))
    ? JSON.parse(readFileSync(resolve(folder, 'manifest.json'), 'utf8')) : {}
  for (const entry of Object.values(manifest)) {
    if (!/^[a-f0-9]{24}\.kwp$/.test(entry.file)) throw new Error('Invalid device resource filename')
  }
  return {
    name: 'kawung-incorporated-device-resources',
    resolveId: source => source === id ? resolvedId : undefined,
    load: source => source === resolvedId ? `export default ${JSON.stringify(manifest)}` : undefined,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const entry = Object.values(manifest).find(item => req.url === `/device-resources/${item.file}`)
        if (!entry) return next()
        res.setHeader('Content-Type', 'application/octet-stream')
        res.end(readFileSync(resolve(folder, entry.file)))
      })
    },
    generateBundle() {
      if ((process.env.REQUIRE_DEVICE_ASSETS === '1' || process.env.VERCEL === '1') && Object.keys(manifest).length !== 2) {
        throw new Error('Release requires both licensed device resources. Run pnpm models:package first.')
      }
      for (const entry of Object.values(manifest)) {
        this.emitFile({ type: 'asset', fileName: `device-resources/${entry.file}`, source: readFileSync(resolve(folder, entry.file)) })
      }
    },
  }
}
