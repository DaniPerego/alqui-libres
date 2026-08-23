import { defineStore } from 'pinia'
import { apiGet, apiPost, apiPatch } from '@/services/api'

const TOKEN_KEY = 'alqui_libres_token'

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

function normalizeUser(data) {
  if (!data) return null
  return {
    uid: data.id,
    id: data.id,
    email: data.email,
    displayName: data.displayName || '',
    emailVerified: !!data.emailVerified,
    role: data.role || 'owner',
    subscription: data.subscription || null,
    ...data
  }
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
      const token = getToken()
      if (!token) {
        this.user = null
        this.initialized = true
        return null
      }

      this.sessionToken = token
      this.loading = true
      try {
        const result = await apiGet('/auth/me')
        if (result.success && result.data) {
          this.user = normalizeUser(result.data)
        } else {
          this.user = null
          this.sessionToken = null
          clearToken()
        }
      } catch {
        this.user = null
        this.sessionToken = null
        clearToken()
      } finally {
        this.loading = false
        this.initialized = true
      }
      return this.user
    },

    async fetchProfile() {
      const result = await apiGet('/users/me')
      return result.success ? result.data : null
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      this.mustChangePassword = false

      try {
        const result = await apiPost('/auth/login', { email, password }, { public: true })
        if (!result.success) {
          throw new Error(result.error?.message || 'Invalid credentials')
        }

        const { token, user } = result.data
        setToken(token)
        this.sessionToken = token
        this.user = normalizeUser(user)
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async register(email, password, displayName) {
      this.loading = true
      this.error = null

      try {
        const result = await apiPost('/auth/register', { email, password, displayName }, { public: true })
        if (!result.success) {
          throw new Error(result.error?.message || 'Registration failed')
        }

        const { token, user } = result.data
        setToken(token)
        this.sessionToken = token
        this.user = normalizeUser(user)
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async changePassword(newPassword) {
      this.loading = true
      try {
        const result = await apiPost('/auth/change-password', { newPassword })
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to change password')
        }
        this.mustChangePassword = false
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      try {
        const result = await apiPost('/auth/reset-password', { email }, { public: true })
        if (!result.success) {
          throw new Error(result.error?.message || 'Reset failed')
        }
        return { success: true, message: 'Si el email existe, se envió un enlace de restablecimiento' }
      } catch (error) {
        return { success: false, error: this.getErrorMessage(error.message || error.code) }
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      try {
        const result = await apiPatch('/users/me', profileData)
        if (result.success) {
          this.user = { ...this.user, ...result.data }
        } else {
          this.user = { ...this.user, ...profileData }
        }
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
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
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    getErrorMessage(code) {
      const messages = {
        'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
        'Email already registered': 'Este correo electrónico ya está registrado',
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/weak-password': 'La contraseña es demasiado débil',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'Invalid credentials': 'Credenciales inválidas',
        'auth/too-many-requests': 'Demasiados intentos. Intente más tarde',
        'auth/session-missing': 'No hay sesión activa',
        'Invalid or expired token': 'Sesión expirada. Iniciá sesión nuevamente'
      }
      return messages[code] || 'Ocurrió un error. Intente nuevamente'
    }
  }
})
