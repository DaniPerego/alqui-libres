// Playwright config for the read-only production smoke suite.
//
// There is no local database (DATABASE_URL only exists inside Vercel
// functions), so the smoke runs against the real deployment using the demo
// accounts. Every flow below is read-only apart from logging in.
import { defineConfig } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://alqui-libres.vercel.app'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    // The PWA service worker can serve a stale shell and mask real failures.
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    locale: 'es-AR',
  },
})
