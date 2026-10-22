// e2e/smoke.spec.js
//
// Read-only production smoke. It protects the chain that today's work kept
// touching: router guards, login, and the owner surfaces wired to the real
// API. It never creates, edits or deletes data.
import { test, expect } from '@playwright/test'

const OWNER = {
  email: process.env.E2E_OWNER_EMAIL || 'usuario@alquilibres.com',
  password: process.env.E2E_OWNER_PASSWORD || 'user123',
}

async function login(page, { email, password }) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click()
}

test.describe('smoke (producción, solo lectura)', () => {
  test('el home lista propiedades reales y no muestra banner de error', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.featured, section').first()).toBeVisible()
    // Property links prove the listings came from the API, not from mockData.
    await expect(page.locator('a[href*="/propiedad/"]').first()).toBeVisible()
    await expect(page.locator('.error-banner')).toHaveCount(0)
  })

  test('la búsqueda pública devuelve resultados sin errores', async ({ page }) => {
    await page.goto('/buscar')
    await expect(page.locator('a[href*="/propiedad/"]').first()).toBeVisible()
    await expect(page.locator('.error-banner')).toHaveCount(0)
  })

  test('el propietario entra, ve su panel real y sus superficies', async ({ page }) => {
    await login(page, OWNER)
    await page.waitForURL(/\/panel/)

    // Dashboard: KPIs computed from real data (no hardcoded placeholders).
    const metrics = page.locator('.metric-value')
    await expect(metrics.first()).toBeVisible()
    await expect(page.locator('.error-banner')).toHaveCount(0)

    // Notifications centre: seeded rows are rendered.
    await page.goto('/notificaciones')
    await expect(page.locator('.notifications-page h1')).toBeVisible()
    await expect(page.locator('.notification-card').first()).toBeVisible()

    // Inbox: real threads with the reply affordance.
    await page.goto('/panel/mensajes')
    await expect(page.locator('.message-card').first()).toBeVisible()

    // Reviews: server-side owner responses are visible without localStorage.
    await page.goto('/panel/resenas')
    await expect(page.locator('.review-card').first()).toBeVisible()
    await expect(page.getByText('Muchas gracias María').first()).toBeVisible()
  })
})
