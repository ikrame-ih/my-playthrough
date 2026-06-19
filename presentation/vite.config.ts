import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/MyPlaythrough/defense/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
