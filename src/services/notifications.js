import { apiGet } from '@/services/api'

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

function normalizeNotification(row) {
  if (!row) return null
  return {
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now()
  }
}

export async function getNotifications() {
  try {
    const result = await apiGet('/notifications')
    if (!result.success) {
      console.warn('⚠️ Error fetching notifications, falling back to localStorage:', result.error?.message)
      return loadNotifications().map(normalizeNotification)
    }

    const notifications = result.data?.data || []
    saveNotifications(notifications)
    return notifications.map(normalizeNotification)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return loadNotifications().map(normalizeNotification)
  }
}
