import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/config/firebase'
import { mockUser, mockAdminUser } from '@/data/mockData'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userId: (state) => state.user?.uid,
    userEmail: (state) => state.user?.email,
    userName: (state) => state.user?.displayName
  },
  
  actions: {
    async checkAuth() {
      // Si no hay Firebase configurado, verificar si hay usuario mock en localStorage
      if (!auth) {
        const mockUserData = localStorage.getItem('mockUser')
        if (mockUserData) {
          this.user = JSON.parse(mockUserData)
        }
        this.initialized = true
        return this.user
      }

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          this.user = user
          this.initialized = true
          unsubscribe()
          resolve(user)
        })
      })
    },
    
    async login(email, password) {
      this.loading = true
      this.error = null
      
      try {
        // Modo demo - permite login sin Firebase configurado
        if (!auth) {
          if (email === 'demo@alquilibres.com' && password === 'demo123') {
            console.log('🧪 Login exitoso en modo demo como propietario')
            await new Promise(resolve => setTimeout(resolve, 500))
            this.user = mockUser
            this.initialized = true
            localStorage.setItem('mockUser', JSON.stringify(mockUser))
            return { success: true }
          } else if (email === 'admin@alquilibres.com' && password === 'admin123') {
            console.log('👑 Login exitoso en modo demo como ADMINISTRADOR')
            await new Promise(resolve => setTimeout(resolve, 500))
            this.user = mockAdminUser
            this.initialized = true
            localStorage.setItem('mockUser', JSON.stringify(mockAdminUser))
            return { success: true }
          } else {
            throw new Error('Modo Demo: Use demo@alquilibres.com/demo123 o admin@alquilibres.com/admin123')
          }
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code || error.message)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },
    
    async register(email, password, displayName) {
      this.loading = true
      this.error = null
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Actualizar perfil con nombre
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }
        
        this.user = userCredential.user
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
        // Modo demo
        if (!auth) {
          localStorage.removeItem('mockUser')
          this.user = null
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
