// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch
}))

const NETWORK_ERROR = {
  success: false,
  error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
}

function getMockCredentials() {
  try {
    const raw = localStorage.getItem('mockCredentials')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMockCredentials(creds) {
  localStorage.setItem('mockCredentials', JSON.stringify(creds))
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  localStorage.clear()
  mocks.apiGet.mockResolvedValue(NETWORK_ERROR)
  mocks.apiPost.mockResolvedValue(NETWORK_ERROR)
  mocks.apiPatch.mockResolvedValue(NETWORK_ERROR)
})

describe('auth store — native API', () => {
  it('logs in through /auth/login and stores the JWT', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'jwt-123',
        user: {
          id: 'u-1',
          email: 'usuario@alquilibres.com',
          displayName: 'Propietario Demo',
          role: 'owner',
          emailVerified: true,
          subscription: null
        }
      }
    })
    const store = useAuthStore()

    const result = await store.login('usuario@alquilibres.com', 'user123')

    expect(mocks.apiPost).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'usuario@alquilibres.com', password: 'user123' },
      { public: true }
    )
    expect(result.success).toBe(true)
    expect(store.sessionToken).toBe('jwt-123')
    expect(localStorage.getItem('alqui_libres_token')).toBe('jwt-123')
    expect(store.user.uid).toBe('u-1')
    expect(store.user.role).toBe('owner')
    expect(store.user.displayName).toBe('Propietario Demo')
  })

  it('returns a translated error on invalid credentials without demo fallback', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' }
    })
    const store = useAuthStore()

    const result = await store.login('usuario@alquilibres.com', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Email o contraseña incorrectos')
    expect(store.isAuthenticated).toBe(false)
  })

  it('restores the session via /auth/me on checkAuth', async () => {
    localStorage.setItem('alqui_libres_token', 'jwt-abc')
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { id: 'u-1', email: 'u@example.com', displayName: 'U', role: 'owner', emailVerified: true }
    })
    const store = useAuthStore()

    await store.checkAuth()

    expect(mocks.apiGet).toHaveBeenCalledWith('/auth/me')
    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('u-1')
    expect(store.sessionToken).toBe('jwt-abc')
    expect(store.initialized).toBe(true)
  })

  it('clears the session when /auth/me rejects the token', async () => {
    localStorage.setItem('alqui_libres_token', 'expired')
    localStorage.setItem('mockUser', JSON.stringify({ uid: 'old', email: 'old@x.com' }))
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    })
    const store = useAuthStore()

    await store.checkAuth()

    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('alqui_libres_token')).toBeNull()
    expect(localStorage.getItem('mockUser')).toBeNull()
  })

  it('keeps the last known user snapshot when the API is unreachable during checkAuth', async () => {
    localStorage.setItem('alqui_libres_token', 'jwt-abc')
    localStorage.setItem('mockUser', JSON.stringify({ uid: 'snap-1', email: 'snap@x.com', role: 'owner' }))
    // default mock: NETWORK_ERROR
    const store = useAuthStore()

    await store.checkAuth()

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('snap-1')
    expect(store.sessionToken).toBe('jwt-abc')
  })

  it('registers through /auth/register and applies the session', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'jwt-reg',
        user: { id: 'u-2', email: 'new@example.com', displayName: 'New User', role: 'owner', emailVerified: false }
      }
    })
    const store = useAuthStore()

    const result = await store.register('new@example.com', 'newpass', 'New User')

    expect(mocks.apiPost).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'new@example.com', password: 'newpass', displayName: 'New User' },
      { public: true }
    )
    expect(result.success).toBe(true)
    expect(store.sessionToken).toBe('jwt-reg')
    expect(store.user.uid).toBe('u-2')
    expect(store.user.email).toBe('new@example.com')
  })

  it('shows the backend conflict message when the email is already registered', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: false,
      error: { code: 'CONFLICT', message: 'Email already registered' }
    })
    const store = useAuthStore()

    const result = await store.register('taken@example.com', 'newpass', 'Taken')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Este correo electrónico ya está registrado')
  })

  it('changes the password through /auth/change-password', async () => {
    localStorage.setItem('alqui_libres_token', 'jwt-abc')
    const store = useAuthStore()
    store.user = { uid: 'u-1', email: 'u@example.com', mustChangePassword: true }
    store.sessionToken = 'jwt-abc'
    store.mustChangePassword = true

    mocks.apiPost.mockResolvedValueOnce({ success: true, data: { message: 'Password updated successfully' } })

    const result = await store.changePassword('newpass')

    expect(mocks.apiPost).toHaveBeenCalledWith('/auth/change-password', { newPassword: 'newpass' })
    expect(result.success).toBe(true)
    expect(store.mustChangePassword).toBe(false)
  })

  it('resets the password through /auth/reset-password (authenticated)', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: { message: 'Temporary password generated for u@example.com', temporaryPassword: 'tmp-Abc123' }
    })
    const store = useAuthStore()

    const result = await store.resetPassword('u@example.com')

    // The session token must ride along: only an admin may reset, and the
    // temporary password comes back exactly once.
    expect(mocks.apiPost).toHaveBeenCalledWith('/auth/reset-password', { email: 'u@example.com' })
    expect(result.success).toBe(true)
    expect(result.temporaryPassword).toBe('tmp-Abc123')
    expect(result.message).toContain('Temporary password')
  })

  it('updates the profile through PATCH /users/me', async () => {
    const store = useAuthStore()
    store.user = { uid: 'u-1', email: 'u@example.com', displayName: 'Old', role: 'owner' }
    store.sessionToken = 'jwt-abc'

    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: { id: 'u-1', email: 'u@example.com', displayName: 'Updated', role: 'owner' }
    })

    const result = await store.updateProfile({ displayName: 'Updated' })

    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/me', { displayName: 'Updated' })
    expect(result.success).toBe(true)
    expect(store.user.displayName).toBe('Updated')
    expect(JSON.parse(localStorage.getItem('mockUser')).displayName).toBe('Updated')
  })

  it('logout clears the token and the stored user', async () => {
    const store = useAuthStore()
    store.user = { uid: 'u-1' }
    store.sessionToken = 'jwt-abc'
    localStorage.setItem('alqui_libres_token', 'jwt-abc')
    localStorage.setItem('mockUser', JSON.stringify({ uid: 'u-1' }))

    const result = await store.logout()

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionToken).toBeNull()
    expect(localStorage.getItem('alqui_libres_token')).toBeNull()
    expect(localStorage.getItem('mockUser')).toBeNull()
  })
})

