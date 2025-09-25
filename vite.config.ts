import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/expense_tracker_app_test1/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
    open: true,
  },
})
