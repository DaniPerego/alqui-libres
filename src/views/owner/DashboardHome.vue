<template>
  <div class="dashboard-home">
    <header class="dashboard-header">
      <div>
        <h1>{{ t('dashboard.hello') }}, {{ userName }}!</h1>
        <p class="subtitle">{{ t('dashboard.welcome') }}</p>
      </div>
      <router-link to="/panel/propiedades/nueva" class="btn btn-primary">
        <Plus :size="20" /> {{ t('dashboard.newProperty') }}
      </router-link>
    </header>

    <!-- Tarjetas de Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon properties"><Home :size="24" /></div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.totalProperties }}</h3>
          <p class="metric-label">{{ t('dashboard.propertiesPublished') }}</p>
          <div class="metric-detail">
            <span class="active">{{ stats.activeProperties }} {{ t('dashboard.active') }}</span>
            <span class="inactive">{{ stats.inactiveProperties }} {{ t('dashboard.inactive') }}</span>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon messages"><MessageSquare :size="24" /></div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.unreadMessages }}</h3>
          <p class="metric-label">{{ t('dashboard.unreadMessages') }}</p>
          <router-link v-if="stats.unreadMessages > 0" to="/panel/mensajes" class="metric-link">
            {{ t('dashboard.viewMessages') }} →
          </router-link>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon subscription"><CreditCard :size="24" /></div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.subscriptionDays }}</h3>
          <p class="metric-label">{{ t('dashboard.subscriptionDays') }}</p>
          <div class="metric-detail">
            <span :class="['status', subscriptionStatus]">
              {{ subscriptionStatusText }}
            </span>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon views"><Eye :size="24" /></div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.totalViews }}</h3>
          <p class="metric-label">{{ t('dashboard.totalViews') }}</p>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon reservations"><Calendar :size="24" /></div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.pendingReservations }}</h3>
          <p class="metric-label">{{ t('dashboard.pendingReservations') }}</p>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <section class="quick-actions-section">
      <h2 class="section-title">{{ t('dashboard.quickActions') }}</h2>
      <div class="quick-actions-grid">
        <router-link to="/panel/propiedades/nueva" class="action-card">
          <div class="action-icon"><Plus :size="24" /></div>
          <h3>{{ t('dashboard.publishProperty') }}</h3>
          <p>{{ t('dashboard.publishDesc') }}</p>
        </router-link>

        <router-link to="/panel/propiedades" class="action-card">
          <div class="action-icon"><Edit :size="24" /></div>
          <h3>{{ t('dashboard.editProperties') }}</h3>
          <p>{{ t('dashboard.editDesc') }}</p>
        </router-link>

        <router-link to="/panel/mensajes" class="action-card">
          <div class="action-icon"><MessageSquare :size="24" /></div>
          <h3>{{ t('dashboard.viewMessagesAction') }}</h3>
          <p>{{ t('dashboard.messagesDesc') }}</p>
          <span v-if="stats.unreadMessages > 0" class="badge">{{ stats.unreadMessages }}</span>
        </router-link>

        <router-link to="/panel/perfil" class="action-card">
          <div class="action-icon"><User :size="24" /></div>
          <h3>{{ t('dashboard.updateProfile') }}</h3>
          <p>{{ t('dashboard.profileDesc') }}</p>
        </router-link>

        <router-link to="/panel/suscripcion" class="action-card">
          <div class="action-icon"><Crown :size="24" /></div>
          <h3>{{ t('dashboard.mySubscription') }}</h3>
          <p>{{ t('dashboard.subscriptionDesc') }}</p>
        </router-link>

        <a href="https://wa.me/5493511234567" target="_blank" class="action-card support">
          <div class="action-icon"><HelpCircle :size="24" /></div>
          <h3>{{ t('dashboard.support') }}</h3>
          <p>{{ t('dashboard.supportDesc') }}</p>
        </a>
      </div>
    </section>

    <!-- Actividad Reciente -->
    <section class="recent-activity-section">
      <h2 class="section-title">{{ t('dashboard.recentActivity') }}</h2>
      <div class="activity-list">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            <Eye v-if="activity.type === 'view'" :size="18" />
            <MessageSquare v-else-if="activity.type === 'message'" :size="18" />
            <Home v-else-if="activity.type === 'property'" :size="18" />
            <CreditCard v-else-if="activity.type === 'subscription'" :size="18" />
            <User v-else-if="activity.type === 'profile'" :size="18" />
            <Calendar v-else-if="activity.type === 'reservation'" :size="18" />
            <Bell v-else-if="activity.type === 'notification'" :size="18" />
            <Pin v-else :size="18" />
          </div>
          <div class="activity-content">
            <p class="activity-text">{{ activity.text }}</p>
            <p class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</p>
          </div>
        </div>

        <div v-if="recentActivity.length === 0" class="empty-state">
          <ClipboardList :size="48" />
          <p>{{ t('dashboard.noActivity') }}</p>
          <p class="empty-hint">{{ t('dashboard.noActivityHint') }}</p>
        </div>
      </div>
    </section>

    <!-- Tips y Ayuda -->
    <section class="tips-section">
      <h2 class="section-title"><Lightbulb :size="24" /> {{ t('dashboard.tips') }}</h2>
      <div class="tips-grid">
        <div class="tip-card" v-if="!stats.hasProfileComplete">
          <div class="tip-header">
            <span class="tip-icon"><User :size="20" /></span>
            <h3>{{ t('dashboard.completeProfile') }}</h3>
          </div>
          <p>{{ t('dashboard.completeProfileDesc') }}</p>
          <router-link to="/panel/perfil" class="tip-action">{{ t('dashboard.completeNow') }} →</router-link>
        </div>

        <div class="tip-card" v-if="stats.totalProperties === 0">
          <div class="tip-header">
            <span class="tip-icon"><Home :size="20" /></span>
            <h3>{{ t('dashboard.publishFirst') }}</h3>
          </div>
          <p>{{ t('dashboard.publishFirstDesc') }}</p>
          <router-link to="/panel/propiedades/nueva" class="tip-action">{{ t('dashboard.publishNow') }} →</router-link>
        </div>

        <div class="tip-card">
          <div class="tip-header">
            <span class="tip-icon"><Camera :size="20" /></span>
            <h3>{{ t('dashboard.qualityPhotos') }}</h3>
          </div>
          <p>{{ t('dashboard.qualityPhotosDesc') }}</p>
        </div>

        <div class="tip-card">
          <div class="tip-header">
            <span class="tip-icon"><Zap :size="20" /></span>
            <h3>{{ t('dashboard.respondFast') }}</h3>
          </div>
          <p>{{ t('dashboard.respondFastDesc') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { usePropertyStore } from '@/stores/property'
import { useI18n } from 'vue-i18n'
import { getMessages } from '@/services/messages'
import { getNotifications } from '@/services/notifications'
import { getOwnerReservations } from '@/services/reservations'
import { mockProperties } from '@/data/mockData'
import {
  Plus,
  Home,
  MessageSquare,
  CreditCard,
  Eye,
  Edit,
  User,
  Crown,
  HelpCircle,
  Pin,
  ClipboardList,
  Lightbulb,
  Camera,
  Zap,
  Calendar,
  Bell
} from '@lucide/vue'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()
const propertyStore = usePropertyStore()

const stats = ref({
  totalProperties: 0,
  activeProperties: 0,
  inactiveProperties: 0,
  unreadMessages: 0,
  subscriptionDays: 0,
  totalViews: 0,
  pendingReservations: 0,
  hasProfileComplete: false
})

const recentActivity = ref([])
const isLoading = ref(false)

const userName = computed(() => {
  return authStore.user?.displayName?.split(' ')[0] || t('dashboard.userFallback')
})

const subscriptionStatus = computed(() => {
  if (stats.value.subscriptionDays > 10) return 'active'
  if (stats.value.subscriptionDays > 5) return 'warning'
  if (stats.value.subscriptionDays > 0) return 'expiring'
  return 'expired'
})

const subscriptionStatusText = computed(() => {
  const key = `dashboard.subscriptionStatus.${subscriptionStatus.value}`
  return t(key)
})

function isActiveProperty(property) {
  return property.status === 'active' && property.isActive !== false
}

function derivePropertyStats(properties) {
  const total = properties.length
  const active = properties.filter(isActiveProperty).length
  const totalViews = properties.reduce((sum, p) => sum + (Number(p.viewCount) || 0), 0)
  return { total, active, inactive: total - active, totalViews }
}

async function loadProperties() {
  const result = await propertyStore.fetchUserProperties(authStore.userId)
  if (result.success) {
    return propertyStore.properties
  }

  // Offline fallback: keep the UI alive with the mock catalog when the API is unreachable.
  console.warn('⚠️ Error fetching dashboard properties, falling back to mock data:', result.error)
  return [...mockProperties]
}

async function loadMessages() {
  const messages = await getMessages()
  const unread = messages.filter(m => m.status === 'unread' || m.read === false).length
  return { messages, unread }
}

async function loadSubscription() {
  const result = await paymentStore.fetchCurrentSubscription()
  return paymentStore.daysUntilRenewal || 0
}

async function loadReservations() {
  const reservations = await getOwnerReservations(authStore.userId, 'all')
  const pending = reservations.filter(r => r.status === 'pending').length
  return { reservations, pending }
}

async function loadNotifications() {
  return getNotifications()
}

function resolvePropertyTitle(item) {
  if (item.propertyTitle) return item.propertyTitle
  if (item.property?.title) return item.property.title
  return t('dashboard.activity.untitledProperty')
}

function buildMessageActivity(message) {
  return {
    id: `msg-${message.id}`,
    type: 'message',
    text: t('dashboard.activity.newMessage', {
      guest: message.guestName,
      property: resolvePropertyTitle(message)
    }),
    timestamp: new Date(message.createdAt).getTime()
  }
}

function buildReservationActivity(reservation) {
  const propertyTitle = resolvePropertyTitle(reservation)
  const keyMap = {
    pending: 'dashboard.activity.newReservation',
    confirmed: 'dashboard.activity.reservationConfirmed',
    rejected: 'dashboard.activity.reservationRejected',
    cancelled: 'dashboard.activity.reservationCancelled'
  }
  return {
    id: `res-${reservation.id}`,
    type: 'reservation',
    text: t(keyMap[reservation.status] || keyMap.pending, {
      guest: reservation.guestName,
      property: propertyTitle
    }),
    timestamp: new Date(reservation.createdAt).getTime()
  }
}

function buildNotificationActivity(notification) {
  const typeMap = {
    reservation: 'reservation',
    message: 'message',
    payment: 'subscription',
    property: 'property',
    system: 'system'
  }
  return {
    id: `notif-${notification.id}`,
    type: typeMap[notification.type] || 'system',
    text: `${notification.title}: ${notification.body}`,
    timestamp: new Date(notification.createdAt).getTime()
  }
}

async function buildRecentActivity(messages, reservations, notifications) {
  const activities = [
    ...messages.map(buildMessageActivity),
    ...reservations.map(buildReservationActivity),
    ...notifications.map(buildNotificationActivity)
  ]

  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)
}

const loadStats = async () => {
  isLoading.value = true

  try {
    const profile = localStorage.getItem(`profile_${authStore.user?.uid}`)
    if (profile) {
      const profileData = JSON.parse(profile)
      stats.value.hasProfileComplete = !!(
        profileData.displayName &&
        profileData.contactoPrincipal?.telefono &&
        profileData.contactoPrincipal?.whatsapp
      )
    }

    const [properties, { messages, unread }, subscriptionDays, { reservations, pending }, notifications] =
      await Promise.all([
        loadProperties(),
        loadMessages(),
        loadSubscription(),
        loadReservations(),
        loadNotifications()
      ])

    const propertyStats = derivePropertyStats(properties)

    stats.value = {
      ...stats.value,
      totalProperties: propertyStats.total,
      activeProperties: propertyStats.active,
      inactiveProperties: propertyStats.inactive,
      unreadMessages: unread,
      subscriptionDays,
      totalViews: propertyStats.totalViews,
      pendingReservations: pending
    }

    recentActivity.value = await buildRecentActivity(messages, reservations, notifications)
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  } finally {
    isLoading.value = false
  }
}

const formatRelativeTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('dashboard.time.justNow')
  if (minutes < 60) return t('dashboard.time.minutesAgo', minutes)
  if (hours < 24) return t('dashboard.time.hoursAgo', hours)
  if (days === 1) return t('dashboard.time.yesterday')
  if (days < 7) return t('dashboard.time.daysAgo', days)
  return new Date(timestamp).toLocaleDateString(locale.value || 'es', {
    day: 'numeric',
    month: 'short'
  })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.dashboard-header h1 {
  font-size: 2rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--gray-600);
  font-size: 1rem;
}

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.metric-card {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.metric-icon.properties {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.metric-icon.messages {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.metric-icon.subscription {
  background: linear-gradient(135deg, #10b981, #059669);
}

.metric-icon.views {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.metric-icon.reservations {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.metric-label {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
}

.metric-detail {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
}

.metric-detail .active {
  color: #10b981;
  font-weight: 600;
}

.metric-detail .inactive {
  color: var(--gray-500);
}

.metric-detail .status {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
}

.metric-detail .status.active {
  background: #d1fae5;
  color: #065f46;
}

.metric-detail .status.warning {
  background: #fef3c7;
  color: #92400e;
}

.metric-detail .status.expiring {
  background: #fee2e2;
  color: #991b1b;
}

.metric-link {
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.metric-link:hover {
  text-decoration: underline;
}

.metric-trend {
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.trend-up {
  color: #10b981;
  font-weight: 600;
}

/* Acciones Rápidas */
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  position: relative;
  padding: var(--spacing-xl);
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.action-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.action-card.support {
  border-color: #10b981;
}

.action-card.support:hover {
  border-color: #059669;
  background: #f0fdf4;
}

.action-icon {
  width: 50px;
  height: 50px;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: var(--gray-700);
}

.action-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.action-card p {
  font-size: 0.875rem;
  color: var(--gray-600);
  line-height: 1.4;
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Actividad Reciente */
.activity-list {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.activity-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.activity-item:hover {
  background: var(--gray-50);
}

.activity-item:not(:last-child) {
  border-bottom: 1px solid var(--gray-100);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.view {
  background: #fef3c7;
  color: #92400e;
}

.activity-icon.message {
  background: #e0e7ff;
  color: #3730a3;
}

.activity-icon.property {
  background: #dbeafe;
  color: #1e40af;
}

.activity-icon.subscription {
  background: #d1fae5;
  color: #065f46;
}

.activity-icon.reservation {
  background: #f3e8ff;
  color: #7e22ce;
}

.activity-icon.notification {
  background: #ecfeff;
  color: #155e75;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: var(--gray-800);
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.activity-time {
  color: var(--gray-500);
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--gray-500);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

/* Tips */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.tip-card {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, #fef3c7, #fef08a);
  border-radius: var(--radius-lg);
  border: 2px solid #fbbf24;
}

.tip-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.tip-icon {
  color: var(--gray-700);
}

.tip-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-900);
}

.tip-card p {
  color: var(--gray-700);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.tip-action {
  display: inline-block;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}

.tip-action:hover {
  text-decoration: underline;
}

/* Botones */
.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