describe('auth store — offline demo fallback (API unreachable)', () => {
  it('logs in with hardcoded owner credentials', async () => {
    const store = useAuthStore()

    const result = await store.login('usuario@alquilibres.com', 'user123')

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('owner001')
    expect(store.user.role).toBe('owner')
    expect(store.user.displayName).toBe('Propietario Demo')
  })

  it('logs in with hardcoded guest credentials, never with admin credentials', async () => {
    const guestStore = useAuthStore()
    const guestResult = await guestStore.login('huesped@alquilibres.com', 'guest123')
    expect(guestResult.success).toBe(true)
    expect(guestStore.user.role).toBe('guest')

    // The admin account must never ship inside the public bundle, so it has
    // no offline entry: it only authenticates against the real API.
    const adminStore = useAuthStore()
    const adminResult = await adminStore.login('admin@alquilibres.com', 'admin123')
    expect(adminResult.success).toBe(false)
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

  it('returns translated demo error for invalid credentials when API is down', async () => {
    const store = useAuthStore()

    const result = await store.login('no@example.com', 'wrong')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Modo Demo: Email o contraseña incorrectos')
    expect(store.isAuthenticated).toBe(false)
  })

  it('registers a demo user and persists credentials locally', async () => {
    const store = useAuthStore()

    const result = await store.register('new@example.com', 'newpass', 'New User')

    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user.email).toBe('new@example.com')
    expect(store.user.role).toBe('owner')

    const creds = getMockCredentials()
    expect(creds['new@example.com'].password).toBe('newpass')
    expect(creds['new@example.com'].mustChangePassword).toBe(true)
  })

  it('resets demo password to a temporary one when API is down', async () => {
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
    expect(getMockCredentials()['reset@example.com'].password).toBe('temporal123')
  })

  it('changes demo password locally when API is down', async () => {
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

describe('auth store token exposure', () => {
  it('exposes a getSessionToken helper for the API client', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'api-token',
        user: { id: 'tok-1', email: 'tok@example.com', role: 'owner' }
      }
    })
    const store = useAuthStore()
    await store.login('tok@example.com', 'tokpass')

    expect(store.getSessionToken()).toBe('api-token')
  })
})
