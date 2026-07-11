import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the built site work when opened as a local file
// AND when hosted in a subfolder (GitHub Pages etc.) — no server required.
export default defineConfig({
  plugins: [react()],
  base: './',
})
