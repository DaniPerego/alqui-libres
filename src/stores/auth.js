import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '@/config/supabase'
import { apiGet, apiPost, apiPatch } from '@/services/api'
import { mockGuestUser, mockOwnerUser, mockAdminUser } from '@/data/mockData'

const MOCK_CREDENTIALS_KEY = 'mockCredentials'

function getMockCredentials() {
  try {
    const raw = localStorage.getItem(MOCK_CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveMockCredentials(creds) {
  localStorage.setItem(MOCK_CREDENTIALS_KEY, JSON.stringify(creds))
}

/**
 * Merges a Supabase Auth user with platform profile fields so that existing
 * views keep the same shape they had with Firebase (uid, email, displayName,
 * role, subscription, emailVerified, etc.).
 */
function normalizeUser(supabaseUser, profile = null) {
  const id = supabaseUser?.id || profile?.id || profile?.uid
  return {
    // Backward-compatible identifier used by views and stores.
    uid: id,
    // Also expose `id` for newer code that expects the API shape.
    id,
    email: supabaseUser?.email || profile?.email,
    displayName:
      profile?.displayName ||
      supabaseUser?.user_metadata?.displayName ||
      supabaseUser?.email?.split('@')[0] ||
      '',
    emailVerified: !!(
      supabaseUser?.email_confirmed_at ||
      supabaseUser?.confirmed_at ||
      profile?.emailVerified
    ),
    role: profile?.role || 'owner',
    subscription: profile?.subscription || null,
    ...profile
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
      return this.sessionToken
    },

    async checkAuth() {
      if (!isSupabaseConfigured() || !supabase) {
        const mockUserData = localStorage.getItem('mockUser')
        if (mockUserData) {
          try {
            this.user = JSON.parse(mockUserData)
          } catch {
            this.user = null
          }
          const creds = getMockCredentials()
          const entry = creds[this.user?.email]
          if (entry?.mustChangePassword) {
            this.mustChangePassword = true
          }
        }
        this.initialized = true
        return this.user
      }

      this.loading = true
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (data?.session) {
          this.sessionToken = data.session.access_token
          const profile = await this.fetchProfile()
          this.user = normalizeUser(data.session.user, profile)
        } else {
          this.user = null
          this.sessionToken = null
        }
      } catch (error) {
        console.warn('⚠️ No se pudo restaurar la sesión:', error.message)
        this.user = null
        this.sessionToken = null
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
        if (!isSupabaseConfigured() || !supabase) {
          await new Promise(resolve => setTimeout(resolve, 500))

          // Check dynamic mock credentials first
          const creds = getMockCredentials()
          const entry = creds[email]
          if (entry && entry.password === password) {
            const userData = {
              uid: entry.uid,
              id: entry.uid,
              email,
              displayName: entry.displayName || email.split('@')[0],
              emailVerified: true,
              role: entry.role || 'owner',
              subscription: entry.subscription || null,
              stats: { properties: 0, bookings: 0, revenue: 0 }
            }
            this.user = userData
            localStorage.setItem('mockUser', JSON.stringify(userData))
            if (entry.mustChangePassword) {
              this.mustChangePassword = true
            }
            return { success: true }
          }

          // Fallback to hardcoded users
          if (email === 'huesped@alquilibres.com' && password === 'guest123') {
            this.user = mockGuestUser
            this.initialized = true
            localStorage.setItem('mockUser', JSON.stringify(mockGuestUser))
            return { success: true }
          } else if (email === 'usuario@alquilibres.com' && password === 'user123') {
            this.user = mockOwnerUser
            this.initialized = true
            localStorage.setItem('mockUser', JSON.stringify(mockOwnerUser))
            return { success: true }
          } else if (email === 'admin@alquilibres.com' && password === 'admin123') {
            this.user = mockAdminUser
            this.initialized = true
            localStorage.setItem('mockUser', JSON.stringify(mockAdminUser))
            return { success: true }
          } else {
            throw new Error('Modo Demo: Email o contraseña incorrectos')
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        this.sessionToken = data.session?.access_token || null
        const supabaseUser = data.user || data.session?.user
        const profile = await this.fetchProfile()
        this.user = normalizeUser(supabaseUser, profile)

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
        if (!isSupabaseConfigured() || !supabase) {
          const userData = this.user
          if (!userData) throw new Error('No hay usuario autenticado')

          const creds = getMockCredentials()
          const entry = creds[userData.email]
          if (entry) {
            creds[userData.email] = { ...entry, password: newPassword, mustChangePassword: false }
            saveMockCredentials(creds)
          }
          this.mustChangePassword = false
          return { success: true }
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
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
      if (!isSupabaseConfigured() || !supabase) {
        const creds = getMockCredentials()
        const entry = creds[email]
        if (entry) {
          creds[email] = { ...entry, password: 'temporal123', mustChangePassword: true }
          saveMockCredentials(creds)
          return { success: true, message: 'Contraseña restablecida a: temporal123' }
        }
        return { success: false, error: 'Email no encontrado' }
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/cambiar-contrasena`
        })
        if (error) throw error
        return { success: true, message: 'Email de restablecimiento enviado' }
      } catch (error) {
        return { success: false, error: this.getErrorMessage(error.message || error.code) }
      }
    },

    // Called by admin store when creating a new user
    saveMockCredentials(email, password, displayName, role, uid, subscription) {
      const creds = getMockCredentials()
      creds[email] = {
        password,
        uid,
        displayName,
        role,
        subscription,
        mustChangePassword: true
      }
      saveMockCredentials(creds)
    },

    clearMockCredentials(email) {
      const creds = getMockCredentials()
      delete creds[email]
      saveMockCredentials(creds)
    },

    async register(email, password, displayName) {
      this.loading = true
      this.error = null

      try {
        if (!isSupabaseConfigured() || !supabase) {
          // Demo registration: store credentials and authenticate immediately
          const uid = `demo-${Date.now()}`
          this.saveMockCredentials(email, password, displayName || email.split('@')[0], 'owner', uid, null)

          const userData = {
            uid,
            id: uid,
            email,
            displayName: displayName || email.split('@')[0],
            emailVerified: true,
            role: 'owner',
            subscription: null,
            stats: { properties: 0, bookings: 0, revenue: 0 }
          }
          this.user = userData
          localStorage.setItem('mockUser', JSON.stringify(userData))
          return { success: true }
        }

        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        const supabaseUser = data.user
        const platformUser = {
          id: supabaseUser.id,
          email,
          displayName: displayName || email.split('@')[0],
          role: 'owner'
        }

        const createResult = await apiPost('/users', platformUser)
        if (!createResult.success) {
          // Continue anyway; the auth user exists and the backend may create
          // the profile on first login.
          console.warn('⚠️ No se pudo crear el perfil de plataforma:', createResult.error?.message)
        }

        this.user = normalizeUser(supabaseUser, platformUser)
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.message || error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      try {
        if (!isSupabaseConfigured() || !supabase) {
          this.user = { ...this.user, ...profileData }
          localStorage.setItem('mockUser', JSON.stringify(this.user))
          return { success: true }
        }

        const { error } = await supabase.auth.updateUser({
          data: profileData
        })
        if (error) throw error

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
        if (!isSupabaseConfigured() || !supabase) {
          localStorage.removeItem('mockUser')
          this.user = null
          this.sessionToken = null
          this.mustChangePassword = false
          return { success: true }
        }

        const { error } = await supabase.auth.signOut()
        if (error) throw error

        this.user = null
        this.sessionToken = null
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
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/weak-password': 'La contraseña es demasiado débil',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/too-many-requests': 'Demasiados intentos. Intente más tarde',
        'auth/session-missing': 'No hay sesión activa',
        'Modo Demo: Email o contraseña incorrectos': 'Modo Demo: Email o contraseña incorrectos',
        'Invalid login credentials': 'Credenciales inválidas'
      }
      return messages[code] || 'Ocurrió un error. Intente nuevamente'
    }
  }
})
