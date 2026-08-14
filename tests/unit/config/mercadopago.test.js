import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('mercadopago config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the public key from VITE_MP_PUBLIC_KEY', async () => {
    vi.stubEnv('VITE_MP_PUBLIC_KEY', 'pk_test_abc123')

    const { MP_CONFIG } = await import('@/config/mercadopago.js')

    expect(MP_CONFIG.publicKey).toBe('pk_test_abc123')
  })

  it('never exposes the access token (server-only, MP_ACCESS_TOKEN)', async () => {
    vi.stubEnv('VITE_MP_PUBLIC_KEY', 'pk_test_abc123')
    // A malicious/legacy VITE var must not surface in the config.
    vi.stubEnv('VITE_MP_ACCESS_TOKEN', 'APP_TEST_TOKEN')

    const { MP_CONFIG } = await import('@/config/mercadopago.js')

    expect(MP_CONFIG.accessToken).toBeUndefined()
    expect(JSON.stringify(MP_CONFIG)).not.toContain('APP_TEST_TOKEN')
  })

  it('falls back to demo mode when the public key is missing', async () => {
    vi.stubEnv('VITE_MP_PUBLIC_KEY', '')
    vi.stubEnv('VITE_MP_ACCESS_TOKEN', '')

    const { MP_CONFIG } = await import('@/config/mercadopago.js')

    expect(MP_CONFIG.isDemo).toBe(true)
    expect(MP_CONFIG.publicKey).toBe('')
  })
})
