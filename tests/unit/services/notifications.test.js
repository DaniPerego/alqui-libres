// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNotifications, markNotificationAsRead, getUnreadNotificationsCount } from '@/services/notifications.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPatch: mocks.apiPatch,
  toList: (result) => (Array.isArray(result?.data) ? result.data : []),
  isDemoMode: () => import.meta.env.VITE_DEMO_MODE === 'true'
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('notifications service (native API)', () => {
  it('fetches notifications from the API and caches them in localStorage', async () => {
    const apiNotifications = [
      { id: 'n1', type: 'reservation', title: 'Nueva reserva', body: 'Body', read: false, createdAt: '2025-11-05T00:00:00.000Z' }
    ]
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: apiNotifications, meta: { total: 1 } } })

    const notifications = await getNotifications()

    expect(mocks.apiGet).toHaveBeenCalledWith('/notifications', {})
    expect(notifications).toHaveLength(1)
    expect(notifications[0].title).toBe('Nueva reserva')
    expect(JSON.parse(localStorage.getItem('alquilibres_notifications'))).toEqual(apiNotifications)
  })

  it('passes query params to the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [], meta: { total: 0 } } })

    await getNotifications({ read: 'false', type: 'reservation', page: 2 })

    expect(mocks.apiGet).toHaveBeenCalledWith('/notifications', { read: 'false', type: 'reservation', page: 2 })
  })

  it('falls back to localStorage when the API is unreachable in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    localStorage.setItem('alquilibres_notifications', JSON.stringify([{ id: 'n2', type: 'system', title: 'Cache', body: 'X', read: true, createdAt: '2025-11-05T00:00:00.000Z' }]))
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const notifications = await getNotifications()

    expect(notifications).toHaveLength(1)
    expect(notifications[0].title).toBe('Cache')
    vi.unstubAllEnvs()
  })

  it('does not fall back by default in production', async () => {
    localStorage.setItem('alquilibres_notifications', JSON.stringify([{ id: 'n2', type: 'system', title: 'Cache', body: 'X', read: true, createdAt: '2025-11-05T00:00:00.000Z' }]))
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    await expect(getNotifications()).rejects.toThrow('Network error. Please try again.')
  })

  it('surfaces API errors when fallback is disabled', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    await expect(getNotifications({}, { fallback: false })).rejects.toThrow('Boom')
  })

  it('counts unread notifications from the API meta', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [], meta: { total: 7 } } })

    const count = await getUnreadNotificationsCount()

    expect(mocks.apiGet).toHaveBeenCalledWith('/notifications', { read: 'false', limit: 1 })
    expect(count).toBe(7)
  })

  it('returns 0 unread count when the API fails', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: false, error: { message: 'Down' } })

    const count = await getUnreadNotificationsCount()

    expect(count).toBe(0)
  })

  it('marks a notification as read via PATCH /notifications/:id', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { id: 'n1', read: true, readAt: '2025-11-05T12:00:00.000Z', createdAt: '2025-11-05T00:00:00.000Z' } })

    const result = await markNotificationAsRead('n1')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/notifications/n1', {})
    expect(result.success).toBe(true)
    expect(result.notification.read).toBe(true)
  })

  it('returns an error when PATCH fails', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: false, error: { message: 'Not found' } })

    const result = await markNotificationAsRead('n1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not found')
  })
})
