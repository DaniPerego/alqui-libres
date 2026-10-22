// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import Home from '@/views/Home.vue'
import es from '@/i18n/es.js'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  push: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push })
}))

function mountHome() {
  return mount(Home, {
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

describe('Home.vue', () => {
  it('shows an inline error and no featured cards when the API fails in production', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(true)
    expect(wrapper.text()).toContain('Boom')
    expect(wrapper.findAll('.property-card').length).toBe(0)
  })

  it('renders featured properties from the API when the request succeeds', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          {
            id: 'api-1',
            title: 'Casa Temporaria',
            rentalType: 'temporario',
            mainImage: 'https://example.com/1.jpg',
            locationCity: 'Carlos Paz',
            locationState: 'Córdoba',
            locationCountry: 'Argentina',
            pricingBasePrice: 100,
            pricingCurrency: 'USD',
            isActive: true,
            status: 'active'
          },
          {
            id: 'api-2',
            title: 'Departamento Anual',
            rentalType: 'anual',
            mainImage: 'https://example.com/2.jpg',
            locationCity: 'Córdoba',
            locationState: 'Córdoba',
            locationCountry: 'Argentina',
            pricingBasePrice: 500,
            pricingCurrency: 'USD',
            isActive: true,
            status: 'active'
          }
        ],
        meta: { page: 1, limit: 20, total: 2 }
      }
    })

    const wrapper = mountHome()
    await flushPromises()

    expect(wrapper.find('.error-banner').exists()).toBe(false)
    expect(wrapper.findAll('.property-card').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Casa Temporaria')
  })
})
