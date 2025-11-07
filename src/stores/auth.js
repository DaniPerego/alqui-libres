import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/config/firebase'

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
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user
        return { success: true }
      } catch (error) {
        this.error = this.getErrorMessage(error.code)
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
