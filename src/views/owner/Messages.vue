<template>
  <div class="messages-page">
    <div class="page-header">
      <h1 class="page-title">Mensajes</h1>
    </div>
    
    <div class="messages-container card">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h2>No tienes mensajes</h2>
        <p>Cuando los huéspedes se pongan en contacto, verás sus mensajes aquí</p>
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
            <span>📍 Propiedad: {{ message.propertyTitle || 'Sin título' }}</span>
          </div>
          
          <div class="message-details">
            <span>📅 Check-in: {{ message.checkIn }}</span>
            <span>📅 Check-out: {{ message.checkOut }}</span>
            <span>👥 Huéspedes: {{ message.guests }}</span>
          </div>
          
          <div class="message-content">
            <p>{{ message.message }}</p>
          </div>
          
          <div class="message-actions">
            <button class="btn btn-primary btn-sm">Responder</button>
            <button 
              v-if="message.status === 'unread'" 
              @click="markAsRead(message.id)"
              class="btn btn-secondary btn-sm"
            >
              Marcar como leído
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Plantillas de Respuesta Rápida -->
    <div class="quick-responses card">
      <h3 class="section-title">Plantillas de Respuesta Rápida</h3>
      <div class="templates-grid">
        <button class="template-btn">
          <strong>Confirmar Disponibilidad</strong>
          <p>¡Hola! Confirmo que la propiedad está disponible para esas fechas...</p>
        </button>
        <button class="template-btn">
          <strong>Solicitar Información</strong>
          <p>Gracias por tu interés. Necesitaría algunos datos adicionales...</p>
        </button>
        <button class="template-btn">
          <strong>Enviar Instrucciones</strong>
          <p>¡Reserva confirmada! Aquí están las instrucciones de llegada...</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { mockMessages } from '@/data/mockData'

const messages = ref([...mockMessages])

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const markAsRead = (messageId) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.status = 'read'
  }
}

onMounted(() => {
  // TODO: Cargar mensajes desde Firestore
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
