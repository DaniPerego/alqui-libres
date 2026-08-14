// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { mockGuestUser, mockOwnerUser, mockAdminUser } from '@/data/mockData'

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => false),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/config/supabase', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      signOut: mocks.signOut,
      getSession: mocks.getSession,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser
    }
  }
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch
}))

const MOCK_CREDENTIALS_KEY = 'mockCredentials'

function getMockCredentials() {
  try {
    const raw = localStorage.getItem(MOCK_CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMockCredentials(creds) {
  localStorage.setItem(MOCK_CREDENTIALS_KEY, JSON.stringify(creds))
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  localStorage.clear()
  mocks.isSupabaseConfigured.mockReturnValue(false)
})

describe('auth store (demo mode)', () => {
  it('logs in with hardcoded owner credentials', async () => {
    const store = useAuthStore()

    const result = await store.login('usuario@alquilibres.com', 'user123')

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('owner001')
    expect(store.user.email).toBe('usuario@alquilibres.com')
    expect(store.user.role).toBe('owner')
    expect(store.user.displayName).toBe('Propietario Demo')
  })

  it('logs in with hardcoded guest and admin credentials', async () => {
    const guestStore = useAuthStore()
    const guestResult = await guestStore.login('huesped@alquilibres.com', 'guest123')
    expect(guestResult.success).toBe(true)
    expect(guestStore.user.role).toBe('guest')

    const adminStore = useAuthStore()
    const adminResult = await adminStore.login('admin@alquilibres.com', 'admin123')
    expect(adminResult.success).toBe(true)
    expect(adminStore.user.role).toBe('admin')
  })

  it('logs in with dynamic mock credentials stored in localStorage', async () => {
    saveMockCredentials({
      'dyna@example.com': {
        password: 'dyna123',
        uid: 'dyna001',
        displayName: 'Dynamic User',
        role: 'owner',
        subscription: null
      }
    })
    const store = useAuthStore()

    const result = await store.login('dyna@example.com', 'dyna123')

    expect(result.success).toBe(true)
    expect(store.userId).toBe('dyna001')
    expect(store.user.displayName).toBe('Dynamic User')
  })

  it('sets mustChangePassword when dynamic credentials require it', async () => {
    saveMockCredentials({
      'force@example.com': {
        password: 'force123',
        uid: 'force001',
        displayName: 'Force User',
        role: 'owner',
        mustChangePassword: true
      }
    })
    const store = useAuthStore()

    await store.login('force@example.com', 'force123')

    expect(store.mustChangePassword).toBe(true)
  })

  it('returns translated error for invalid demo credentials', async () => {
    const store = useAuthStore()

    const result = await store.login('no@example.com', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Modo Demo: Email o contraseña incorrectos')
    expect(store.isAuthenticated).toBe(false)
  })

  it('restores session from localStorage on checkAuth', async () => {
    localStorage.setItem('mockUser', JSON.stringify(mockOwnerUser))
    const store = useAuthStore()

    const user = await store.checkAuth()

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('owner001')
    expect(user.email).toBe('usuario@alquilibres.com')
    expect(store.initialized).toBe(true)
  })

  it('persists demo user to localStorage and restores it after refresh', async () => {
    const store = useAuthStore()
    await store.login('usuario@alquilibres.com', 'user123')

    const raw = localStorage.getItem('mockUser')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw).uid).toBe('owner001')

    const restored = useAuthStore()
    await restored.checkAuth()
    expect(restored.userId).toBe('owner001')
  })

  it('logs out and clears demo state', async () => {
    const store = useAuthStore()
    await store.login('usuario@alquilibres.com', 'user123')

    const result = await store.logout()

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(localStorage.getItem('mockUser')).toBeNull()
  })

  it('registers a demo user and authenticates them', async () => {
    const store = useAuthStore()

    const result = await store.register('new@example.com', 'newpass', 'New User')

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user.email).toBe('new@example.com')
    expect(store.user.displayName).toBe('New User')
    expect(store.user.role).toBe('owner')

    const creds = getMockCredentials()
    expect(creds['new@example.com'].password).toBe('newpass')
    expect(creds['new@example.com'].mustChangePassword).toBe(true)
  })

  it('resets demo password to a temporary one', async () => {
    saveMockCredentials({
      'reset@example.com': {
        password: 'oldpass',
        uid: 'reset001',
        displayName: 'Reset User',
        role: 'owner'
      }
    })
    const store = useAuthStore()

    const result = await store.resetPassword('reset@example.com')

    expect(result.success).toBe(true)
    expect(result.message).toContain('temporal123')
    const creds = getMockCredentials()
    expect(creds['reset@example.com'].password).toBe('temporal123')
    expect(creds['reset@example.com'].mustChangePassword).toBe(true)
  })

  it('updates profile in demo mode and persists to localStorage', async () => {
    const store = useAuthStore()
    await store.login('usuario@alquilibres.com', 'user123')

    const result = await store.updateProfile({ displayName: 'Updated Name' })

    expect(result.success).toBe(true)
    expect(store.user.displayName).toBe('Updated Name')
    expect(JSON.parse(localStorage.getItem('mockUser')).displayName).toBe('Updated Name')
  })

  it('changes password in demo mode', async () => {
    saveMockCredentials({
      'change@example.com': {
        password: 'oldpass',
        uid: 'change001',
        displayName: 'Change User',
        role: 'owner',
        mustChangePassword: true
      }
    })
    const store = useAuthStore()
    await store.login('change@example.com', 'oldpass')

    const result = await store.changePassword('newpass')

    expect(result.success).toBe(true)
    expect(store.mustChangePassword).toBe(false)
    expect(getMockCredentials()['change@example.com'].password).toBe('newpass')
  })
})

