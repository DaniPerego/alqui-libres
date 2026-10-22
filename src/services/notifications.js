import { apiGet, apiPatch, toList, isDemoMode } from '@/services/api'

const STORAGE_KEY = 'alquilibres_notifications'

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {}
}

function updateStoredNotification(notification) {
  const notifications = loadNotifications()
  const index = notifications.findIndex(n => n.id === notification.id)
  if (index !== -1) {
    notifications[index] = notification
    saveNotifications(notifications)
  }
}

function normalizeNotification(row) {
  if (!row) return null
  return {
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now()
  }
}

function isNetworkError(resultOrError) {
  if (resultOrError && typeof resultOrError === 'object') {
    return resultOrError.code === 'NETWORK_ERROR' || resultOrError.code === 'NETWORK'
  }
  return false
}

/**
 * List the current user's notifications.
 *
 * Backend contract (api-handlers/notifications.js):
 *   GET /notifications?read=true|false&type=&page=&limit=
 *   Response: { data: Notification[], meta: { page, limit, total, totalPages } }
 *
 * @param {Object} params - Query filters (read, type, page, limit).
 * @param {Object} options - { fallback?: boolean } fallback=true allows offline
 *   demo data when the request fails with NETWORK_ERROR and VITE_DEMO_MODE is
 *   enabled. Consumers that need to surface API failures should pass
 *   { fallback: false }.
 */
export async function getNotifications(params = {}, options = {}) {
  const { fallback = isDemoMode() } = options

  try {
    const result = await apiGet('/notifications', params)
    if (!result.success) {
      if (fallback && isNetworkError(result.error)) {
        console.warn('⚠️ Error fetching notifications, using offline demo data:', result.error?.message)
        return loadNotifications().map(normalizeNotification)
      }
      throw new Error(result.error?.message || 'Failed to fetch notifications')
    }

    const rows = toList(result.data)
    saveNotifications(rows)
    return rows.map(normalizeNotification)
  } catch (error) {
    if (fallback && isNetworkError(error)) {
      console.error('Error fetching notifications:', error)
      return loadNotifications().map(normalizeNotification)
    }
    throw error
  }
}

/**
 * Return the total number of unread notifications for the current user.
 *
 * Uses limit=1 so Prisma only has to count, not fetch rows.
 */
export async function getUnreadNotificationsCount() {
  try {
    const result = await apiGet('/notifications', { read: 'false', limit: 1 })
    if (!result.success) return 0
    return result.data?.meta?.total || 0
  } catch {
    return 0
  }
}

/**
 * Mark a notification as read.
 *
 * Backend contract (api-handlers/notifications/[id].js):
 *   PATCH /notifications/:id (no body required; handler sets read=true)
 *   Response: the updated Notification row.
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const result = await apiPatch(`/notifications/${notificationId}`, {})
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to mark as read' }
    }

    const updated = normalizeNotification(result.data)
    updateStoredNotification(updated)
    return { success: true, notification: updated }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }
}
