// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import Dashboard from '@/views/owner/Dashboard.vue'

describe('Dashboard.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountDashboard(role) {
    const authStore = useAuthStore()
    authStore.user = { uid: 'u1', email: 'x@example.com', role }
    return mount(Dashboard, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          'router-view': true
        }
      }
    })
  }

  it('shows the owner sidebar when the user is an owner', () => {
    const wrapper = mountDashboard('owner')
    expect(wrapper.find('aside.sidebar').exists()).toBe(true)
    expect(wrapper.text()).toContain('Mis Propiedades')
  })

  it('hides the owner sidebar when the user is a guest', () => {
    const wrapper = mountDashboard('guest')
    expect(wrapper.find('aside.sidebar').exists()).toBe(false)
  })
})
