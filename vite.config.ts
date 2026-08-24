import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Must match the backend's app.frontend.url (default http://localhost:5174) for CORS.
    port: 5174,
    strictPort: true,
    // Proxy API calls to the Spring Boot backend during local dev.
    proxy: {
      '/api': 'http://localhost:9091',
    },
  },
})
