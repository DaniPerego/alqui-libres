import { defineStore } from 'pinia'
import { apiGet, apiPost, apiPatch } from '@/services/api'

const TOKEN_KEY = 'alqui_libres_token'
const MOCK_USER_KEY = 'mockUser'
const MOCK_CREDENTIALS_KEY = 'mockCredentials'

// Hardcoded demo users — ONLY as offline fallback when the native auth API
// is unreachable (e.g. local dev without DATABASE_URL). The real accounts
// live in Postgres (prisma/seed.js, bcrypt) and are validated by
// /api/auth/login.
const DEMO_USERS = {
  'usuario@alquilibres.com': {
    password: 'user123',
    uid: 'owner001',
    email: 'usuario@alquilibres.com',
    displayName: 'Propietario Demo',
    role: 'owner',
    emailVerified: true,
    subscription: {
      planId: 'pro',
      status: 'active',
      startedAt: new Date('2026-09-21T00:00:00.000Z').toISOString(),
      expiresAt: new Date('2026-11-21T00:00:00.000Z').toISOString(),
      autoRenew: true,
      lastPaymentDate: new Date('2026-10-21T00:00:00.000Z').toISOString(),
      nextPaymentDate: new Date('2026-11-21T00:00:00.000Z').toISOString(),
      planName: 'Plan Profesional',
      planPrice: 24999,
      currency: 'ARS',
      interval: 'month'
    }
  },
  'huesped@alquilibres.com': {
    password: 'guest123',
    uid: 'guest001',
    email: 'huesped@alquilibres.com',
    displayName: 'Huésped Prueba',
    role: 'guest',
    emailVerified: true,
    subscription: null
  },
  'admin@alquilibres.com': {
    password: 'admin123',
    uid: 'admin001',
    email: 'admin@alquilibres.com',
    displayName: 'Administrador',
    role: 'admin',
    emailVerified: true,
    subscription: {
      planId: 'enterprise',
      status: 'active',
      startedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      lastPaymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user) {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  localStorage.removeItem(MOCK_USER_KEY)
}

function getMockCredentials() {
  try {
    const raw = localStorage.getItem(MOCK_CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setMockCredentials(creds) {
  localStorage.setItem(MOCK_CREDENTIALS_KEY, JSON.stringify(creds))
}

function normalizeUser(data) {
  if (!data) return null
  return {
    uid: data.id || data.uid,
    id: data.id || data.uid,
    email: data.email,
    displayName: data.displayName || '',
    emailVerified: !!data.emailVerified,
    role: data.role || 'owner',
    subscription: data.subscription || null,
    ...data
  }
}

function applySession(token, user) {
  const store = useAuthStore()
  store.sessionToken = token
  setToken(token)
  store.user = normalizeUser(user)
  setStoredUser(store.user)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null,
    mustChangePassword: false,
    sessionToken: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.uid,
    userEmail: (state) => state.user?.email,
    userName: (state) => state.user?.displayName
  },

  actions: {
    getSessionToken() {
      return this.sessionToken || getToken()
    },

    async checkAuth() {
      const token = this.sessionToken || getToken()

      if (!token) {
        // Offline demo fallback: restore a previously created mock user.
        const mockUser = getStoredUser()
        if (mockUser) {
          this.user = mockUser
          this.mustChangePassword = !!mockUser.mustChangePassword
        }
        this.initialized = true
        return this.user
      }

      try {
        const result = await apiGet('/auth/me')
        if (result.success && result.data) {
          this.sessionToken = token
          this.user = normalizeUser(result.data)
          setStoredUser(this.user)
        } else if (result.error?.code === 'NETWORK_ERROR') {
          // API unreachable: restore last known user snapshot (offline grace).
          const stored = getStoredUser()
          if (stored) {
            this.sessionToken = token
            this.user = stored
            this.mustChangePassword = !!stored.mustChangePassword
          } else {
            clearToken()
          }
        } else {
          // 401/403/404 — session no longer valid.
          clearToken()
          clearStoredUser()
          this.user = null
          this.sessionToken = null
        }
      } catch {
        this.user = null
        this.sessionToken = null
      } finally {
        this.initialized = true
      }
      return this.user
    },

    async fetchProfile() {
      const result = await apiGet('/auth/me')
      if (result.success && result.data) {
        this.user = normalizeUser(result.data)
        setStoredUser(this.user)
      }
      return this.user
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      this.mustChangePassword = false

      try {
        // Native auth (Postgres + bcrypt + JWT) — the real path.
        const result = await apiPost('/auth/login', { email, password }, { public: true })

        if (result.success && result.data?.token) {
          applySession(result.data.token, result.data.user)
          return { success: true }
        }

        // Backend answered with an auth error — real invalid credentials.
        if (result.error?.code !== 'NETWORK_ERROR') {
          this.error = this.getErrorMessage(result.error?.message || result.error?.code)
          return { success: false, error: this.error }
        }

        // API unreachable — offline demo fallback.
        return this.demoLogin(email, password)
      } finally {
        this.loading = false
      }
    },

    demoLogin(email, password) {
      const demoUser = DEMO_USERS[email]
      if (demoUser && demoUser.password === password) {
        const user = { ...demoUser }
        delete user.password
        this.user = user
        setStoredUser(user)
        return { success: true }
      }

      const storedCreds = getMockCredentials()
      const stored = storedCreds[email]
      if (stored && stored.password === password) {
        const user = {
          uid: stored.uid,
          id: stored.uid,
          email,
          displayName: stored.displayName || email.split('@')[0],
          role: stored.role || 'owner',
          emailVerified: true,
          subscription: stored.subscription || null,
          mustChangePassword: stored.mustChangePassword || false
        }
        this.mustChangePassword = !!stored.mustChangePassword
        this.user = user
        setStoredUser(user)
        return { success: true }
      }

      this.error = 'Modo Demo: Email o contraseña incorrectos'
      return { success: false, error: this.error }
    },

    async register(email, password, displayName) {
      this.loading = true
      this.error = null

      try {
        const result = await apiPost(
          '/auth/register',
          { email, password, displayName },
          { public: true }
        )

        if (result.success && result.data?.token) {
          applySession(result.data.token, result.data.user)
          return { success: true }
        }

        if (result.error?.code !== 'NETWORK_ERROR') {
          this.error = this.getErrorMessage(result.error?.message || result.error?.code)
          return { success: false, error: this.error }
        }

        // API unreachable — local demo registration.
        const uid = 'user_' + Date.now()
        const user = {
          uid,
          id: uid,
          email,
          displayName: displayName || email.split('@')[0],
          role: 'owner',
          emailVerified: true,
          subscription: null
        }

        const storedCreds = getMockCredentials()
        storedCreds[email] = {
          password,
          uid,
          displayName: user.displayName,
          role: 'owner',
          mustChangePassword: true
        }
        setMockCredentials(storedCreds)

        this.mustChangePassword = true
        this.user = user
        setStoredUser({ ...user, mustChangePassword: true })
        return { success: true }
      } finally {
        this.loading = false
      }
    },

    async changePassword(newPassword) {
      this.loading = true

      try {
        const result = await apiPost('/auth/change-password', { newPassword })

        if (result.success) {
          this.mustChangePassword = false
          if (this.user) {
            this.user.mustChangePassword = false
            setStoredUser(this.user)
          }
          return { success: true }
        }

        if (result.error?.code !== 'NETWORK_ERROR') {
          this.error = this.getErrorMessage(result.error?.message || result.error?.code)
          return { success: false, error: this.error }
        }

        // API unreachable — update local demo credentials.
        if (this.user?.email) {
          const storedCreds = getMockCredentials()
          if (storedCreds[this.user.email]) {
            storedCreds[this.user.email].password = newPassword
            storedCreds[this.user.email].mustChangePassword = false
            setMockCredentials(storedCreds)
          }
        }
        this.mustChangePassword = false
        if (this.user) {
          this.user.mustChangePassword = false
          setStoredUser(this.user)
        }
        return { success: true }
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      const result = await apiPost('/auth/reset-password', { email }, { public: true })

      if (result.success) {
        return {
          success: true,
          message: result.data?.message || 'Si el email existe, se envió un enlace de restablecimiento'
        }
      }

      if (result.error?.code !== 'NETWORK_ERROR') {
        return { success: false, error: this.getErrorMessage(result.error?.message || result.error?.code) }
      }

      // API unreachable — local demo reset.
      const storedCreds = getMockCredentials()
      if (storedCreds[email]) {
        storedCreds[email].password = 'temporal123'
        storedCreds[email].mustChangePassword = true
        setMockCredentials(storedCreds)
        return { success: true, message: 'Contraseña temporal: temporal123. Debe cambiarla al iniciar sesión.' }
      }
      return { success: true, message: 'Si el email existe, se envió un enlace de restablecimiento' }
    },

    async updateProfile(profileData) {
      this.loading = true

      try {
        const result = await apiPatch('/users/me', profileData)

        if (result.success && result.data) {
          this.user = normalizeUser(result.data)
        } else if (result.error?.code === 'NETWORK_ERROR' && this.user) {
          this.user = { ...this.user, ...profileData }
        } else {
          this.user = { ...this.user, ...profileData }
        }
        setStoredUser(this.user)
        return { success: true }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        this.user = null
        this.sessionToken = null
        this.mustChangePassword = false
        clearToken()
        clearStoredUser()
        return { success: true }
      } finally {
        this.loading = false
      }
    },

    getErrorMessage(code) {
      const messages = {
        'Invalid credentials': 'Email o contraseña incorrectos',
        'Email already registered': 'Este correo electrónico ya está registrado',
        'User account is inactive': 'Esta cuenta ha sido deshabilitada',
        'User not found': 'Usuario no encontrado',
        'Authentication required': 'Iniciá sesión nuevamente',
        'Invalid or expired token': 'Sesión expirada. Iniciá sesión nuevamente',
        'UNAUTHORIZED': 'Email o contraseña incorrectos',
        'CONFLICT': 'Este correo electrónico ya está registrado',
        'FORBIDDEN': 'Esta cuenta ha sido deshabilitada',
        'VALIDATION': 'Datos inválidos. Revisá el email y la contraseña.'
      }
      return messages[code] || 'Ocurrió un error. Intente nuevamente'
    }
  }
})
