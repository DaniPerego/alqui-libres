import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Extends the Vite alias (`@` -> ./src) so tests can import store/service
// modules the same way the app does. Default environment is `node` for
// pure-helper tests (api/lib, seed); store/component tests run in `jsdom`.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/stores/**', 'jsdom']],
    setupFiles: ['tests/setup.js'],
    include: ['tests/**/*.test.js'],
    // Keep `npm run test` green on work-unit commits that land before the
    // first test file exists (WU1 infra/schema commits).
    passWithNoTests: true
  }
})
