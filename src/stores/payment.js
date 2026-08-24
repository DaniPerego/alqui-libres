import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useAdminStore } from './admin'
import { apiGet, apiPost, apiPatch, isApiAvailable } from '@/services/api'

export const usePaymentStore = defineStore('payment', () => {
  const authStore = useAuthStore()
  const adminStore = useAdminStore()

  // State
  const loading = ref(false)
  const error = ref(null)
  const currentSubscription = ref(null)
  const paymentMethods = ref([])
  const invoices = ref([])

  // MercadoPago client public key (VITE_ only; the access token stays on the
  // server and is never bundled).
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

  // Normalizes a backend subscription row (Prisma shape) onto the store shape.
  function normalizeSubscription(sub) {
    if (!sub) return null
    return {
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      status: sub.status,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      autoRenew: sub.autoRenew,
      paymentMethod: sub.paymentMethod || 'mercadopago',
      lastPaymentDate: sub.lastPaymentDate || null
    }
  }

  // Builds the demo subscription from the mock user (demo mode fallback).
  function demoSubscription() {
    const u = authStore.user
    if (!u?.subscription) return null
    return {
      id: 'sub_' + (u.uid || u.id),
      userId: u.uid || u.id,
      planId: u.subscription.planId,
      status: u.subscription.status,
      startedAt: u.subscription.startedAt,
      expiresAt: u.subscription.expiresAt,
      autoRenew: u.subscription.autoRenew || true,
      paymentMethod: 'mercadopago',
      lastPaymentDate: u.subscription.lastPaymentDate || new Date().toISOString()
    }
  }

  // Keeps the auth-store subscription in sync with the backend source of truth.
  function syncAuthSubscription(sub) {
    if (!authStore.user) return
    authStore.user.subscription = sub
      ? {
          planId: sub.planId,
          status: sub.status,
          startedAt: sub.startedAt,
          expiresAt: sub.expiresAt,
          autoRenew: sub.autoRenew,
          lastPaymentDate: sub.lastPaymentDate
        }
      : null
  }

  // Maps backend payment status onto the invoice status used by the UI.
  function mapInvoiceStatus(status) {
    if (status === 'approved') return 'paid'
    if (status === 'pending') return 'pending'
    return 'failed'
  }

  // Maps an api.js error contract onto a user-facing message for createPreference.
  function mapPreferenceError(apiError) {
    switch (apiError?.code) {
      case 'CONFLICT':
        return 'Ya tenés una suscripción activa para este plan'
      case 'SERVICE_UNAVAILABLE':
        return 'MercadoPago no está configurado en el servidor'
      case 'UNAUTHORIZED':
        return 'Sesión expirada. Iniciá sesión de nuevo.'
      case 'NOT_FOUND':
        return 'Plan no encontrado'
      default:
        return apiError?.message || 'Error al crear la preferencia de pago'
    }
  }

  // Maps an api.js error contract onto a user-facing message for changePlan.
  function mapChangePlanError(apiError) {
    switch (apiError?.code) {
      case 'CONFLICT':
        return apiError?.message === 'Subscription is already on this plan'
          ? 'Ya estás suscripto a este plan'
          : 'No se puede cambiar la suscripción en este estado'
      case 'NOT_FOUND':
        return 'Plan no encontrado'
      case 'UNAUTHORIZED':
        return 'Sesión expirada. Iniciá sesión de nuevo.'
      default:
        return apiError?.message || 'Error al cambiar de plan'
    }
  }

  // Maps an api.js error contract onto a user-facing message for reactivate.
  function mapReactivateError(apiError) {
    switch (apiError?.code) {
      case 'CONFLICT':
        return 'No se puede reactivar una suscripción que no está cancelada'
      case 'NOT_FOUND':
        return 'Suscripción no encontrada'
      case 'UNAUTHORIZED':
        return 'Sesión expirada. Iniciá sesión de nuevo.'
      default:
        return apiError?.message || 'Error al reactivar suscripción'
    }
  }

  // Demo-mode mock preference (kept only when the API is unavailable).
  function buildMockPreference(plan) {
    return {
      id: 'pref_' + Date.now(),
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_' + plan.id,
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_' + plan.id,
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
      external_reference: `${authStore.user?.uid || 'demo'}_${plan.id}_${Date.now()}`
    }
  }

  // Actions
  const fetchCurrentSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      if (isApiAvailable()) {
        const result = await apiGet('/subscriptions/mine')
        if (result.success) {
          const sub = result.data?.data || null
          currentSubscription.value = normalizeSubscription(sub)
          syncAuthSubscription(sub)
          return { success: true, data: currentSubscription.value, error: null }
        }
        // API error: keep the UI alive with the demo subscription, but surface
        // the real error so callers can distinguish demo from failure.
        currentSubscription.value = demoSubscription()
        return { success: false, data: currentSubscription.value, error: result.error }
      }

      // Demo mode: read the subscription attached to the mock user.
      await new Promise(resolve => setTimeout(resolve, 500))
      currentSubscription.value = demoSubscription()
      return { success: true, data: currentSubscription.value, error: null }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      error.value = 'Error al cargar suscripción'
      currentSubscription.value = demoSubscription()
      return {
        success: false,
        data: currentSubscription.value,
        error: { code: 'UNKNOWN', message: err.message }
      }
    } finally {
      loading.value = false
    }
  }

  const createPreference = async (planId) => {
    loading.value = true
    error.value = null

    try {
      if (isApiAvailable()) {
        const result = await apiPost('/mercadopago/preference', { planId })
        if (!result.success) {
          throw new Error(mapPreferenceError(result.error))
        }
        return {
          id: result.data?.id,
          init_point: result.data?.init_point,
          sandbox_init_point: result.data?.sandbox_init_point,
          external_reference: result.data?.external_reference
        }
      }

      // Demo fallback (no API): build a local mock preference.
      const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
      if (!plan) throw new Error('Plan no encontrado')
      await new Promise(resolve => setTimeout(resolve, 800))
      return buildMockPreference(plan)
    } catch (err) {
      console.error('Error creating preference:', err)
      error.value = err.message || 'Error al crear preferencia de pago'
      throw err
    } finally {
      loading.value = false
    }
  }

  const subscribeToPlan = async (planId) => {
    loading.value = true
    error.value = null

    try {
      if (isApiAvailable()) {
        const preference = await createPreference(planId)
        // Production uses the live checkout; development uses the sandbox URL
        // (the server already sets back_urls, so no origin is needed here).
        const checkoutUrl = import.meta.env.PROD
          ? preference.init_point
          : (preference.sandbox_init_point || preference.init_point)
        window.location.href = checkoutUrl
        return { success: true, message: 'Redirigiendo a MercadoPago...' }
      }

      // Demo mode (no credentials): simulate a successful payment.
      await simulatePaymentSuccess(planId)
      return { success: true, message: 'Suscripción activada (modo desarrollo)' }
    } catch (err) {
      console.error('Error subscribing:', err)
      error.value = err.message || 'Error al procesar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Demo/dev-only: simulates a successful payment locally. Real payments are
  // processed by the MercadoPago webhook and confirmed by PaymentResult via
  // /api/payments/status polling.
  const simulatePaymentSuccess = async (planId) => {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

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

    // When the API is available the local simulation is kept as-is (a real
    // subscription only appears after the webhook fires); otherwise refresh
    // from the demo user.
    if (isApiAvailable()) {
      currentSubscription.value = demoSubscription()
    } else {
      await fetchCurrentSubscription()
    }
  }

  const changePlan = async (newPlanId) => {
    if (!currentSubscription.value) {
      return subscribeToPlan(newPlanId)
    }

    loading.value = true
    error.value = null

    try {
      // Demo subscriptions carry a `sub_` id and must never be PATCHed to the
      // backend. Only real rows (uuid) go through the API.
      const realId = currentSubscription.value.id && !currentSubscription.value.id.startsWith('sub_')
        ? currentSubscription.value.id
        : null

      if (isApiAvailable() && realId) {
        const result = await apiPatch(`/subscriptions/${realId}`, {
          status: 'plan_change',
          planId: newPlanId,
        })
        if (!result.success) {
          throw new Error(mapChangePlanError(result.error))
        }
        // The subscription is now pending on the new plan; a fresh MercadoPago
        // payment (single-payment model) is required to reactivate it, so the
        // frontend redirects to the checkout. No local activation here.
        currentSubscription.value = normalizeSubscription(result.data)
        syncAuthSubscription(result.data)
        return { success: true, message: 'Plan cambiado. Completá el pago para activarlo.' }
      }

      // Demo fallback (no API, or a local `sub_` row): update the plan locally.
      await new Promise(resolve => setTimeout(resolve, 1000))

      currentSubscription.value.planId = newPlanId

      if (authStore.user?.subscription) {
        authStore.user.subscription.planId = newPlanId
      }

      return { success: true, message: 'Plan cambiado. Completá el pago para activarlo.' }
    } catch (err) {
      console.error('Error changing plan:', err)
      error.value = err.message || 'Error al cambiar de plan'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      // Demo subscriptions carry a `sub_` id and must never be PATCHed to the
      // backend. Only real rows (uuid) go through the API.
      const realId = currentSubscription.value?.id && !currentSubscription.value.id.startsWith('sub_')
        ? currentSubscription.value.id
        : null
      if (isApiAvailable() && realId) {
        const result = await apiPatch(`/subscriptions/${realId}`, { status: 'cancelled' })
        if (!result.success) {
          throw new Error(result.error?.message || 'Error al cancelar suscripción')
        }
      }

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
      error.value = err.message || 'Error al cancelar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reactivateSubscription = async () => {
    loading.value = true
    error.value = null

    try {
      // Demo subscriptions carry a `sub_` id and must never be PATCHed to the
      // backend. Only real rows (uuid) go through the API.
      const realId = currentSubscription.value?.id && !currentSubscription.value.id.startsWith('sub_')
        ? currentSubscription.value.id
        : null

      if (isApiAvailable() && realId) {
        const result = await apiPatch(`/subscriptions/${realId}`, { status: 'reactivate' })
        if (!result.success) {
          throw new Error(mapReactivateError(result.error))
        }
        // The subscription is now pending; a fresh MercadoPago payment is
        // required to activate it, so the frontend redirects to checkout.
        currentSubscription.value = normalizeSubscription(result.data)
        syncAuthSubscription(result.data)
        return { success: true, message: 'Suscripción reactivada. Completá el pago para activarla.' }
      }

      // Demo fallback (no API, or a local `sub_` row): simulate locally.
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
      error.value = err.message || 'Error al reactivar suscripción'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchInvoices = async () => {
    loading.value = true
    error.value = null

    try {
      if (isApiAvailable()) {
        const result = await apiGet('/payments')
        if (!result.success) {
          throw new Error(result.error?.message || 'Error al cargar facturas')
        }
        const payments = result.data?.data || []
        invoices.value = payments.map(p => ({
          id: p.id,
          date: p.createdAt,
          amount: p.amount,
          status: mapInvoiceStatus(p.status),
          planName: p.planName,
          pdfUrl: '#'
        }))
        return { success: true, data: invoices.value, error: null }
      }

      // Demo fallback.
      await new Promise(resolve => setTimeout(resolve, 500))
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
      return { success: true, data: invoices.value, error: null }
    } catch (err) {
      console.error('Error fetching invoices:', err)
      error.value = 'Error al cargar facturas'
      return { success: false, data: invoices.value, error: { code: 'UNKNOWN', message: err.message } }
    } finally {
      loading.value = false
    }
  }

  const addPaymentMethod = async (cardData) => {
    loading.value = true
    error.value = null

    try {
      // TODO: tokenize with MercadoPago and store the method on the backend.
      // Kept as a local demo fallback for this batch.
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