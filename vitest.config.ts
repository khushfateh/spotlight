import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment for pure service/logic tests (no DOM)
    environment: 'node',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    // Per-file environment overrides use: // @vitest-environment jsdom
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
