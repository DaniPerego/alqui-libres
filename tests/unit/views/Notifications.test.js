// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import Notifications from '@/views/Notifications.vue'
import es from '@/i18n/es.js'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn()
}))

vi.mock('@/services/notifications', () => ({
  getNotifications: mocks.getNotifications,
  markNotificationAsRead: mocks.markNotificationAsRead
}))

function mountNotifications() {
  return mount(Notifications, {
    global: {
      plugins: [i18n]
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Notifications.vue', () => {
  it('renders the notification list with type, title, body and relative time', async () => {
    mocks.getNotifications.mockResolvedValue([
      {
        id: 'n1',
        type: 'reservation',
        title: 'Nueva reserva',
        body: 'Ana quiere reservar Casa Familiar',
        read: false,
        createdAt: Date.now()
      }
    ])

    const wrapper = mountNotifications()
    await flushPromises()

    expect(mocks.getNotifications).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Nueva reserva')
    expect(wrapper.text()).toContain('Ana quiere reservar Casa Familiar')
    expect(wrapper.text()).toContain('Reserva')
  })

  it('marks a notification as read when the action button is clicked', async () => {
    mocks.getNotifications.mockResolvedValue([
      {
        id: 'n1',
        type: 'message',
        title: 'Nuevo mensaje',
        body: 'Hola',
        read: false,
        createdAt: Date.now()
      }
    ])
    mocks.markNotificationAsRead.mockResolvedValue({ success: true })

    const wrapper = mountNotifications()
    await flushPromises()

    const button = wrapper.find('button.btn-outline')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Marcar como leída')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.markNotificationAsRead).toHaveBeenCalledWith('n1')
    expect(wrapper.text()).toContain('Leída')
  })

  it('shows an empty state when there are no notifications', async () => {
    mocks.getNotifications.mockResolvedValue([])

    const wrapper = mountNotifications()
    await flushPromises()

    expect(wrapper.text()).toContain('No tenés notificaciones')
    expect(wrapper.find('.notifications-list').exists()).toBe(false)
  })

  it('surfaces API errors instead of silently falling back', async () => {
    mocks.getNotifications.mockRejectedValue(new Error('Service unavailable'))

    const wrapper = mountNotifications()
    await flushPromises()

    expect(wrapper.text()).toContain('Service unavailable')
    expect(wrapper.find('.error-state').exists()).toBe(true)
  })
})
