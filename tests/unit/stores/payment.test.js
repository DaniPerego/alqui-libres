// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePaymentStore } from '@/stores/payment.js'
import { useAuthStore } from '@/stores/auth.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch
}))

const API_SUBSCRIPTION = {
  id: 'uuid-sub-1',
  userId: 'owner001',
  planId: 'pro',
  planName: 'Plan Profesional',
  status: 'active',
  startedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-08-01T00:00:00.000Z',
  autoRenew: true,
  paymentMethod: 'mercadopago',
  lastPaymentDate: '2026-01-01T00:00:00.000Z'
}

function loginDemoUser() {
  const authStore = useAuthStore()
  authStore.user = {
    uid: 'owner001',
    id: 'owner001',
    email: 'usuario@alquilibres.com',
    displayName: 'Propietario Demo',
    role: 'owner',
    subscription: {
      planId: 'pro',
      status: 'active',
      startedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-08-01T00:00:00.000Z',
      autoRenew: true,
      lastPaymentDate: '2026-01-01T00:00:00.000Z'
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('payment store (native API)', () => {
  beforeEach(() => {
    loginDemoUser()
  })

  it('fetchCurrentSubscription llama /subscriptions/mine y normaliza', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    const store = usePaymentStore()

    const result = await store.fetchCurrentSubscription()

    expect(mocks.apiGet).toHaveBeenCalledWith('/subscriptions/mine')
    expect(result.success).toBe(true)
    expect(store.currentSubscription.id).toBe('uuid-sub-1')
    expect(store.currentSubscription.planId).toBe('pro')
    expect(store.currentSubscription.status).toBe('active')
    // auth store se mantiene en sync con la fuente de verdad del backend.
    expect(useAuthStore().user.subscription.planId).toBe('pro')
  })

  it('fetchCurrentSubscription sin suscripcion en backend -> null', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: null } })
    const store = usePaymentStore()

    const result = await store.fetchCurrentSubscription()

    expect(result.success).toBe(true)
    expect(store.currentSubscription).toBeNull()
  })

  it('fetchCurrentSubscription con error de API -> fallback demo + success false', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: false, error: { code: 'INTERNAL', message: 'Boom' } })
    const store = usePaymentStore()

    const result = await store.fetchCurrentSubscription()

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('INTERNAL')
    // Fallback demo: la suscripcion local se mantiene para no romper la UI.
    expect(store.currentSubscription.planId).toBe('pro')
  })

  it('createPreference postea /mercadopago/preference y devuelve urls', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'pref-api-1',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-api-1',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-api-1',
        external_reference: 'uuid-sub-1'
      }
    })
    const store = usePaymentStore()

    const preference = await store.createPreference('pro')

    expect(mocks.apiPost).toHaveBeenCalledWith('/mercadopago/preference', { planId: 'pro' })
    expect(preference.id).toBe('pref-api-1')
    expect(preference.external_reference).toBe('uuid-sub-1')
  })

  it('createPreference 409 -> mensaje claro de suscripcion activa', async () => {
    mocks.apiPost.mockResolvedValueOnce({ success: false, error: { code: 'CONFLICT', message: 'x' } })
    const store = usePaymentStore()

    await expect(store.createPreference('pro')).rejects.toThrow('Ya tenés una suscripción activa para este plan')
  })

  it('createPreference 503 -> mensaje de MP no configurado', async () => {
    mocks.apiPost.mockResolvedValueOnce({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'x' } })
    const store = usePaymentStore()

    await expect(store.createPreference('pro')).rejects.toThrow('MercadoPago no está configurado en el servidor')
  })

  it('createPreference 401 -> mensaje de sesion expirada', async () => {
    mocks.apiPost.mockResolvedValueOnce({ success: false, error: { code: 'UNAUTHORIZED', message: 'x' } })
    const store = usePaymentStore()

    await expect(store.createPreference('pro')).rejects.toThrow('Sesión expirada')
  })

  it('cancelSubscription PATCHea /subscriptions/{id} y actualiza estado local', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: { id: 'uuid-sub-1', status: 'cancelled', autoRenew: false }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    const result = await store.cancelSubscription()

    expect(mocks.apiPatch).toHaveBeenCalledWith('/subscriptions/uuid-sub-1', { status: 'cancelled' })
    expect(result.success).toBe(true)
    expect(store.currentSubscription.status).toBe('cancelled')
    expect(store.currentSubscription.autoRenew).toBe(false)
  })

  it('changePlan PATCHea /subscriptions/{id} con plan_change y deja la sub pending', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'uuid-sub-1', planId: 'basic', planName: 'Plan Básico', status: 'pending',
        preferenceId: null, autoRenew: true
      }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    const result = await store.changePlan('basic')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/subscriptions/uuid-sub-1', {
      status: 'plan_change',
      planId: 'basic'
    })
    expect(result.success).toBe(true)
    // El mensaje deja claro que hay que pagar de nuevo para activar el plan.
    expect(result.message).toContain('Completá el pago')
    expect(store.currentSubscription.planId).toBe('basic')
    expect(store.currentSubscription.status).toBe('pending')
    // auth store se mantiene en sync.
    expect(useAuthStore().user.subscription.planId).toBe('basic')
    expect(useAuthStore().user.subscription.status).toBe('pending')
  })

  it('changePlan 409 mismo plan -> mensaje claro', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: false,
      error: { code: 'CONFLICT', message: 'Subscription is already on this plan' }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    await expect(store.changePlan('pro')).rejects.toThrow('Ya estás suscripto a este plan')
  })

  it('changePlan 404 plan inexistente -> Plan no encontrado', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Subscription plan not found' }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    await expect(store.changePlan('ghost')).rejects.toThrow('Plan no encontrado')
  })

  it('changePlan con sub demo (sub_) no PATCHea, solo fallback local', async () => {
    // La suscripcion local lleva id demo: nunca se envia PATCH al backend.
    const store = usePaymentStore()
    store.currentSubscription = {
      id: 'sub_owner001',
      planId: 'pro',
      status: 'active'
    }

    const result = await store.changePlan('basic')

    expect(mocks.apiPatch).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(store.currentSubscription.planId).toBe('basic')
  })

  it('reactivateSubscription PATCHea /subscriptions/{id} con reactivate y deja la sub pending', async () => {
    const cancelledSub = { ...API_SUBSCRIPTION, status: 'cancelled', cancelledAt: '2026-07-01T00:00:00.000Z' }
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: cancelledSub } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'uuid-sub-1', planId: 'pro', planName: 'Plan Profesional', status: 'pending',
        preferenceId: null, cancelledAt: null, autoRenew: true
      }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    const result = await store.reactivateSubscription()

    expect(mocks.apiPatch).toHaveBeenCalledWith('/subscriptions/uuid-sub-1', { status: 'reactivate' })
    expect(result.success).toBe(true)
    expect(result.message).toContain('Completá el pago')
    expect(store.currentSubscription.status).toBe('pending')
    expect(useAuthStore().user.subscription.status).toBe('pending')
  })

  it('reactivateSubscription con sub demo (sub_) no PATCHea, solo fallback local', async () => {
    const store = usePaymentStore()
    store.currentSubscription = {
      id: 'sub_owner001',
      planId: 'pro',
      status: 'cancelled'
    }

    const result = await store.reactivateSubscription()

    expect(mocks.apiPatch).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(store.currentSubscription.status).toBe('active')
  })

  it('reactivateSubscription 409 -> No se puede reactivar una suscripción que no está cancelada', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: API_SUBSCRIPTION } })
    mocks.apiPatch.mockResolvedValueOnce({
      success: false,
      error: { code: 'CONFLICT', message: 'Cannot reactivate a active subscription' }
    })
    const store = usePaymentStore()
    await store.fetchCurrentSubscription()

    await expect(store.reactivateSubscription()).rejects.toThrow('No se puede reactivar una suscripción que no está cancelada')
  })

  it('fetchInvoices mapea pagos del backend a invoices', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          { id: 'p1', createdAt: '2026-01-01T00:00:00.000Z', amount: 24999, status: 'approved', planName: 'Plan Profesional' },
          { id: 'p2', createdAt: '2026-02-01T00:00:00.000Z', amount: 24999, status: 'pending', planName: 'Plan Profesional' }
        ]
      }
    })
    const store = usePaymentStore()

    const result = await store.fetchInvoices()

    expect(mocks.apiGet).toHaveBeenCalledWith('/payments')
    expect(result.success).toBe(true)
    expect(store.invoices).toHaveLength(2)
    expect(store.invoices[0].status).toBe('paid')
    expect(store.invoices[1].status).toBe('pending')
    expect(store.invoices[0].planName).toBe('Plan Profesional')
  })

  it('simulatePaymentSuccess activa la suscripcion localmente', async () => {
    const store = usePaymentStore()

    await store.simulatePaymentSuccess('basic')

    expect(store.currentSubscription.status).toBe('active')
    expect(store.currentSubscription.planId).toBe('basic')
    expect(useAuthStore().user.subscription.status).toBe('active')
  })
})