describe('auth store (Supabase mode)', () => {
  const mockSession = {
    access_token: 'sb-access-token',
    user: {
      id: 'sb-user-1',
      email: 'supa@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { displayName: 'Supa User' }
    }
  }

  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true)
  })

  it('logs in with Supabase and fetches the platform profile', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'sb-user-1',
        email: 'supa@example.com',
        displayName: 'Platform Name',
        role: 'owner',
        subscription: { planId: 'basic', status: 'active' }
      }
    })
    const store = useAuthStore()

    const result = await store.login('supa@example.com', 'supapass')

    expect(result.success).toBe(true)
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'supa@example.com',
      password: 'supapass'
    })
    expect(mocks.apiGet).toHaveBeenCalledWith('/users/me')
    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('sb-user-1')
    expect(store.user.uid).toBe('sb-user-1')
    expect(store.user.email).toBe('supa@example.com')
    expect(store.user.displayName).toBe('Platform Name')
    expect(store.user.role).toBe('owner')
    expect(store.user.subscription.planId).toBe('basic')
    expect(store.sessionToken).toBe('sb-access-token')
  })

  it('falls back to Supabase metadata when platform profile fetch fails', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No profile' }
    })
    const store = useAuthStore()

    await store.login('supa@example.com', 'supapass')

    expect(store.user.displayName).toBe('Supa User')
    expect(store.user.role).toBe('owner')
    expect(store.user.emailVerified).toBe(true)
  })

  it('returns translated error on Supabase login failure', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' }
    })
    const store = useAuthStore()

    const result = await store.login('supa@example.com', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Credenciales inválidas')
    expect(store.isAuthenticated).toBe(false)
  })

  it('restores Supabase session on checkAuth', async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { id: 'sb-user-1', role: 'admin' }
    })
    const store = useAuthStore()

    await store.checkAuth()

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('sb-user-1')
    expect(store.user.role).toBe('admin')
    expect(store.sessionToken).toBe('sb-access-token')
    expect(store.initialized).toBe(true)
  })

  it('remains unauthenticated when Supabase has no session', async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    })
    const store = useAuthStore()

    await store.checkAuth()

    expect(store.isAuthenticated).toBe(false)
    expect(store.initialized).toBe(true)
  })

  it('logs out through Supabase and clears state', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { id: 'sb-user-1', role: 'owner' } })
    const store = useAuthStore()
    await store.login('supa@example.com', 'supapass')

    mocks.signOut.mockResolvedValueOnce({ error: null })
    const result = await store.logout()

    expect(result.success).toBe(true)
    expect(mocks.signOut).toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionToken).toBeNull()
  })

  it('requests Supabase password reset email', async () => {
    mocks.resetPasswordForEmail.mockResolvedValueOnce({ error: null, data: {} })
    const store = useAuthStore()

    const result = await store.resetPassword('supa@example.com')

    expect(result.success).toBe(true)
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('supa@example.com', expect.any(Object))
  })

  it('registers with Supabase and creates a platform user', async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null
    })
    mocks.apiPost.mockResolvedValueOnce({ success: true, data: { id: 'sb-user-1' } })
    const store = useAuthStore()

    const result = await store.register('new@example.com', 'newpass', 'New User')

    expect(result.success).toBe(true)
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'newpass'
    })
    expect(mocks.apiPost).toHaveBeenCalledWith('/users', expect.objectContaining({
      id: 'sb-user-1',
      email: 'new@example.com',
      displayName: 'New User',
      role: 'owner'
    }))
    expect(store.isAuthenticated).toBe(true)
  })

  it('updates Supabase user metadata and platform profile', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { id: 'sb-user-1', role: 'owner' } })
    const store = useAuthStore()
    await store.login('supa@example.com', 'supapass')

    mocks.updateUser.mockResolvedValueOnce({ error: null, data: { user: mockSession.user } })
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { displayName: 'Updated' } })

    const result = await store.updateProfile({ displayName: 'Updated' })

    expect(result.success).toBe(true)
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { displayName: 'Updated' } })
    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/me', { displayName: 'Updated' })
    expect(store.user.displayName).toBe('Updated')
  })

  it('changes Supabase password', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { id: 'sb-user-1', role: 'owner' } })
    const store = useAuthStore()
    await store.login('supa@example.com', 'supapass')

    mocks.updateUser.mockResolvedValueOnce({ error: null })

    const result = await store.changePassword('newpass')

    expect(result.success).toBe(true)
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'newpass' })
  })
})

describe('auth store token exposure', () => {
  it('exposes a getSessionToken helper for the API client', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true)
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'api-token',
          user: { id: 'tok-1', email: 'tok@example.com' }
        }
      },
      error: null
    })
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { id: 'tok-1', role: 'owner' } })
    const store = useAuthStore()
    await store.login('tok@example.com', 'tokpass')

    expect(store.getSessionToken()).toBe('api-token')
  })
})
