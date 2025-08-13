import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../backend/dist'), // Aquí va el build
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
})
