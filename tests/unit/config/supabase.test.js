import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key) => ({ url, key, _type: 'supabase' }))
}))

describe('src/config/supabase', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('initializes the client when environment variables are valid', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://real.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'ey-real-key')

    const { supabase, isSupabaseConfigured } = await import('@/config/supabase.js')

    expect(isSupabaseConfigured()).toBe(true)
    expect(supabase).toEqual({
      url: 'https://real.supabase.co',
      key: 'ey-real-key',
      _type: 'supabase'
    })
  })

  it('exports null when the URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'ey-real-key')

    const { supabase, isSupabaseConfigured } = await import('@/config/supabase.js')

    expect(isSupabaseConfigured()).toBe(false)
    expect(supabase).toBeNull()
  })

  it('exports null when the anon key is a your_ placeholder', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://real.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'your_anon_key')

    const { supabase, isSupabaseConfigured } = await import('@/config/supabase.js')

    expect(isSupabaseConfigured()).toBe(false)
    expect(supabase).toBeNull()
  })

  it('exports null when the URL is a test- placeholder', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'test-project-url')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'ey-real-key')

    const { supabase, isSupabaseConfigured } = await import('@/config/supabase.js')

    expect(isSupabaseConfigured()).toBe(false)
    expect(supabase).toBeNull()
  })
})
