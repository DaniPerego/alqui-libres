<template>
  <div class="messages-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('messages.title') }}</h1>
    </div>

    <div v-if="loading" class="messages-container card loading-state">
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else class="messages-container card">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h2>{{ t('messages.empty.title') }}</h2>
        <p>{{ t('messages.empty.description') }}</p>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-card"
          :class="{ unread: message.status === 'unread' }"
        >
          <div class="message-header">
            <div class="message-guest">
              <strong>{{ message.guestName }}</strong>
              <span class="message-email">{{ message.guestEmail }}</span>
            </div>
            <span class="message-date">{{ formatDate(message.createdAt) }}</span>
          </div>

          <div class="message-property">
            <span>📍 {{ t('messages.propertyLabel') }}: {{ message.propertyTitle || t('messages.noTitle') }}</span>
          </div>

          <div class="message-details">
            <span>📅 {{ t('messages.checkIn') }}: {{ message.checkIn }}</span>
            <span>📅 {{ t('messages.checkOut') }}: {{ message.checkOut }}</span>
            <span>👥 {{ t('messages.guests') }}: {{ message.guests }}</span>
          </div>

          <div class="message-content">
            <p>{{ message.message }}</p>
          </div>

          <div v-if="message.reply" class="message-reply">
            <p><strong>{{ t('messages.reply') }}:</strong> {{ message.reply }}</p>
          </div>

          <div v-if="replyingToId === message.id" class="reply-form">
            <textarea
              v-model="replyText"
              :placeholder="t('messages.replyPlaceholder')"
              rows="3"
              class="reply-textarea"
            />
            <div class="reply-form-actions">
              <button @click="sendReply(message.id)" class="btn btn-primary btn-sm">
                {{ t('messages.send') }}
              </button>
              <button @click="cancelReply" class="btn btn-secondary btn-sm">
                {{ t('messages.cancel') }}
              </button>
            </div>
          </div>

          <div v-else class="message-actions">
            <button @click="startReply(message.id)" class="btn btn-primary btn-sm">
              {{ t('messages.reply') }}
            </button>
            <button
              v-if="message.status === 'unread'"
              @click="markAsRead(message.id)"
              class="btn btn-secondary btn-sm"
            >
              {{ t('messages.markAsRead') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Plantillas de Respuesta Rápida -->
    <div class="quick-responses card">
      <h3 class="section-title">{{ t('messages.quickResponses') }}</h3>
      <div class="templates-grid">
        <button
          v-for="template in quickTemplates"
          :key="template.key"
          class="template-btn"
        >
          <strong>{{ template.title }}</strong>
          <p>{{ template.body }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMessages, markMessageAsRead, markMessageAsReplied } from '@/services/messages'

const { t, locale } = useI18n()

const messages = ref([])
const loading = ref(false)
const replyText = ref('')
const replyingToId = ref(null)

const quickTemplates = computed(() => [
  {
    key: 'confirmAvailability',
    title: t('messages.template.confirmAvailability'),
    body: t('messages.template.confirmAvailabilityDesc')
  },
  {
    key: 'requestInfo',
    title: t('messages.template.requestInfo'),
    body: t('messages.template.requestInfoDesc')
  },
  {
    key: 'sendInstructions',
    title: t('messages.template.sendInstructions'),
    body: t('messages.template.sendInstructionsDesc')
  }
])

const formatDate = (date) => {
  return new Date(date).toLocaleDateString(locale.value || 'es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadMessages = async () => {
  loading.value = true
  try {
    messages.value = await getMessages()
  } finally {
    loading.value = false
  }
}

const startReply = (messageId) => {
  replyingToId.value = messageId
  replyText.value = ''
}

const cancelReply = () => {
  replyingToId.value = null
  replyText.value = ''
}

const sendReply = async (messageId) => {
  const result = await markMessageAsReplied(messageId)
  if (result.success) {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.status = 'replied'
      message.read = true
      if (replyText.value.trim()) {
        message.reply = replyText.value.trim()
      }
    }
  }
  cancelReply()
}

const markAsRead = async (messageId) => {
  const result = await markMessageAsRead(messageId)
  if (result.success) {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.status = 'read'
      message.read = true
    }
  }
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.messages-container {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.empty-state p {
  color: var(--gray-600);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.message-card {
  padding: var(--spacing-lg);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.message-card.unread {
  background-color: #eff6ff;
  border-left: 4px solid var(--primary-color);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.message-guest {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message-email {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.message-date {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.message-property {
  margin-bottom: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.message-details {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  font-size: 0.875rem;
  color: var(--gray-600);
}

.message-content {
  padding: var(--spacing-md);
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.message-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.message-reply {
  padding: var(--spacing-md);
  background-color: #ecfdf5;
  border-left: 3px solid #10b981;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  font-size: 0.875rem;
  color: var(--gray-800);
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.reply-textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
}

.reply-form-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.loading-state {
  text-align: center;
  color: var(--gray-600);
}

.quick-responses {
  padding: var(--spacing-xl);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.template-btn {
  text-align: left;
  padding: var(--spacing-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all var(--transition-base);
}

.template-btn:hover {
  border-color: var(--primary-color);
  background-color: var(--gray-50);
}

.template-btn strong {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--gray-900);
}

.template-btn p {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0;
}
</style>
