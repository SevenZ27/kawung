import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { deviceAssets } from './scripts/device-assets-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), deviceAssets()],
  server: { port: 4185, strictPort: true },
  preview: { port: 4186, strictPort: true },
})
