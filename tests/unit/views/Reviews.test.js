// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePropertyStore } from '@/stores/property'
import Reviews from '@/views/owner/Reviews.vue'

describe('Reviews.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

    mount(Reviews)
    await flushPromises()

    expect(propertyStore.fetchUserProperties).toHaveBeenCalledTimes(1)
    expect(propertyStore.fetchUserProperties).toHaveBeenCalledWith('owner001')
  })
})
