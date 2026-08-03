import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null,
    mustChangePassword: false
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.uid,
    userEmail: (state) => state.user?.email,
    userName: (state) => state.user?.displayName
  },
  
  actions: {
    async checkAuth() {
      if (!auth) {
        const mockUserData = localStorage.getItem('mockUser')
        if (mockUserData) {
          this.user = JSON.parse(mockUserData)
          const creds = getMockCredentials()
          const entry = creds[this.user.email]
          if (entry?.mustChangePassword) {
            this.mustChangePassword = true
          }
        }
        this.initialized = true
        return this.user
      }

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user && db) {
            try {
              const userSnap = await getDoc(doc(db, 'users', user.uid))
              if (userSnap.exists()) {
                this.user = { ...user, ...userSnap.data() }
              } else {
                this.user = user
              }
            } catch (e) {
              console.warn('⚠️ No se pudo cargar el doc del usuario:', e.message)
              this.user = user
            }
          } else {
            this.user = user
          }
          this.initialized = true
          unsubscribe()
          resolve(user)
        })
      })
    },
    
    async login(email, password) {
      this.loading = true
      this.error = null
      this.mustChangePassword = false
      
      try {
        if (!auth) {
          await new Promise(resolve => setTimeout(resolve, 500))

          // Check dynamic mock credentials first
          const creds = getMockCredentials()
          const entry = creds[email]
          if (entry && entry.password === password) {
            const { mockUsersCredentials: _, ...rest } = creds
            const userData = {
              uid: entry.uid,
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

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user

        // Cargar el doc del usuario (rol, suscripción) desde Firestore.
        // En modo demo el rol viene en los datos mock; en modo real vive en users/{uid}.
        if (db) {
          try {
            const userSnap = await getDoc(doc(db, 'users', userCredential.user.uid))
            if (userSnap.exists()) {
              this.user = { ...userCredential.user, ...userSnap.data() }
            }
          } catch (e) {
            console.warn('⚠️ No se pudo cargar el doc del usuario:', e.message)
          }
        }

        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code || error.message)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async changePassword(newPassword) {
      this.loading = true
      try {
        if (!auth) {
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

        const user = auth.currentUser
        if (!user) throw new Error('No hay usuario autenticado')
        await user.updatePassword(newPassword)
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code || error.message)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      if (!auth) {
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
        await sendPasswordResetEmail(auth, email)
        return { success: true, message: 'Email de restablecimiento enviado' }
      } catch (error) {
        return { success: false, error: this.getErrorMessage(error.code) }
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }
        this.user = userCredential.user

        // Crear el doc del usuario en Firestore con su rol.
        // Las reglas de seguridad leen users/{uid}.role para detectar admin.
        if (db) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email,
            displayName: displayName || email.split('@')[0],
            role: 'owner', // El registro público crea propietarios
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true })
        }

        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    
    async updateProfile(profileData) {
      this.loading = true
      try {
        if (!auth) {
          this.user = { ...this.user, ...profileData }
          localStorage.setItem('mockUser', JSON.stringify(this.user))
          return { success: true }
        }
        await updateProfile(auth.currentUser, profileData)
        this.user = { ...this.user, ...profileData }
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      try {
        if (!auth) {
          localStorage.removeItem('mockUser')
          this.user = null
          this.mustChangePassword = false
          return { success: true }
        }
        await signOut(auth)
        this.user = null
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code)
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
        'auth/too-many-requests': 'Demasiados intentos. Intente más tarde'
      }
      return messages[code] || 'Ocurrió un error. Intente nuevamente'
    }
  }
})
