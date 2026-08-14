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
    vi.stubEnv('VITE_MP_ACCESS_TOKEN', 'access_test_xyz')

    const { MP_CONFIG } = await import('@/config/mercadopago.js')

    expect(MP_CONFIG.publicKey).toBe('pk_test_abc123')
    expect(MP_CONFIG.accessToken).toBe('access_test_xyz')
  })

  it('falls back to demo mode when the public key is missing', async () => {
    vi.stubEnv('VITE_MP_PUBLIC_KEY', '')
    vi.stubEnv('VITE_MP_ACCESS_TOKEN', '')

    const { MP_CONFIG } = await import('@/config/mercadopago.js')

    expect(MP_CONFIG.isDemo).toBe(true)
    expect(MP_CONFIG.publicKey).toBe('')
  })
})
