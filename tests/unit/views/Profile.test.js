// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Profile from '@/views/owner/Profile.vue'

describe('Profile.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all profile tabs without runtime errors', async () => {
    const wrapper = mount(Profile)
    await flushPromises()

    expect(wrapper.find('.owner-profile').exists()).toBe(true)
    expect(wrapper.text()).toContain('Información Personal')
    expect(wrapper.text()).toContain('Contactos')
    expect(wrapper.text()).toContain('Redes Sociales')
  })
})
