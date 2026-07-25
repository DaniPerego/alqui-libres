import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore'

export const useAdminStore = defineStore('admin', () => {
  // Version para invalidar caché cuando cambien los planes
  const PLANS_VERSION = '1.1' // Incrementa esto cuando cambies precios/características
  const PLANS_COLLECTION = 'subscriptionPlans'
  
  // Default plans
  const defaultPlans = [
    {
      id: 'basic',
      name: 'Plan Básico',
      price: 14999,
      currency: 'ARS',
      interval: 'month',
      features: [
        'Hasta 3 propiedades activas',
        'Sin comisión por reserva',
        'Soporte por email',
        'Panel de gestión básico'
      ],
      maxProperties: 3,
      isActive: true
    },
    {
      id: 'pro',
      name: 'Plan Profesional',
      price: 24999,
      currency: 'ARS',
      interval: 'month',
      features: [
        'Hasta 10 propiedades activas',
        'Sin comisión por reserva',
        'Soporte prioritario 24/7',
        'Panel de gestión avanzado',
        'Estadísticas detalladas',
        'Destacado en búsquedas'
      ],
      maxProperties: 10,
      isActive: true,
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Plan Empresarial',
      price: 49999,
      currency: 'ARS',
      interval: 'month',
      features: [
        'Propiedades ilimitadas',
        'Sin comisión por reserva',
        'Soporte dedicado 24/7',
        'Panel personalizado',
        'API access',
        'Multi-usuario',
        'Posición premium en búsquedas',
        'Gestor de cuenta dedicado'
      ],
      maxProperties: -1, // -1 = ilimitadas
      isActive: true
    }
  ]

  // Load plans from localStorage or use defaults
  const loadPlansFromStorage = () => {
    try {
      const storedVersion = localStorage.getItem('plansVersion')
      const stored = localStorage.getItem('subscriptionPlans')
      
      // Si la versión no coincide, forzar actualización
      if (storedVersion !== PLANS_VERSION) {
        console.log(`🔄 Versión desactualizada (${storedVersion} → ${PLANS_VERSION}). Actualizando planes...`)
        localStorage.removeItem('subscriptionPlans')
        localStorage.setItem('plansVersion', PLANS_VERSION)
        return defaultPlans
      }
      
      if (stored) {
        const plans = JSON.parse(stored)
        console.log('📂 Planes cargados desde localStorage:', plans)
        return plans
      } else {
        console.log('🆕 Usando planes por defecto (no hay datos guardados)')
        localStorage.setItem('plansVersion', PLANS_VERSION)
        return defaultPlans
      }
    } catch (error) {
      console.error('❌ Error loading plans from storage:', error)
      localStorage.setItem('plansVersion', PLANS_VERSION)
      return defaultPlans
    }
  }

  // Save plans to localStorage
  const savePlansToStorage = (plans) => {
    try {
      localStorage.setItem('subscriptionPlans', JSON.stringify(plans))
      localStorage.setItem('plansVersion', PLANS_VERSION)
      console.log('💾 Planes guardados en localStorage:', plans)
      console.log('🔖 Versión guardada:', PLANS_VERSION)
    } catch (error) {
      console.error('❌ Error saving plans to storage:', error)
    }
  }

  // Firestore-backed plans initialization and sync
  let unsubscribePlans = null
  let unsubscribeSettings = null

  const seedPlansInFirestoreIfEmpty = async () => {
    const plansRef = collection(db, PLANS_COLLECTION)
    const snap = await getDocs(plansRef)
    if (snap.empty) {
      // Seed defaults
      await Promise.all(defaultPlans.map(p => setDoc(doc(db, PLANS_COLLECTION, p.id), p)))
    }
  }

  const subscribeToPlans = () => {
    if (!db) return
    if (unsubscribePlans) unsubscribePlans()
    const plansRef = collection(db, PLANS_COLLECTION)
    unsubscribePlans = onSnapshot(plansRef, (snapshot) => {
      const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      // Orden opcional: mantener orden por defecto si existe
      // Persistir cache local para modo offline
      subscriptionPlans.value = plans
      savePlansToStorage(plans)
      console.log('🔄 Planes actualizados desde Firestore:', plans)
    }, (err) => {
      console.error('Error en suscripción de planes:', err)
    })
  }

  const initPlans = async () => {
    if (db) {
      try {
        await seedPlansInFirestoreIfEmpty()
        subscribeToPlans()
      } catch (e) {
        console.warn('No se pudo inicializar planes en Firestore, usando localStorage:', e?.message || e)
        subscriptionPlans.value = loadPlansFromStorage()
      }
    } else {
      subscriptionPlans.value = loadPlansFromStorage()
    }
  }

  // Firestore-backed platform settings
  const SETTINGS_DOC_ID = 'general'

  const initPlatformSettings = async () => {
    if (!db) {
      // Modo demo: cargar de localStorage
      const stored = localStorage.getItem('platformSettings')
      if (stored) {
        platformSettings.value = { ...platformSettings.value, ...JSON.parse(stored) }
      }
      return
    }

    try {
      const settingsRef = doc(db, 'platformSettings', SETTINGS_DOC_ID)
      const snap = await getDocs(collection(db, 'platformSettings'))
      
      // Seed si no existe
      if (snap.empty) {
        await setDoc(settingsRef, platformSettings.value)
        console.log('🌱 Settings iniciales creados en Firestore')
      }

      // Suscribirse a cambios en tiempo real
      if (unsubscribeSettings) unsubscribeSettings()
      unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          platformSettings.value = { ...platformSettings.value, ...docSnap.data() }
          // Cache local
          localStorage.setItem('platformSettings', JSON.stringify(platformSettings.value))
          console.log('🔄 Settings actualizados desde Firestore:', platformSettings.value)
        }
      }, (err) => {
        console.error('Error suscribiéndose a settings:', err)
      })
    } catch (e) {
      console.warn('No se pudieron cargar settings de Firestore, usando localStorage:', e?.message || e)
      const stored = localStorage.getItem('platformSettings')
      if (stored) {
        platformSettings.value = { ...platformSettings.value, ...JSON.parse(stored) }
      }
    }
  }

  const updatePlatformSettings = async (updates) => {
    if (!db) {
      // Modo demo: guardar en localStorage
      platformSettings.value = { ...platformSettings.value, ...updates }
      localStorage.setItem('platformSettings', JSON.stringify(platformSettings.value))
      return { success: true }
    }

    try {
      const settingsRef = doc(db, 'platformSettings', SETTINGS_DOC_ID)
      await setDoc(settingsRef, { ...platformSettings.value, ...updates }, { merge: true })
      console.log('✅ Settings guardados en Firestore:', updates)
      return { success: true }
    } catch (err) {
      console.error('❌ Error guardando settings en Firestore:', err)
      return { success: false, error: err.message }
    }
  }

  // Load payment settings from localStorage
  const loadPaymentSettingsFromStorage = () => {
    try {
      const stored = localStorage.getItem('paymentSettings')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error loading payment settings from storage:', error)
      return null
    }
  }

  // Save payment settings to localStorage
  const savePaymentSettingsToStorage = (settings) => {
    try {
      localStorage.setItem('paymentSettings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving payment settings to storage:', error)
    }
  }

  // State
  const users = ref([])
  const properties = ref([])
  const subscriptions = ref([])
  const subscriptionPlans = ref(loadPlansFromStorage())
  const paymentSettings = ref(loadPaymentSettingsFromStorage())
  const platformSettings = ref({
    platformName: 'AlquiLibres',
    contactEmail: 'info@alquilibres.com',
    supportPhone: '+54 9 11 1234-5678',
    commissionRate: 0,
    emailNotifications: true,
    whatsappNotifications: true,
    requireEmailVerification: false,
    moderateProperties: false
  })
  const stats = ref({
    totalUsers: 0,
    totalProperties: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    totalBookings: 0
  })
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const activeUsers = computed(() => 
    users.value.filter(u => u.isActive)
  )

  const pendingProperties = computed(() => 
    properties.value.filter(p => p.status === 'pending')
  )

  const revenueByPlan = computed(() => {
    const revenue = {}
    subscriptionPlans.value.forEach(plan => {
      const count = users.value.filter(u => u.subscription?.planId === plan.id && u.subscription?.status === 'active').length
      revenue[plan.name] = count * plan.price
    })
    return revenue
  })

  // Helper: guarda usuarios creados desde el admin en localStorage para que persistan
  const saveCustomUsers = () => {
    try {
      localStorage.setItem('mockAdminUsers', JSON.stringify(users.value.filter(u => u.uid.startsWith('user_'))))
    } catch (e) {
      console.warn('No se pudo guardar usuarios personalizados:', e)
    }
  }

  // Actions

  /**
   * Cargar todos los usuarios desde Firestore
   */
  const fetchUsers = async () => {
    if (!db) {
      // Modo demo: cargar usuarios guardados + hardcoded
      const hardcoded = [
        {
          uid: 'user123',
          email: 'demo@alquilubres.com',
          displayName: 'Usuario Demo',
          createdAt: new Date('2024-01-15'),
          isActive: true,
          role: 'owner',
          subscription: {
            planId: 'pro',
            status: 'active',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2025-01-15')
          },
          stats: {
            properties: 4,
            bookings: 47,
            revenue: 12450
          }
        },
        {
          uid: 'user456',
          email: 'propietario2@example.com',
          displayName: 'María González',
          createdAt: new Date('2024-03-10'),
          isActive: true,
          role: 'owner',
          subscription: {
            planId: 'basic',
            status: 'active',
            startDate: new Date('2024-03-10'),
            endDate: new Date('2025-03-10')
          },
          stats: {
            properties: 1,
            bookings: 12,
            revenue: 3200
          }
        },
        {
          uid: 'user789',
          email: 'carlos.admin@alquilubres.com',
          displayName: 'Carlos Admin',
          createdAt: new Date('2024-01-01'),
          isActive: true,
          role: 'admin',
          subscription: null,
          stats: {
            properties: 0,
            bookings: 0,
            revenue: 0
          }
        }
      ]

      const stored = localStorage.getItem('mockAdminUsers')
      const customUsers = stored ? JSON.parse(stored) : []

      // Merge: custom users override hardcoded by uid
      const merged = [...hardcoded]
      for (const cu of customUsers) {
        const idx = merged.findIndex(u => u.uid === cu.uid)
        cu.createdAt = new Date(cu.createdAt)
        if (cu.subscription) {
          cu.subscription.startDate = cu.subscription.startDate ? new Date(cu.subscription.startDate) : new Date()
          cu.subscription.endDate = cu.subscription.endDate ? new Date(cu.subscription.endDate) : new Date()
        }
        if (idx >= 0) {
          merged[idx] = cu
        } else {
          merged.push(cu)
        }
      }
      users.value = merged
      updateStats()
      return { success: true }
    }

    loading.value = true
    error.value = null

    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      
      users.value = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      updateStats()
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching users:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar todas las propiedades desde Firestore
   */
  const fetchAllProperties = async () => {
    if (!db) {
      // Usar datos mock
      const { mockProperties, mockPendingProperties } = await import('@/data/mockData')
      properties.value = [...mockProperties, ...mockPendingProperties].map(p => ({
        ...p,
        createdAt: p.createdAt || new Date()
      }))
      updateStats()
      return { success: true }
    }

    loading.value = true
    error.value = null

    try {
      const propertiesRef = collection(db, 'properties')
      const snapshot = await getDocs(propertiesRef)
      
      properties.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      updateStats()
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching properties:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar estado de una propiedad (aprobar/rechazar)
   */
  const updatePropertyStatus = async (propertyId, status) => {
    if (!db) {
      // Modo demo
      const property = properties.value.find(p => p.id === propertyId)
      if (property) {
        property.status = status
        property.reviewedAt = new Date()
      }
      return { success: true, message: `Propiedad ${status === 'active' ? 'aprobada' : 'rechazada'} (modo demo)` }
    }

    try {
      const propertyRef = doc(db, 'properties', propertyId)
      await updateDoc(propertyRef, {
        status,
        reviewedAt: Timestamp.now()
      })

      // Actualizar en estado local
      const property = properties.value.find(p => p.id === propertyId)
      if (property) {
        property.status = status
        property.reviewedAt = new Date()
      }

      return { success: true }
    } catch (err) {
      console.error('Error updating property status:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Eliminar una propiedad
   */
  const deleteProperty = async (propertyId) => {
    if (!db) {
      // Modo demo
      const index = properties.value.findIndex(p => p.id === propertyId)
      if (index !== -1) {
        properties.value.splice(index, 1)
      }
      return { success: true, message: 'Propiedad eliminada (modo demo)' }
    }

    try {
      await deleteDoc(doc(db, 'properties', propertyId))
      
      // Actualizar estado local
      const index = properties.value.findIndex(p => p.id === propertyId)
      if (index !== -1) {
        properties.value.splice(index, 1)
      }

      updateStats()
      return { success: true }
    } catch (err) {
      console.error('Error deleting property:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar rol de usuario
   */
  const updateUserRole = async (userId, role) => {
    if (!db) {
      // Modo demo
      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.role = role
      }
      saveCustomUsers()
      return { success: true, message: `Usuario actualizado a ${role} (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { role })

      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.role = role
      }
      saveCustomUsers()
      return { success: true }
    } catch (err) {
      console.error('Error updating user role:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Suspender/activar usuario
   */
  const toggleUserStatus = async (userId, isActive) => {
    if (!db) {
      // Modo demo
      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.isActive = isActive
      }
      saveCustomUsers()
      return { success: true, message: `Usuario ${isActive ? 'activado' : 'suspendido'} (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isActive })

      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.isActive = isActive
      }
      saveCustomUsers()
      return { success: true }
    } catch (err) {
      console.error('Error toggling user status:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Crear un nuevo usuario (propietario) desde el admin
   */
  const createUser = async (userData) => {
    const password = userData.password || Math.random().toString(36).slice(2, 10)
    const newUser = {
      uid: 'user_' + Date.now() + Math.random().toString(36).slice(2, 6),
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || 'owner',
      isActive: true,
      createdAt: new Date(),
      subscription: userData.planId ? {
        planId: userData.planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      } : null,
      stats: {
        properties: 0,
        bookings: 0,
        revenue: 0
      }
    }

    if (!db) {
      const authStore = useAuthStore()
      authStore.saveMockCredentials(newUser.email, password, newUser.displayName, newUser.role, newUser.uid, newUser.subscription)
      users.value.push(newUser)
      saveCustomUsers()
      updateStats()
      return { success: true, user: newUser, password, message: `Usuario ${userData.displayName} creado. Contraseña temporal: ${password}` }
    }

    try {
      const userRef = doc(db, 'users', newUser.uid)
      await setDoc(userRef, {
        ...newUser,
        createdAt: Timestamp.fromDate(newUser.createdAt),
        subscription: newUser.subscription ? {
          ...newUser.subscription,
          startDate: Timestamp.fromDate(newUser.subscription.startDate),
          endDate: Timestamp.fromDate(newUser.subscription.endDate)
        } : null
      })
      users.value.push(newUser)
      saveCustomUsers()
      updateStats()
      return { success: true, user: newUser, password, message: `Usuario ${userData.displayName} creado. Contraseña temporal: ${password}` }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar suscripción de un usuario
   */
  const updateUserSubscription = async (userId, planId, status) => {
    const user = users.value.find(u => u.uid === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const subscription = {
      planId: planId || user.subscription?.planId,
      status: status || user.subscription?.status || 'active',
      startDate: user.subscription?.startDate || new Date(),
      endDate: user.subscription?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }

    if (!db) {
      user.subscription = subscription
      saveCustomUsers()
      updateStats()
      return { success: true, message: `Suscripción actualizada (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        subscription: {
          ...subscription,
          startDate: Timestamp.fromDate(new Date(subscription.startDate)),
          endDate: Timestamp.fromDate(new Date(subscription.endDate))
        }
      })
      user.subscription = subscription
      saveCustomUsers()
      updateStats()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar datos básicos de un usuario (nombre, email)
   */
  const updateUser = async (userId, data) => {
    const user = users.value.find(u => u.uid === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    if (data.displayName !== undefined) user.displayName = data.displayName
    if (data.email !== undefined) user.email = data.email

    saveCustomUsers()
    return { success: true, message: 'Usuario actualizado (modo demo)' }
  }

  /**
   * Blanquear / resetear la contraseña de un usuario
   */
  const resetUserPassword = async (userId) => {
    const user = users.value.find(u => u.uid === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const newPassword = 'temp' + Math.random().toString(36).slice(2, 8)

    if (!db) {
      const authStore = useAuthStore()
      const creds = JSON.parse(localStorage.getItem('mockCredentials') || '{}')
      if (creds[user.email]) {
        creds[user.email] = { ...creds[user.email], password: newPassword, mustChangePassword: true }
        localStorage.setItem('mockCredentials', JSON.stringify(creds))
      }
      return { success: true, password: newPassword, message: `Contraseña restablecida. Nueva contraseña temporal: ${newPassword}` }
    }

    try {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      const { auth } = await import('@/config/firebase')
      if (auth) {
        await sendPasswordResetEmail(auth, user.email)
        return { success: true, message: 'Email de restablecimiento enviado a ' + user.email }
      }
      return { success: false, error: 'Firebase Auth no disponible' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Cambiar el estado de la suscripción de un usuario (cancelar, suspender, reanudar)
   */
  const setUserSubscriptionStatus = async (userId, status) => {
    const user = users.value.find(u => u.uid === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const now = new Date()
    const subscription = user.subscription ? { ...user.subscription } : { planId: null, startDate: now }

    subscription.status = status
    if (status === 'canceled' || status === 'paused') {
      subscription.endDate = now
    } else if (status === 'active') {
      subscription.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }

    if (!db) {
      user.subscription = subscription
      const authStore = useAuthStore()
      const creds = JSON.parse(localStorage.getItem('mockCredentials') || '{}')
      if (creds[user.email]) {
        creds[user.email] = { ...creds[user.email], subscription }
        localStorage.setItem('mockCredentials', JSON.stringify(creds))
      }
      saveCustomUsers()
      updateStats()
      return { success: true, message: `Suscripción ${status === 'canceled' ? 'cancelada' : status === 'paused' ? 'suspendida' : 'reanudada'} (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        subscription: {
          ...subscription,
          startDate: Timestamp.fromDate(new Date(subscription.startDate)),
          endDate: Timestamp.fromDate(new Date(subscription.endDate))
        }
      })
      user.subscription = subscription
      saveCustomUsers()
      updateStats()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar plan de suscripción (precios, features)
   */
  const updateSubscriptionPlan = (planId, updates) => {
    const planIndex = subscriptionPlans.value.findIndex(p => p.id === planId)
    if (planIndex === -1) return { success: false, error: 'Plan no encontrado' }

    const current = subscriptionPlans.value[planIndex]
    const merged = { ...current, ...updates }

    if (db) {
      // Persistir en Firestore
      return updateDoc(doc(db, PLANS_COLLECTION, planId), merged)
        .then(() => {
          console.log('✅ Plan actualizado en Firestore:', planId, updates)
          return { success: true }
        })
        .catch(err => {
          console.error('❌ Error actualizando plan en Firestore:', err)
          return { success: false, error: err.message }
        })
    } else {
      // Local fallback
      const updatedPlans = [...subscriptionPlans.value]
      updatedPlans[planIndex] = merged
      subscriptionPlans.value = updatedPlans
      savePlansToStorage(subscriptionPlans.value)
      console.log('✅ Plan actualizado (localStorage):', planId, updates)
      return { success: true }
    }
  }

  /**
   * Actualizar configuración de pagos (MercadoPago)
   */
  const updatePaymentSettings = async (settings) => {
    try {
      // TODO: En producción, enviar al backend de forma segura
      // NUNCA exponer el Access Token en el frontend
      
      // Por ahora, guardar en localStorage para desarrollo
      paymentSettings.value = settings
      savePaymentSettingsToStorage(settings)
      
      return { success: true, message: 'Configuración guardada correctamente' }
    } catch (err) {
      console.error('Error updating payment settings:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar estadísticas generales
   */
  const updateStats = () => {
    stats.value = {
      totalUsers: users.value.length,
      totalProperties: properties.value.length,
      activeSubscriptions: users.value.filter(u => u.subscription?.status === 'active').length,
      monthlyRevenue: Object.values(revenueByPlan.value).reduce((sum, rev) => sum + rev, 0),
      pendingApprovals: properties.value.filter(p => p.status === 'pending').length,
      totalBookings: users.value.reduce((sum, u) => sum + (u.stats?.bookings || 0), 0)
    }
  }

  /**
   * Cargar todos los datos iniciales
   */
  const loadAllData = async () => {
    loading.value = true
    await Promise.all([
      fetchUsers(),
      fetchAllProperties()
    ])
    loading.value = false
  }

  return {
    // State
    users,
    properties,
    subscriptions,
    subscriptionPlans,
    paymentSettings,
    platformSettings,
    stats,
    loading,
    error,

    // Computed
    activeUsers,
    pendingProperties,
    revenueByPlan,

    // Actions
    fetchUsers,
    fetchAllProperties,
    updatePropertyStatus,
    deleteProperty,
    updateUserRole,
    toggleUserStatus,
    createUser,
    updateUser,
    updateUserSubscription,
    resetUserPassword,
    setUserSubscriptionStatus,
    updateSubscriptionPlan,
    updatePaymentSettings,
    updateStats,
    loadAllData,
    initPlans,
    initPlatformSettings,
    updatePlatformSettings
  }
})
