// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import Search from '@/views/Search.vue'
import es from '@/i18n/es.js'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet
}))

function mountSearch() {
  return mount(Search, {
    global: {
      plugins: [i18n, createPinia()],
      stubs: {
        'router-link': { template: '<a><slot /></a>' }
      }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('Search.vue', () => {
  it('shows an inline error and no mock rows when the property search API fails', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    const wrapper = mountSearch()
    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(true)
    expect(wrapper.text()).toContain('Boom')
    expect(wrapper.findAll('.listing-card').length).toBe(0)
  })

  it('renders real API results when the search succeeds', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          {
            id: 'api-1',
            title: 'Casa API',
            propertyType: 'casa',
            rentalType: 'temporario',
            mainImage: 'https://example.com/main.jpg',
            locationCity: 'Carlos Paz',
            locationState: 'Córdoba',
            locationCountry: 'Argentina',
            capacityGuests: 4,
            capacityBedrooms: 2,
            capacityBeds: 2,
            capacityBathrooms: 1,
            pricingBasePrice: 150,
            pricingCleaningFee: 25,
            pricingCurrency: 'USD',
            amenities: ['WiFi'],
            localFeatures: {},
            isActive: true,
            status: 'active'
          }
        ],
        meta: { page: 1, limit: 20, total: 1 }
      }
    })

    const wrapper = mountSearch()
    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(false)
    expect(wrapper.findAll('.listing-card').length).toBe(1)
    expect(wrapper.text()).toContain('Casa API')
  })
})
