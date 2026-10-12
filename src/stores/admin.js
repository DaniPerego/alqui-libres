import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/services/api'

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

  // Polling state
  const pollingTimer = ref(null)
  const pollingIntervalMs = ref(30000)

  // Settings doc id (kept for localStorage key consistency)
  const SETTINGS_DOC_ID = 'general'

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

  // Normalize API user (Prisma/API shape -> internal Firebase-like shape)
  const normalizeUser = (u) => {
    if (!u) return u
    return {
      ...u,
      uid: u.uid || u.id,
      id: u.id || u.uid,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      subscription: u.subscription
        ? {
            ...u.subscription,
            startDate: u.subscription.startDate ? new Date(u.subscription.startDate) : new Date(),
            endDate: u.subscription.endDate ? new Date(u.subscription.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        : null
    }
  }

  // Normalize API property (flat Prisma columns -> nested internal shape)
  const normalizeProperty = (p) => {
    if (!p) return p
    return {
      ...p,
      location: {
        city: p.locationCity || p.location?.city,
        state: p.locationState || p.location?.state,
        country: p.locationCountry || p.location?.country || 'Argentina',
        address: p.locationAddress || p.location?.address,
        postalCode: p.locationPostalCode || p.location?.postalCode,
        coordinates: p.locationCoordinates || p.location?.coordinates
      },
      capacity: {
        guests: p.capacityGuests ?? p.capacity?.guests,
        bedrooms: p.capacityBedrooms ?? p.capacity?.bedrooms,
        beds: p.capacityBeds ?? p.capacity?.beds,
        bathrooms: p.capacityBathrooms ?? p.capacity?.bathrooms
      },
      pricing: {
        basePrice: p.pricingBasePrice ?? p.pricing?.basePrice,
        cleaningFee: p.pricingCleaningFee ?? p.pricing?.cleaningFee,
        currency: p.pricingCurrency || p.pricing?.currency || 'ARS',
        weeklyDiscount: p.pricingWeeklyDiscount ?? p.pricing?.weeklyDiscount,
        monthlyDiscount: p.pricingMonthlyDiscount ?? p.pricing?.monthlyDiscount
      },
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
    }
  }

  // Polling / refetch
  const refetch = async () => {
    await Promise.all([
      fetchUsers(),
      fetchAllProperties(),
      initPlans(),
      initPlatformSettings(),
      initSubscriptions()
    ])
  }

  const startPolling = (intervalMs = 30000) => {
    stopPolling()
    pollingIntervalMs.value = intervalMs
    pollingTimer.value = setInterval(() => {
      refetch().catch(err => console.warn('Error en polling admin:', err))
    }, intervalMs)
    console.log(`🔄 Polling admin iniciado (${intervalMs}ms)`)
  }

  const stopPolling = () => {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
      console.log('🛑 Polling admin detenido')
    }
  }

  // Plans initialization (API-backed with localStorage fallback)
  const initPlans = async () => {
    try {
      const result = await apiGet('/plans')
      if (!result.success) {
        throw new Error(result.error?.message || 'Error cargando planes')
      }

      let plans = result.data?.data || []

      if (plans.length === 0) {
        await Promise.all(defaultPlans.map(p => apiPatch(`/plans/${p.id}`, p)))
        plans = [...defaultPlans]
        console.log('🌱 Planes por defecto creados en la API')
      }

      subscriptionPlans.value = plans
      savePlansToStorage(plans)
      console.log('📂 Planes cargados desde API:', plans)
      return { success: true }
    } catch (e) {
      console.warn('No se pudieron cargar planes de la API, usando localStorage:', e?.message || e)
      subscriptionPlans.value = loadPlansFromStorage()
      return { success: false, error: e.message }
    }
  }

  // Platform settings initialization
  const initPlatformSettings = async () => {
    try {
      const result = await apiGet('/platform-settings')
      if (!result.success) {
        throw new Error(result.error?.message || 'Error cargando settings')
      }
      platformSettings.value = { ...platformSettings.value, ...result.data }
      localStorage.setItem('platformSettings', JSON.stringify(platformSettings.value))
      console.log('📂 Settings cargados desde API:', platformSettings.value)
      return { success: true }
    } catch (e) {
      console.warn('No se pudieron cargar settings de la API, usando localStorage:', e?.message || e)
      const stored = localStorage.getItem('platformSettings')
      if (stored) {
        platformSettings.value = { ...platformSettings.value, ...JSON.parse(stored) }
      }
      return { success: false, error: e.message }
    }
  }

  const updatePlatformSettings = async (updates) => {
    try {
      const result = await apiPatch('/platform-settings', updates)
      if (!result.success) {
        throw new Error(result.error?.message || 'Error guardando settings')
      }
      platformSettings.value = { ...platformSettings.value, ...result.data }
      localStorage.setItem('platformSettings', JSON.stringify(platformSettings.value))
      console.log('✅ Settings guardados en API:', updates)
      return { success: true }
    } catch (err) {
      console.error('❌ Error guardando settings en API:', err)
      return { success: false, error: err.message }
    }
  }

  // Subscriptions
  const initSubscriptions = async () => {
    try {
      const result = await apiGet('/subscriptions')
      if (!result.success) {
        throw new Error(result.error?.message || 'Error cargando suscripciones')
      }
      subscriptions.value = result.data?.data || []
      return { success: true }
    } catch (e) {
      console.warn('No se pudieron cargar suscripciones de la API:', e?.message || e)
      subscriptions.value = []
      return { success: false, error: e.message }
    }
  }

  // Actions

  /**
   * Cargar todos los usuarios
   */
  const fetchUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await apiGet('/users')
      if (!result.success) {
        throw new Error(result.error?.message || 'Error fetching users')
      }

      users.value = (result.data?.data || []).map(normalizeUser)
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
   * Cargar todas las propiedades
   */
  const fetchAllProperties = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await apiGet('/properties', { scope: 'all' })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error fetching properties')
      }

      properties.value = (result.data?.data || []).map(normalizeProperty)
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
    try {
      const result = await apiPatch(`/properties/${propertyId}`, {
        status,
        isActive: status === 'active'
      })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating property')
      }

      const property = properties.value.find(p => p.id === propertyId)
      if (property) {
        property.status = status
        property.isActive = status === 'active'
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
    try {
      const result = await apiDelete(`/properties/${propertyId}`)
      if (!result.success) {
        throw new Error(result.error?.message || 'Error deleting property')
      }

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
    try {
      const result = await apiPatch(`/users/${userId}`, { role })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating user role')
      }

      const user = users.value.find(u => u.uid === userId || u.id === userId)
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
    try {
      const result = await apiPatch(`/users/${userId}`, { isActive })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error toggling user status')
      }

      const user = users.value.find(u => u.uid === userId || u.id === userId)
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
   * Eliminar un usuario
   */
  const deleteUser = async (userId) => {
    try {
      const result = await apiDelete(`/users/${userId}`)
      if (!result.success) {
        throw new Error(result.error?.message || 'Error deleting user')
      }

      const index = users.value.findIndex(u => u.uid === userId || u.id === userId)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
      saveCustomUsers()
      updateStats()
      return { success: true }
    } catch (err) {
      console.error('Error deleting user:', err)
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

    try {
      const result = await apiPost('/users', {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        isActive: newUser.isActive,
        password
      })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error creating user')
      }

      const created = normalizeUser(result.data?.user)

      if (userData.planId && created) {
        const subscription = {
          planId: userData.planId,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
        const subResult = await apiPatch(`/users/${created.id}`, { subscription })
        if (subResult.success && subResult.data) {
          created.subscription = normalizeUser(subResult.data).subscription
        }
      }

      const returnedPassword = result.data?.tempPassword || password
      users.value.push(created)
      saveCustomUsers()
      updateStats()
      return { success: true, user: created, password: returnedPassword, message: `Usuario ${userData.displayName} creado. Contraseña temporal: ${returnedPassword}` }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Actualizar suscripción de un usuario
   */
  const updateUserSubscription = async (userId, planId, status) => {
    const user = users.value.find(u => u.uid === userId || u.id === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const subscription = {
      planId: planId || user.subscription?.planId,
      status: status || user.subscription?.status || 'active',
      startDate: user.subscription?.startDate || new Date(),
      endDate: user.subscription?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }

    try {
      const result = await apiPatch(`/users/${userId}`, { subscription })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating subscription')
      }
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
    const user = users.value.find(u => u.uid === userId || u.id === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    try {
      const payload = {}
      if (data.displayName !== undefined) payload.displayName = data.displayName
      if (data.email !== undefined) payload.email = data.email
      const result = await apiPatch(`/users/${userId}`, payload)
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating user')
      }
      if (data.displayName !== undefined) user.displayName = data.displayName
      if (data.email !== undefined) user.email = data.email
      saveCustomUsers()
      return { success: true, message: 'Usuario actualizado' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Blanquear / resetear la contraseña de un usuario
   */
  const resetUserPassword = async (userId) => {
    const user = users.value.find(u => u.uid === userId || u.id === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    try {
      const authStore = useAuthStore()
      const result = await authStore.resetPassword(user.email)
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Cambiar el estado de la suscripción de un usuario (cancelar, suspender, reanudar)
   */
  const setUserSubscriptionStatus = async (userId, status) => {
    const user = users.value.find(u => u.uid === userId || u.id === userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const now = new Date()
    const subscription = user.subscription ? { ...user.subscription } : { planId: null, startDate: now }

    subscription.status = status
    if (status === 'canceled' || status === 'paused') {
      subscription.endDate = now
    } else if (status === 'active') {
      subscription.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }

    try {
      const result = await apiPatch(`/users/${userId}`, { subscription })
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating subscription status')
      }
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
  const updateSubscriptionPlan = async (planId, updates) => {
    const planIndex = subscriptionPlans.value.findIndex(p => p.id === planId)
    if (planIndex === -1) return { success: false, error: 'Plan no encontrado' }

    const current = subscriptionPlans.value[planIndex]
    const merged = { ...current, ...updates }

    try {
      const result = await apiPatch(`/plans/${planId}`, merged)
      if (!result.success) {
        throw new Error(result.error?.message || 'Error updating plan')
      }
      const updatedPlans = [...subscriptionPlans.value]
      updatedPlans[planIndex] = result.data || merged
      subscriptionPlans.value = updatedPlans
      savePlansToStorage(subscriptionPlans.value)
      console.log('✅ Plan actualizado en API:', planId, updates)
      return { success: true }
    } catch (err) {
      console.error('❌ Error actualizando plan en API:', err)
      return { success: false, error: err.message }
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
    pollingIntervalMs,

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
    deleteUser,
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
    initSubscriptions,
    initPlatformSettings,
    updatePlatformSettings,
    refetch,
    startPolling,
    stopPolling
  }
})
