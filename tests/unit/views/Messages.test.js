// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import Messages from '@/views/owner/Messages.vue'
import es from '@/i18n/es.js'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

const mocks = vi.hoisted(() => ({
  getMessages: vi.fn(),
  markMessageAsRead: vi.fn(),
  replyToMessage: vi.fn()
}))

vi.mock('@/services/messages', () => ({
  getMessages: mocks.getMessages,
  markMessageAsRead: mocks.markMessageAsRead,
  replyToMessage: mocks.replyToMessage
}))

function mountMessages() {
  return mount(Messages, {
    global: {
      plugins: [i18n]
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Messages.vue', () => {
  it('loads and renders real messages from the API', async () => {
    mocks.getMessages.mockResolvedValue([
      {
        id: 'm1',
        guestName: 'Ana Martínez',
        guestEmail: 'ana@example.com',
        propertyTitle: 'Casa Familiar',
        message: '¿Está disponible?',
        status: 'unread',
        checkIn: '2025-12-15',
        checkOut: '2025-12-20',
        guests: 4,
        createdAt: Date.now()
      }
    ])

    const wrapper = mountMessages()
    await flushPromises()

    expect(mocks.getMessages).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Ana Martínez')
    expect(wrapper.text()).toContain('¿Está disponible?')
    expect(wrapper.text()).toContain('Casa Familiar')
  })

  it('calls the real mark-as-read endpoint', async () => {
    mocks.getMessages.mockResolvedValue([
      {
        id: 'm1',
        guestName: 'Ana Martínez',
        guestEmail: 'ana@example.com',
        propertyTitle: 'Casa Familiar',
        message: '¿Está disponible?',
        status: 'unread',
        checkIn: '2025-12-15',
        checkOut: '2025-12-20',
        guests: 4,
        createdAt: Date.now()
      }
    ])
    mocks.markMessageAsRead.mockResolvedValue({ success: true })

    const wrapper = mountMessages()
    await flushPromises()

    const readButton = wrapper.find('button.btn-secondary')
    expect(readButton.exists()).toBe(true)
    expect(readButton.text()).toContain('leído')

    await readButton.trigger('click')
    await flushPromises()

    expect(mocks.markMessageAsRead).toHaveBeenCalledWith('m1')
  })

  it('sends a reply through the service and updates the message', async () => {
    mocks.getMessages.mockResolvedValue([
      {
        id: 'm1',
        guestName: 'Ana Martínez',
        guestEmail: 'ana@example.com',
        propertyTitle: 'Casa Familiar',
        message: '¿Está disponible?',
        status: 'unread',
        checkIn: '2025-12-15',
        checkOut: '2025-12-20',
        guests: 4,
        createdAt: Date.now()
      }
    ])
    mocks.replyToMessage.mockResolvedValue({
      success: true,
      message: {
        id: 'm1',
        reply: 'Sí, tenemos disponibilidad.',
        status: 'replied',
        read: true
      }
    })

    const wrapper = mountMessages()
    await flushPromises()

    const replyButton = wrapper.findAll('button').find(b => b.text().includes('Responder'))
    expect(replyButton).toBeDefined()
    await replyButton.trigger('click')
    await flushPromises()

    const textarea = wrapper.find('textarea.reply-textarea')
    await textarea.setValue('Sí, tenemos disponibilidad.')

    const sendButton = wrapper.findAll('button').find(b => b.text().includes('Enviar'))
    expect(sendButton).toBeDefined()
    await sendButton.trigger('click')
    await flushPromises()

    expect(mocks.replyToMessage).toHaveBeenCalledWith('m1', 'Sí, tenemos disponibilidad.')
    expect(wrapper.text()).toContain('Sí, tenemos disponibilidad.')
  })
})
