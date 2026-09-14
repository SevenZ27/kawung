import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
