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

describe('PropertyDetail.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.user = null
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders the property that matches route.params.id', async () => {
    routeParams.id = '2'
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

    // mock property id:2 has title 'Departamento Céntrico con Vista al Mar'
    expect(wrapper.text()).toContain('Departamento Céntrico con Vista al Mar')
  })

  it('shows a not found state for an unknown property id', async () => {
    routeParams.id = 'unknown-id'
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
