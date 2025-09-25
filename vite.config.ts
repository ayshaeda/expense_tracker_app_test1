import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist", // output folder for build
  },
  server: {
    port: 3000, // optional for local dev
    open: true,  // opens browser on npm run dev
  },
})
