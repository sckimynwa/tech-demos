import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { motionApi } from './server/plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), motionApi()],
  server: {
    host: true,
    port: 5173,
  },
})
