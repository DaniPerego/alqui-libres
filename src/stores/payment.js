import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useAdminStore } from './admin'

export const usePaymentStore = defineStore('payment', () => {
  const authStore = useAuthStore()
  const adminStore = useAdminStore()

  // State
  const loading = ref(false)
  const error = ref(null)
  const currentSubscription = ref(null)
  const paymentMethods = ref([])
  const invoices = ref([])

  // MercadoPago config (mock - en producción usar variables de entorno)
  const mercadopagoPublicKey = ref(import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-your-public-key')
  
  // Computed
  const hasActiveSubscription = computed(() => {
    return currentSubscription.value && 
           currentSubscription.value.status === 'active' &&
           new Date(currentSubscription.value.expiresAt) > new Date()
  })

  const currentPlan = computed(() => {
    if (!currentSubscription.value) return null
    return adminStore.subscriptionPlans.find(
      p => p.id === currentSubscription.value.planId
    )
  })

  const daysUntilRenewal = computed(() => {
    if (!currentSubscription.value?.expiresAt) return 0
    const today = new Date()
    const expiry = new Date(currentSubscription.value.expiresAt)
    const diff = expiry - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  })

  // Actions
  const fetchCurrentSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: En producción, fetch desde Firestore
      // const subscriptionDoc = await getDoc(doc(db, 'subscriptions', authStore.user.uid))
      
      // Mock data para desarrollo
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (authStore.user?.subscription) {
        currentSubscription.value = {
          id: 'sub_' + authStore.user.uid,
          userId: authStore.user.uid,
          planId: authStore.user.subscription.planId,
          status: authStore.user.subscription.status,
          startedAt: authStore.user.subscription.startedAt,
          expiresAt: authStore.user.subscription.expiresAt,
          autoRenew: authStore.user.subscription.autoRenew || true,
          paymentMethod: 'mercadopago',
          lastPaymentDate: authStore.user.subscription.lastPaymentDate || new Date().toISOString()
        }
      } else {
        currentSubscription.value = null
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      error.value = 'Error al cargar suscripción'
    } finally {
      loading.value = false
    }
  }

  const createPreference = async (planId) => {
    loading.value = true
    error.value = null

    try {
      const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
      if (!plan) throw new Error('Plan no encontrado')

      // TODO: En producción, crear preferencia real en backend
      // const response = await fetch('/api/mercadopago/create-preference', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ planId, userId: authStore.user.uid })
      // })
      // const data = await response.json()
      
      // Mock preference para desarrollo
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockPreference = {
        id: 'pref_' + Date.now(),
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_' + planId,
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_' + planId,
        items: [{
          title: `Suscripción ${plan.name} - AlquiLibres`,
          description: plan.features.join(', '),
          quantity: 1,
          unit_price: plan.price,
          currency_id: 'ARS'
        }],
        back_urls: {
          success: window.location.origin + '/panel/payment-result?status=success',
          failure: window.location.origin + '/panel/payment-result?status=failure',
          pending: window.location.origin + '/panel/payment-result?status=pending'
        },
        auto_return: 'approved',
        statement_descriptor: 'ALQUILIBRES',
        external_reference: `${authStore.user.uid}_${planId}_${Date.now()}`
      }

      return mockPreference

    } catch (err) {
      console.error('Error creating preference:', err)
      error.value = 'Error al crear preferencia de pago'
      throw err
    } finally {
      loading.value = false
    }
  }

  const subscribeToPlan = async (planId) => {
    loading.value = true
    error.value = null

    try {
      const preference = await createPreference(planId)
      
      // Redirigir a MercadoPago checkout
      // En desarrollo usamos sandbox, en producción usar init_point
      const checkoutUrl = import.meta.env.PROD 
        ? preference.init_point 
        : preference.sandbox_init_point

      // Simular pago exitoso en desarrollo (sin redirección real)
      if (import.meta.env.DEV) {
        await simulatePaymentSuccess(planId)
        return { success: true, message: 'Suscripción activada (modo desarrollo)' }
      }

      // En producción, redirigir a MercadoPago
      window.location.href = checkoutUrl

    } catch (err) {
      console.error('Error subscribing:', err)
      error.value = 'Error al procesar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  const simulatePaymentSuccess = async (planId) => {
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1500))

    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    // Actualizar suscripción del usuario en authStore
    if (authStore.user) {
      authStore.user.subscription = {
        planId,
        status: 'active',
        startedAt: startDate.toISOString(),
        expiresAt: expiryDate.toISOString(),
        autoRenew: true,
        lastPaymentDate: startDate.toISOString()
      }
    }

    // Actualizar currentSubscription
    await fetchCurrentSubscription()
  }

  const changePlan = async (newPlanId) => {
    if (!currentSubscription.value) {
      return subscribeToPlan(newPlanId)
    }

    loading.value = true
    error.value = null

    try {
      // TODO: En producción, actualizar en backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      currentSubscription.value.planId = newPlanId
      
      if (authStore.user?.subscription) {
        authStore.user.subscription.planId = newPlanId
      }

      return { success: true, message: 'Plan actualizado correctamente' }

    } catch (err) {
      console.error('Error changing plan:', err)
      error.value = 'Error al cambiar de plan'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: En producción, cancelar en backend y MercadoPago
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (currentSubscription.value) {
        currentSubscription.value.status = 'cancelled'
        currentSubscription.value.autoRenew = false
      }

      if (authStore.user?.subscription) {
        authStore.user.subscription.status = 'cancelled'
        authStore.user.subscription.autoRenew = false
      }

      return { success: true, message: 'Suscripción cancelada. Tendrás acceso hasta la fecha de vencimiento.' }

    } catch (err) {
      console.error('Error cancelling subscription:', err)
      error.value = 'Error al cancelar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reactivateSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (currentSubscription.value) {
        currentSubscription.value.status = 'active'
        currentSubscription.value.autoRenew = true
      }

      if (authStore.user?.subscription) {
        authStore.user.subscription.status = 'active'
        authStore.user.subscription.autoRenew = true
      }

      return { success: true, message: 'Suscripción reactivada correctamente' }

    } catch (err) {
      console.error('Error reactivating subscription:', err)
      error.value = 'Error al reactivar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchInvoices = async () => {
    loading.value = true
    error.value = null

    try {
      // TODO: Fetch real desde backend
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock invoices
      invoices.value = [
        {
          id: 'inv_001',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: currentPlan.value?.price || 24999,
          status: 'paid',
          planName: currentPlan.value?.name || 'Plan Profesional',
          pdfUrl: '#'
        }
      ]

    } catch (err) {
      console.error('Error fetching invoices:', err)
      error.value = 'Error al cargar facturas'
    } finally {
      loading.value = false
    }
  }

  const addPaymentMethod = async (cardData) => {
    loading.value = true
    error.value = null

    try {
      // TODO: Tokenizar con MercadoPago y guardar en backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newMethod = {
        id: 'pm_' + Date.now(),
        type: 'card',
        brand: cardData.brand || 'visa',
        lastFour: cardData.number.slice(-4),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        isDefault: paymentMethods.value.length === 0
      }

      paymentMethods.value.push(newMethod)

      return { success: true, message: 'Método de pago agregado' }

    } catch (err) {
      console.error('Error adding payment method:', err)
      error.value = 'Error al agregar método de pago'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    currentSubscription,
    paymentMethods,
    invoices,
    mercadopagoPublicKey,
    
    // Computed
    hasActiveSubscription,
    currentPlan,
    daysUntilRenewal,
    
    // Actions
    fetchCurrentSubscription,
    createPreference,
    subscribeToPlan,
    simulatePaymentSuccess,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    fetchInvoices,
    addPaymentMethod
  }
})
