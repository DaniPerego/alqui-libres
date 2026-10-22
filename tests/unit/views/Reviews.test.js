// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePropertyStore } from '@/stores/property'
import Reviews from '@/views/owner/Reviews.vue'

const mocks = vi.hoisted(() => ({
  getOwnerReviews: vi.fn(),
  replyToReview: vi.fn()
}))

vi.mock('@/services/reviews', () => ({
  getOwnerReviews: mocks.getOwnerReviews,
  replyToReview: mocks.replyToReview
}))

describe('Reviews.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads user properties with fetchUserProperties(userId) on mount', async () => {
    const authStore = useAuthStore()
    authStore.user = { uid: 'owner001', email: 'owner@example.com', role: 'owner' }

    const propertyStore = usePropertyStore()
    propertyStore.properties = [
      { id: 'p1', ownerId: 'owner001', title: 'Casa 1' },
      { id: 'p2', ownerId: 'owner001', title: 'Casa 2' }
    ]
    propertyStore.fetchUserProperties = vi.fn()
    mocks.getOwnerReviews.mockResolvedValue([])

    mount(Reviews)
    await flushPromises()

    expect(propertyStore.fetchUserProperties).toHaveBeenCalledTimes(1)
    expect(propertyStore.fetchUserProperties).toHaveBeenCalledWith('owner001')
  })

  it('renders seeded owner replies without localStorage', async () => {
    const authStore = useAuthStore()
    authStore.user = { uid: 'owner001', email: 'owner@example.com', role: 'owner' }

    const propertyStore = usePropertyStore()
    propertyStore.properties = [{ id: '1', ownerId: 'owner001', title: 'Casa' }]
    propertyStore.fetchUserProperties = vi.fn()

    mocks.getOwnerReviews.mockResolvedValue([
      { id: 'r1', guestName: 'María', rating: 5, comment: 'Genial', reply: 'Gracias María', ownerResponse: 'Gracias María', createdAt: '2024-10-15' }
    ])

    const wrapper = mount(Reviews)
    await flushPromises()

    expect(wrapper.text()).toContain('Gracias María')
    expect(wrapper.text()).toContain('Tu respuesta:')
  })

  it('submits a reply through the service and refreshes the review', async () => {
    const authStore = useAuthStore()
    authStore.user = { uid: 'owner001', email: 'owner@example.com', role: 'owner' }

    const propertyStore = usePropertyStore()
    propertyStore.properties = [{ id: '1', ownerId: 'owner001', title: 'Casa' }]
    propertyStore.fetchUserProperties = vi.fn()

    mocks.getOwnerReviews.mockResolvedValue([
      { id: 'r1', guestName: 'María', rating: 5, comment: 'Genial', reply: null, ownerResponse: null, createdAt: '2024-10-15' }
    ])
    mocks.replyToReview.mockResolvedValue({
      success: true,
      review: { id: 'r1', reply: 'Gracias por tu visita.', ownerResponse: 'Gracias por tu visita.', ownerRespondedAt: '2024-10-16' }
    })

    const wrapper = mount(Reviews)
    await flushPromises()

    const input = wrapper.find('input[placeholder="Responder a esta reseña..."]')
    await input.setValue('Gracias por tu visita.')

    const button = wrapper.find('button:not(:disabled)')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    await flushPromises()

    expect(mocks.replyToReview).toHaveBeenCalledWith('r1', 'Gracias por tu visita.')
    expect(wrapper.text()).toContain('Gracias por tu visita.')
  })
})
