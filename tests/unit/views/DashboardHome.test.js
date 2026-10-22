// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import DashboardHome from '@/views/owner/DashboardHome.vue'
import { useAuthStore } from '@/stores/auth'
import es from '@/i18n/es.js'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

const serviceMocks = vi.hoisted(() => ({
  getMessages: vi.fn(),
  getNotifications: vi.fn(),
  getOwnerReservations: vi.fn()
}))

const storeMocks = vi.hoisted(() => ({
  properties: [],
  fetchUserProperties: vi.fn(),
  daysUntilRenewal: 0,
  fetchCurrentSubscription: vi.fn()
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ show: vi.fn(), toasts: { value: [] } })
}))

vi.mock('@/services/messages', () => ({
  getMessages: serviceMocks.getMessages
}))

vi.mock('@/services/notifications', () => ({
  getNotifications: serviceMocks.getNotifications
}))

vi.mock('@/services/reservations', () => ({
  getOwnerReservations: serviceMocks.getOwnerReservations
}))

vi.mock('@/stores/property', () => ({
  usePropertyStore: vi.fn(() => ({
    get properties() { return storeMocks.properties },
    fetchUserProperties: storeMocks.fetchUserProperties
  }))
}))

vi.mock('@/stores/payment', () => ({
  usePaymentStore: vi.fn(() => ({
    get daysUntilRenewal() { return storeMocks.daysUntilRenewal },
    fetchCurrentSubscription: storeMocks.fetchCurrentSubscription
  }))
}))

function mountDashboardHome() {
  return mount(DashboardHome, {
    global: {
      plugins: [i18n],
      stubs: {
        'router-link': { template: '<a><slot /></a>' }
      }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
  storeMocks.properties = []
  storeMocks.daysUntilRenewal = 0
})

describe('DashboardHome.vue', () => {
  it('derives every KPI from real API data', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      uid: 'owner001',
      email: 'owner@example.com',
      displayName: 'Propietario Demo',
      role: 'owner'
    }

    storeMocks.fetchUserProperties.mockResolvedValue({ success: true })
    storeMocks.properties = [
      { id: 'p1', status: 'active', isActive: true, viewCount: 100 },
      { id: 'p2', status: 'active', isActive: true, viewCount: 50 },
      { id: 'p3', status: 'active', isActive: false, viewCount: 25 }
    ]

    storeMocks.fetchCurrentSubscription.mockResolvedValue({ success: true })
    storeMocks.daysUntilRenewal = 23

    serviceMocks.getMessages.mockResolvedValue([
      { id: 'm1', guestName: 'Ana', propertyTitle: 'Casa', status: 'unread', createdAt: Date.now() },
      { id: 'm2', guestName: 'Bob', propertyTitle: 'Depto', status: 'read', createdAt: Date.now() }
    ])

    serviceMocks.getOwnerReservations.mockResolvedValue([
      { id: 'r1', status: 'pending', guestName: 'Ana', property: { title: 'Casa' }, createdAt: Date.now() },
      { id: 'r2', status: 'confirmed', guestName: 'Bob', property: { title: 'Depto' }, createdAt: Date.now() }
    ])

    serviceMocks.getNotifications.mockResolvedValue([])

    const wrapper = mountDashboardHome()
    await flushPromises()

    const values = wrapper.findAll('.metric-value').map(el => el.text())

    expect(values).toContain('3')
    expect(values).toContain('1')
    expect(values).toContain('23')
    expect(values).toContain('175')
    expect(values).toContain('1')

    const pageText = wrapper.text()
    expect(pageText).toContain('2 activas')
    expect(pageText).toContain('1 inactivas')

    expect(storeMocks.fetchUserProperties).toHaveBeenCalledWith('owner001')
    expect(storeMocks.fetchCurrentSubscription).toHaveBeenCalled()
    expect(serviceMocks.getMessages).toHaveBeenCalledWith({ throwOnError: true })
    expect(serviceMocks.getOwnerReservations).toHaveBeenCalledWith('owner001', 'all', { throwOnError: true })
    expect(serviceMocks.getNotifications).toHaveBeenCalledWith({}, { fallback: false })
  })

  it('shows an inline error when the property API fails and keeps metrics honest', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      uid: 'owner001',
      email: 'owner@example.com',
      displayName: 'Propietario Demo',
      role: 'owner'
    }

    storeMocks.fetchUserProperties.mockResolvedValue({
      success: false,
      error: 'Network error. Please try again.'
    })

    storeMocks.fetchCurrentSubscription.mockResolvedValue({ success: true })
    serviceMocks.getMessages.mockResolvedValue([])
    serviceMocks.getOwnerReservations.mockResolvedValue([])
    serviceMocks.getNotifications.mockResolvedValue([])

    const wrapper = mountDashboardHome()
    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(true)
    expect(wrapper.text()).toContain('No se pudieron cargar las propiedades')

    // No mock rows: property metrics must be 0, not the 4 mock rows.
    const values = wrapper.findAll('.metric-value').map(el => el.text())
    expect(values).toContain('0')
    expect(values).not.toContain('4')
    expect(values).not.toContain('1604')
  })
})
