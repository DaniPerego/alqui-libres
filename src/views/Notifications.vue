<template>
  <div class="notifications-page">
    <header class="page-header">
      <div>
        <h1>{{ t('notifications.title') }}</h1>
        <p class="subtitle">{{ t('notifications.subtitle') }}</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state" role="status" aria-live="polite">
      <span class="spinner"></span>
      <p>{{ t('notifications.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state" role="alert">
      <p>{{ error }}</p>
      <button @click="loadNotifications" class="btn btn-outline">
        {{ t('notifications.tryAgain') }}
      </button>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <Bell :size="48" />
      <h3>{{ t('notifications.empty.title') }}</h3>
      <p>{{ t('notifications.empty.description') }}</p>
    </div>

    <ul v-else class="notifications-list" role="list">
      <li
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="{ unread: !notification.read }"
      >
        <div class="notification-icon" :class="notification.type">
          <component :is="iconForType(notification.type)" :size="22" />
        </div>
        <div class="notification-body">
          <div class="notification-meta">
            <span class="notification-type">{{ labelForType(notification.type) }}</span>
            <span class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</span>
          </div>
          <h3 class="notification-title">{{ notification.title }}</h3>
          <p class="notification-text">{{ notification.body }}</p>
        </div>
        <div class="notification-actions">
          <span v-if="!notification.read" class="unread-dot" aria-hidden="true"></span>
          <button
            v-if="!notification.read"
            class="btn btn-sm btn-outline"
            :disabled="markingId === notification.id"
            @click="markRead(notification)"
          >
            {{ t('notifications.markAsRead') }}
          </button>
          <span v-else class="read-label">{{ t('notifications.read') }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { getNotifications, markNotificationAsRead } from '@/services/notifications'
import {
  Bell,
  Calendar,
  CreditCard,
  Home,
  MessageSquare,
  Pin
} from '@lucide/vue'

const { t } = useI18n()
const formatRelativeTime = useRelativeTime()

const notifications = ref([])
const loading = ref(false)
const error = ref(null)
const markingId = ref(null)

const ICON_BY_TYPE = {
  reservation: Calendar,
  message: MessageSquare,
  payment: CreditCard,
  property: Home,
  system: Pin
}

function iconForType(type) {
  return ICON_BY_TYPE[type] || Bell
}

function labelForType(type) {
  return t(`notifications.types.${type}`) || t('notifications.types.system')
}

async function loadNotifications() {
  loading.value = true
  error.value = null

  try {
    // No silent fallback: API failures surface in the UI.
    notifications.value = await getNotifications({}, { fallback: false })
  } catch (err) {
    notifications.value = []
    error.value = err?.message || t('notifications.error')
  } finally {
    loading.value = false
  }
}

async function markRead(notification) {
  markingId.value = notification.id
  const result = await markNotificationAsRead(notification.id)
  markingId.value = null

  if (result.success) {
    notification.read = true
  } else {
    error.value = result.error || t('notifications.error')
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--gray-600);
}

.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-state {
  color: var(--danger-color, #dc2626);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--gray-800);
}

.empty-state p {
  color: var(--gray-600);
}

.notifications-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notification-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid transparent;
  transition: background-color 0.2s ease;
}

.notification-card.unread {
  border-left-color: var(--primary-color);
  background: #f8fafc;
}

.notification-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  color: var(--gray-700);
  flex-shrink: 0;
}

.notification-icon.reservation { background: #eff6ff; color: #2563eb; }
.notification-icon.message { background: #f0fdf4; color: #16a34a; }
.notification-icon.payment { background: #fef3c7; color: #d97706; }
.notification-icon.property { background: #f5f3ff; color: #7c3aed; }
.notification-icon.system { background: #f3f4f6; color: #4b5563; }

.notification-body {
  min-width: 0;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.notification-type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-color);
}

.notification-time {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.notification-text {
  font-size: 0.9375rem;
  color: var(--gray-600);
  line-height: 1.5;
  margin: 0;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
  min-width: 110px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
}

.read-label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .notifications-page {
    padding: var(--spacing-md);
  }

  .notification-card {
    grid-template-columns: auto 1fr;
  }

  .notification-actions {
    grid-column: 2;
    align-items: flex-start;
    flex-direction: row;
  }
}
</style>
