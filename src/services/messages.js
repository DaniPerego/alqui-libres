import { apiGet, apiPost, apiPatch } from '@/services/api'
import { mockMessages } from '@/data/mockData'

const STORAGE_KEY = 'alquilibres_messages'

function loadMessages() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return [...mockMessages]
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {}
}

function updateStoredMessage(messageId, updater) {
  const messages = loadMessages()
  const index = messages.findIndex(m => m.id === messageId)
  if (index !== -1) {
    messages[index] = updater(messages[index])
    saveMessages(messages)
  }
}

function normalizeMessage(row) {
  if (!row) return null
  return {
    ...row,
    status: row.status || (row.read ? 'read' : 'unread'),
    createdAt: row.createdAt ? new Date(row.createdAt).getTime() : Date.now()
  }
}

export async function getMessages() {
  try {
    const result = await apiGet('/messages')
    if (!result.success) {
      console.warn('⚠️ Error fetching messages, falling back to localStorage:', result.error?.message)
      return loadMessages().map(normalizeMessage)
    }

    const messages = result.data?.data || []
    saveMessages(messages)
    return messages.map(normalizeMessage)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return loadMessages().map(normalizeMessage)
  }
}

export async function sendMessage(payload) {
  try {
    const result = await apiPost('/messages', payload)
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to send message' }
    }

    const message = normalizeMessage(result.data)
    const messages = loadMessages()
    messages.unshift(message)
    saveMessages(messages)
    return { success: true, message }
  } catch (error) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message }
  }
}

export async function markMessageAsRead(messageId) {
  try {
    const result = await apiPatch(`/messages/${messageId}`, { status: 'read' })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to mark as read' }
    }

    const updated = normalizeMessage(result.data)
    updateStoredMessage(messageId, () => updated)
    return { success: true, message: updated }
  } catch (error) {
    console.error('Error marking message as read:', error)
    return { success: false, error: error.message }
  }
}

export async function markMessageAsReplied(messageId) {
  try {
    const result = await apiPatch(`/messages/${messageId}`, { status: 'replied' })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to mark as replied' }
    }

    const updated = normalizeMessage(result.data)
    updateStoredMessage(messageId, () => updated)
    return { success: true, message: updated }
  } catch (error) {
    console.error('Error marking message as replied:', error)
    return { success: false, error: error.message }
  }
}

export async function replyToMessage(messageId, text) {
  try {
    const result = await apiPatch(`/messages/${messageId}`, { reply: text })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to send reply' }
    }

    const updated = normalizeMessage(result.data)
    updateStoredMessage(messageId, () => updated)
    return { success: true, message: updated }
  } catch (error) {
    console.error('Error replying to message:', error)
    return { success: false, error: error.message }
  }
}
