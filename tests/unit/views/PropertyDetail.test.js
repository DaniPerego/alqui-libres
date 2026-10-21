// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import i18n from '@/i18n'
import PropertyDetail from '@/views/PropertyDetail.vue'

const routeParams = { id: '2' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({})
}))

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch,
  apiDelete: mocks.apiDelete
}))

// Flat API row (Prisma shape) — the property store normalizes it on fetch.
const apiProperty = {
  id: '2',
  ownerId: 'user123',
  title: 'Departamento Céntrico con Vista al Mar',
  description: 'Moderno departamento en pleno centro, con impresionantes vistas al mar. Ideal para parejas o pequeñas familias.',
  propertyType: 'apartamento',
  rentalType: 'temporario',
  mainImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
  ],
  locationCity: 'Mar del Plata',
  locationState: 'Buenos Aires',
  locationCountry: 'Argentina',
  capacityGuests: 4,
  capacityBedrooms: 2,
  capacityBeds: 2,
  capacityBathrooms: 2,
  pricingBasePrice: 85,
  pricingCleaningFee: 20,
  pricingCurrency: 'USD',
  amenities: ['WiFi', 'TV', 'Cocina', 'Aire Acondicionado', 'Vista al mar', 'Balcón'],
  localFeatures: { grillType: 'electrica', parkingSize: 'pequena', nearbyAttractions: ['Playa Bristol'] },
  rating: 4.7,
  reviewCount: 32,
  isActive: true,
  status: 'active',
  createdAt: '2024-03-10T00:00:00.000Z',
  updatedAt: '2024-10-25T00:00:00.000Z'
}

function mockApiFor(propertyId) {
  mocks.apiGet.mockImplementation(async (path) => {
    if (path === `/properties/${propertyId}`) {
      return { success: true, data: apiProperty }
    }
    if (path === `/properties/${propertyId}/availability`) {
      return { success: true, data: { blockedDates: [], bookedRanges: [] } }
    }
    if (path === '/reviews') {
      return { success: true, data: [] }
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Missing' }
    }
  })
}

describe('PropertyDetail.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.user = null
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders the property returned by the API for route.params.id', async () => {
    routeParams.id = '2'
    mockApiFor('2')
    const wrapper = shallowMount(PropertyDetail, {
      global: {
        plugins: [i18n],
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true
        }
      }
    })
    await flushPromises()
    vi.advanceTimersByTime(500)
    await flushPromises()

    expect(mocks.apiGet).toHaveBeenCalledWith('/properties/2', undefined, { public: true })
    expect(wrapper.text()).toContain('Departamento Céntrico con Vista al Mar')
  })

  it('shows a not found state for an unknown property id', async () => {
    routeParams.id = 'unknown-id'
    mockApiFor('2')
    const wrapper = shallowMount(PropertyDetail, {
      global: {
        plugins: [i18n],
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true
        }
      }
    })
    await flushPromises()
    vi.advanceTimersByTime(500)
    await flushPromises()

    expect(wrapper.text().toLowerCase()).toContain('no encontrada')
  })
})
