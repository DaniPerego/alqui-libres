// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMessages, markMessageAsRead, markMessageAsReplied, replyToMessage, sendMessage } from '@/services/messages.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch,
  isDemoMode: () => import.meta.env.VITE_DEMO_MODE === 'true'
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('messages service (native API)', () => {
  it('fetches messages from the API and caches them in localStorage', async () => {
    const apiMessages = [
      { id: 'm1', guestName: 'Ana', propertyTitle: 'Casa', status: 'unread', createdAt: '2025-11-05T00:00:00.000Z' }
    ]
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: apiMessages } })

    const messages = await getMessages()

    expect(mocks.apiGet).toHaveBeenCalledWith('/messages')
    expect(messages).toHaveLength(1)
    expect(messages[0].guestName).toBe('Ana')
    expect(JSON.parse(localStorage.getItem('alquilibres_messages'))).toEqual(apiMessages)
  })

  it('returns an empty array instead of mock messages when the API fails in production', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    const messages = await getMessages()

    expect(messages).toEqual([])
  })

  it('falls back to mock messages only in demo mode when the API has a network error', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const messages = await getMessages()

    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0]).toHaveProperty('guestName')
    vi.unstubAllEnvs()
  })

  it('marks a message as read via PATCH /messages/:id', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [] } })
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { id: 'm1', status: 'read', read: true } })

    await getMessages()
    const result = await markMessageAsRead('m1')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/messages/m1', { status: 'read' })
    expect(result.success).toBe(true)
  })

  it('marks a message as replied via PATCH /messages/:id', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { id: 'm1', status: 'replied', read: true } })

    const result = await markMessageAsReplied('m1')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/messages/m1', { status: 'replied' })
    expect(result.success).toBe(true)
  })

  it('creates a message via POST /messages', async () => {
    const created = { id: 'm2', guestName: 'Bob', propertyTitle: 'Depto', status: 'unread', createdAt: '2025-11-06T00:00:00.000Z' }
    mocks.apiPost.mockResolvedValueOnce({ success: true, data: created })

    const result = await sendMessage({ propertyId: 'p1', message: 'Hola' })

    expect(mocks.apiPost).toHaveBeenCalledWith('/messages', { propertyId: 'p1', message: 'Hola' })
    expect(result.success).toBe(true)
    expect(result.message.id).toBe('m2')
  })

  it('sends a reply via PATCH /messages/:id with the reply text', async () => {
    localStorage.setItem('alquilibres_messages', JSON.stringify([{ id: 'm1', guestName: 'Ana', status: 'unread' }]))
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { id: 'm1', status: 'replied', read: true, reply: 'Gracias por escribir.' } })

    const result = await replyToMessage('m1', 'Gracias por escribir.')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/messages/m1', { reply: 'Gracias por escribir.' })
    expect(result.success).toBe(true)
    expect(result.message.reply).toBe('Gracias por escribir.')
    expect(JSON.parse(localStorage.getItem('alquilibres_messages'))[0].reply).toBe('Gracias por escribir.')
  })
})
