import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the build work when opened as a local file (file://)
// AND when deployed to the root of any static host.
// Change to '/repo-name/' if deploying to a GitHub Pages sub-path.
export default defineConfig({
  plugins: [react()],
  base: './',
})
