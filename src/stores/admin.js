import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/config/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore'

export const useAdminStore = defineStore('admin', () => {
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
      const stored = localStorage.getItem('subscriptionPlans')
      if (stored) {
        const plans = JSON.parse(stored)
        console.log('📂 Planes cargados desde localStorage:', plans)
        return plans
      } else {
        console.log('🆕 Usando planes por defecto (no hay datos guardados)')
        return defaultPlans
      }
    } catch (error) {
      console.error('❌ Error loading plans from storage:', error)
      return defaultPlans
    }
  }

  // Save plans to localStorage
  const savePlansToStorage = (plans) => {
    try {
      localStorage.setItem('subscriptionPlans', JSON.stringify(plans))
      console.log('💾 Planes guardados en localStorage:', plans)
    } catch (error) {
      console.error('❌ Error saving plans to storage:', error)
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
      const count = subscriptions.value.filter(s => s.planId === plan.id && s.status === 'active').length
      revenue[plan.name] = count * plan.price
    })
    return revenue
  })

  // Actions

  /**
   * Cargar todos los usuarios desde Firestore
   */
  const fetchUsers = async () => {
    if (!db) {
      // Modo demo con datos mock
      users.value = [
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
      const { mockProperties } = await import('@/data/mockData')
      properties.value = mockProperties.map(p => ({
        ...p,
        status: p.status || 'active',
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
      return { success: true, message: `Usuario actualizado a ${role} (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { role })

      // Actualizar en estado local
      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.role = role
      }

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
      return { success: true, message: `Usuario ${isActive ? 'activado' : 'suspendido'} (modo demo)` }
    }

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { isActive })

      // Actualizar en estado local
      const user = users.value.find(u => u.uid === userId)
      if (user) {
        user.isActive = isActive
      }

      return { success: true }
    } catch (err) {
      console.error('Error toggling user status:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar plan de suscripción (precios, features)
   */
  const updateSubscriptionPlan = (planId, updates) => {
    const planIndex = subscriptionPlans.value.findIndex(p => p.id === planId)
    if (planIndex !== -1) {
      // Crear un nuevo array completo para forzar la reactividad
      const updatedPlans = [...subscriptionPlans.value]
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        ...updates
      }
      subscriptionPlans.value = updatedPlans
      
      // Guardar en localStorage
      savePlansToStorage(subscriptionPlans.value)
      
      console.log('✅ Plan actualizado:', planId, updates)
      console.log('📦 Planes actuales:', JSON.parse(JSON.stringify(subscriptionPlans.value)))
      
      return { success: true }
    }
    return { success: false, error: 'Plan no encontrado' }
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
    updateSubscriptionPlan,
    updatePaymentSettings,
    updateStats,
    loadAllData
  }
})
