import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    clearMocks: true,
  },
})
