<template>
  <div class="reservations">
    <header class="page-header">
      <div>
        <h1>Reservas</h1>
        <p class="subtitle">Gestiona las solicitudes de reserva de tus propiedades</p>
      </div>
      <div class="header-actions">
        <select v-model="filterStatus" class="filter-select">
          <option value="all">Todas las reservas</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
    </header>

    <!-- Estadísticas Rápidas -->
    <div class="stats-row">
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div>
          <h3>{{ stats.pending }}</h3>
          <p>Pendientes</p>
        </div>
      </div>
      <div class="stat-card confirmed">
        <div class="stat-icon">✅</div>
        <div>
          <h3>{{ stats.confirmed }}</h3>
          <p>Confirmadas</p>
        </div>
      </div>
      <div class="stat-card total">
        <div class="stat-icon">📊</div>
        <div>
          <h3>{{ stats.total }}</h3>
          <p>Total</p>
        </div>
      </div>
    </div>

    <!-- Lista de Reservas -->
    <div class="reservations-list">
      <div v-if="filteredReservations.length === 0" class="empty-state">
        <span class="empty-icon">📅</span>
        <h3>No hay reservas {{ filterStatus !== 'all' ? filterStatusText : '' }}</h3>
        <p>Las solicitudes de reserva aparecerán aquí</p>
      </div>

      <div 
        v-for="reservation in filteredReservations" 
        :key="reservation.id" 
        class="reservation-card"
        :class="reservation.status"
      >
        <div class="reservation-header">
          <div class="property-info">
            <img :src="reservation.property.image" :alt="reservation.property.title" class="property-thumb">
            <div>
              <h3 class="property-title">{{ reservation.property.title }}</h3>
              <p class="property-location">📍 {{ reservation.property.location }}</p>
            </div>
          </div>
          <div class="status-badge" :class="reservation.status">
            {{ getStatusText(reservation.status) }}
          </div>
        </div>

        <div class="reservation-body">
          <div class="reservation-details">
            <div class="detail-row">
              <span class="label">👤 Huésped:</span>
              <span class="value">{{ reservation.guest.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">📅 Check-in:</span>
              <span class="value">{{ formatDate(reservation.checkIn) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">📅 Check-out:</span>
              <span class="value">{{ formatDate(reservation.checkOut) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">🌙 Noches:</span>
              <span class="value">{{ reservation.nights }}</span>
            </div>
            <div class="detail-row">
              <span class="label">👥 Huéspedes:</span>
              <span class="value">{{ reservation.guests }}</span>
            </div>
            <div class="detail-row price">
              <span class="label">💰 Total:</span>
              <span class="value price-value">${{ reservation.totalPrice }}</span>
            </div>
          </div>

          <div class="guest-info">
            <h4>Información de Contacto</h4>
            <p><strong>Email:</strong> {{ reservation.guest.email }}</p>
            <p v-if="reservation.guest.phone"><strong>Teléfono:</strong> {{ reservation.guest.phone }}</p>
            <p v-if="reservation.message" class="message">
              <strong>Mensaje:</strong><br>
              "{{ reservation.message }}"
            </p>
            <p class="requested-time">
              Solicitada {{ formatRelativeTime(reservation.createdAt) }}
            </p>
          </div>
        </div>

        <div class="reservation-actions" v-if="reservation.status === 'pending'">
          <button @click="confirmReservation(reservation)" class="btn btn-success">
            ✅ Confirmar Reserva
          </button>
          <button @click="rejectReservation(reservation)" class="btn btn-danger">
            ❌ Rechazar
          </button>
          <a 
            :href="getWhatsAppLink(reservation.guest.phone, reservation.property.title)" 
            target="_blank"
            class="btn btn-whatsapp"
            v-if="reservation.guest.phone"
          >
            💬 Contactar por WhatsApp
          </a>
        </div>

        <div class="reservation-actions" v-else-if="reservation.status === 'confirmed'">
          <button @click="cancelReservation(reservation)" class="btn btn-outline">
            Cancelar Reserva
          </button>
          <a 
            :href="getWhatsAppLink(reservation.guest.phone, reservation.property.title)" 
            target="_blank"
            class="btn btn-whatsapp"
            v-if="reservation.guest.phone"
          >
            💬 Contactar Huésped
          </a>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>{{ modalAction === 'confirm' ? '✅ Confirmar Reserva' : '❌ Rechazar Reserva' }}</h2>
          </div>
          <div class="modal-body">
            <p v-if="modalAction === 'confirm'">
              ¿Estás seguro de confirmar esta reserva? Se enviará una notificación automática al huésped por:
            </p>
            <p v-else>
              ¿Estás seguro de rechazar esta reserva? Se notificará al huésped.
            </p>
            <ul class="notification-list" v-if="modalAction === 'confirm'">
              <li>✉️ Email a {{ selectedReservation?.guest.email }}</li>
              <li v-if="selectedReservation?.guest.phone">📱 WhatsApp a {{ selectedReservation?.guest.phone }}</li>
            </ul>
            <div v-if="modalAction === 'reject'" class="form-group">
              <label class="label">Motivo del rechazo (opcional):</label>
              <textarea v-model="rejectionReason" class="textarea" rows="3" placeholder="Ej: Fechas no disponibles, propiedad en mantenimiento..."></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="showConfirmModal = false" class="btn btn-outline">
              Cancelar
            </button>
            <button 
              @click="executeAction" 
              class="btn"
              :class="modalAction === 'confirm' ? 'btn-success' : 'btn-danger'"
              :disabled="processing"
            >
              {{ processing ? 'Procesando...' : (modalAction === 'confirm' ? 'Confirmar' : 'Rechazar') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast de Notificación -->
    <Transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getOwnerReservations } from '@/services/reservations'

const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 
               'https://us-central1-alqui-libres.cloudfunctions.net'
const hasFunctions = !!import.meta.env.VITE_FIREBASE_FUNCTIONS_URL

const filterStatus = ref('all')
const reservations = ref([])
const showConfirmModal = ref(false)
const selectedReservation = ref(null)
const modalAction = ref('confirm')
const rejectionReason = ref('')
const processing = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const stats = computed(() => {
  return {
    total: reservations.value.length,
    pending: reservations.value.filter(r => r.status === 'pending').length,
    confirmed: reservations.value.filter(r => r.status === 'confirmed').length
  }
})

const filteredReservations = computed(() => {
  if (filterStatus.value === 'all') return reservations.value
  return reservations.value.filter(r => r.status === filterStatus.value)
})

const filterStatusText = computed(() => {
  const texts = {
    pending: 'pendientes',
    confirmed: 'confirmadas',
    rejected: 'rechazadas',
    cancelled: 'canceladas'
  }
  return texts[filterStatus.value] || ''
})

const getStatusText = (status) => {
  const texts = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada'
  }
  return texts[status] || status
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatRelativeTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return formatDate(timestamp)
}

const getWhatsAppLink = (phone, propertyTitle) => {
  const cleanPhone = phone.replace(/[^0-9+]/g, '')
  const message = `Hola! Te contacto por tu reserva de "${propertyTitle}" en AlquiLibres.`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

const confirmReservation = (reservation) => {
  selectedReservation.value = reservation
  modalAction.value = 'confirm'
  showConfirmModal.value = true
}

const rejectReservation = (reservation) => {
  selectedReservation.value = reservation
  modalAction.value = 'reject'
  rejectionReason.value = ''
  showConfirmModal.value = true
}

const cancelReservation = async (reservation) => {
  if (!confirm('¿Estás seguro de cancelar esta reserva confirmada?')) {
    return
  }
  
  processing.value = true
  
  try {
    // Modo demo: sin Functions configuradas
    if (!hasFunctions) {
      reservation.status = 'cancelled'
      saveReservations()
      showNotification('Reserva cancelada (modo demo)', 'warning')
      await loadReservations()
      return
    }

    const response = await fetch(`${apiUrl}/cancelReservation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reservationId: reservation.id,
        userId: authStore.user?.uid,
        userType: 'owner'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al cancelar la reserva')
    }
    
    reservation.status = 'cancelled'
    showNotification('Reserva cancelada', 'warning')
    
    // Recargar reservas
    await loadReservations()
  } catch (error) {
    console.error('❌ Error cancelando reserva:', error)
    showNotification('❌ ' + (error.message || 'Error al cancelar la reserva'), 'error')
  } finally {
    processing.value = false
  }
}

const executeAction = async () => {
  processing.value = true
  
  try {
    const endpoint = modalAction.value === 'confirm' ? 'confirmReservation' : 'rejectReservation'
    const payload = {
      reservationId: selectedReservation.value.id,
      ownerId: authStore.user?.uid
    }
    
    if (modalAction.value === 'reject') {
      payload.reason = rejectionReason.value
    }
    
    // Modo demo: sin Functions configuradas
    if (!hasFunctions) {
      if (modalAction.value === 'confirm') {
        selectedReservation.value.status = 'confirmed'
        showNotification('✅ Reserva confirmada (modo demo)', 'success')
      } else {
        selectedReservation.value.status = 'rejected'
        selectedReservation.value.rejectionReason = rejectionReason.value
        showNotification('Reserva rechazada (modo demo)', 'info')
      }
      saveReservations()
      await loadReservations()
      showConfirmModal.value = false
      return
    }

    // Llamar a Firebase Function
    const response = await fetch(`${apiUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al procesar la reserva')
    }
    
    const result = await response.json()
    console.log('✅ Reserva procesada:', result)
    
    // Actualizar estado local
    if (modalAction.value === 'confirm') {
      selectedReservation.value.status = 'confirmed'
      showNotification('✅ Reserva confirmada! Se notificó al huésped por email y WhatsApp', 'success')
    } else {
      selectedReservation.value.status = 'rejected'
      selectedReservation.value.rejectionReason = rejectionReason.value
      showNotification('Reserva rechazada. Se notificó al huésped', 'info')
    }
    
    // Recargar reservas
    await loadReservations()
    
    showConfirmModal.value = false
  } catch (error) {
    console.error('❌ Error procesando reserva:', error)
    showNotification('❌ ' + (error.message || 'Error al procesar la reserva'), 'error')
  } finally {
    processing.value = false
  }
}

// Esta función ya no es necesaria, las notificaciones se envían automáticamente
// desde Firebase Functions cuando cambia el estado de la reserva

const showNotification = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const saveReservations = () => {
  try {
    localStorage.setItem('reservations', JSON.stringify(reservations.value))
  } catch (e) {
    console.warn('No se pudieron guardar reservas en localStorage:', e)
  }
}

const loadReservations = async () => {
  try {
    // Intentar cargar desde Firestore
    if (authStore.user?.uid) {
      console.log('📥 Cargando reservas desde Firestore...')
      reservations.value = await getOwnerReservations(authStore.user.uid)
      console.log('✅ Reservas cargadas:', reservations.value.length)
      return
    }
  } catch (error) {
    console.warn('⚠️ Error cargando desde Firestore, usando localStorage:', error)
  }
  
  // Fallback: Cargar desde localStorage (modo demo)
  const saved = localStorage.getItem('reservations')
  
  if (saved) {
    reservations.value = JSON.parse(saved)
  } else {
    // Datos de ejemplo para demo
    reservations.value = [
      {
        id: '1',
        status: 'pending',
        property: {
          id: '1',
          title: 'Casa con Parrilla y Pileta',
          location: 'Villa Carlos Paz, Córdoba',
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop'
        },
        guest: {
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+54 351 555-1234'
        },
        checkIn: '2025-11-20',
        checkOut: '2025-11-25',
        nights: 5,
        guests: 4,
        totalPrice: 750,
        message: 'Hola! Estamos interesados en tu propiedad para un fin de semana largo con amigos. ¿Está disponible?',
        createdAt: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        id: '2',
        status: 'confirmed',
        property: {
          id: '2',
          title: 'Departamento Céntrico',
          location: 'Córdoba Capital',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop'
        },
        guest: {
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+54 351 555-5678'
        },
        checkIn: '2025-11-15',
        checkOut: '2025-11-18',
        nights: 3,
        guests: 2,
        totalPrice: 450,
        message: 'Viajamos por trabajo. Necesitamos un lugar tranquilo y bien ubicado.',
        createdAt: Date.now() - 24 * 60 * 60 * 1000
      },
      {
        id: '3',
        status: 'pending',
        property: {
          id: '3',
          title: 'Cabaña en las Sierras',
          location: 'La Cumbre, Córdoba',
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop'
        },
        guest: {
          name: 'Carolina Ruiz',
          email: 'caro.ruiz@email.com',
          phone: '+54 351 555-9012'
        },
        checkIn: '2025-12-01',
        checkOut: '2025-12-05',
        nights: 4,
        guests: 6,
        totalPrice: 960,
        message: 'Queremos pasar unos días en familia. ¿La cabaña tiene todo lo necesario para cocinar?',
        createdAt: Date.now() - 5 * 60 * 60 * 1000
      }
    ]
    saveReservations()
  }
}

onMounted(() => {
  loadReservations()
})
</script>

<style scoped>
.reservations {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.page-header h1 {
  font-size: 2rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--gray-600);
  font-size: 1rem;
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 1rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid;
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.confirmed {
  border-left-color: #10b981;
}

.stat-card.total {
  border-left-color: #3b82f6;
}

.stat-icon {
  font-size: 2rem;
}

.stat-card h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 4px;
}

.stat-card p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

/* Reservations List */
.reservations-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.reservation-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border-left: 4px solid;
  transition: all 0.2s;
}

.reservation-card.pending {
  border-left-color: #f59e0b;
}

.reservation-card.confirmed {
  border-left-color: #10b981;
}

.reservation-card.rejected {
  border-left-color: #ef4444;
  opacity: 0.7;
}

.reservation-card.cancelled {
  border-left-color: #6b7280;
  opacity: 0.7;
}

.reservation-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.property-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.property-thumb {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.property-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 4px;
}

.property-location {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.cancelled {
  background: #f3f4f6;
  color: #4b5563;
}

.reservation-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--gray-100);
}

.detail-row.price {
  border-bottom: none;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--gray-200);
}

.detail-row .label {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.detail-row .value {
  font-weight: 600;
  color: var(--gray-900);
}

.price-value {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.guest-info {
  background: var(--gray-50);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.guest-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.guest-info p {
  font-size: 0.875rem;
  color: var(--gray-700);
  margin-bottom: var(--spacing-sm);
}

.guest-info .message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-sm);
  font-style: italic;
  color: var(--gray-600);
}

.requested-time {
  margin-top: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--gray-500);
}

.reservation-actions {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  justify-content: center;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-whatsapp {
  background: #25d366;
  color: white;
}

.btn-whatsapp:hover {
  background: #20ba5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}

.btn-outline {
  background: white;
  border: 2px solid var(--gray-300);
  color: var(--gray-700);
}

.btn-outline:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--gray-600);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--spacing-lg);
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  font-size: 1.5rem;
  color: var(--gray-900);
}

.modal-body {
  padding: var(--spacing-xl);
}

.modal-body p {
  color: var(--gray-700);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.notification-list {
  list-style: none;
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  margin: var(--spacing-lg) 0;
}

.notification-list li {
  padding: var(--spacing-sm) 0;
  color: var(--gray-700);
}

.form-group {
  margin-top: var(--spacing-lg);
}

.label {
  display: block;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-xs);
}

.textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 1rem;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-top: 1px solid var(--gray-200);
}

/* Toast */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  font-weight: 600;
  z-index: 10000;
}

.toast.warning {
  background: #f59e0b;
}

.toast.error {
  background: #ef4444;
}

.toast.info {
  background: #3b82f6;
}

.toast svg {
  width: 24px;
  height: 24px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .reservation-body {
    grid-template-columns: 1fr;
  }

  .reservation-actions {
    flex-direction: column;
  }

  .modal {
    margin: var(--spacing-md);
  }
}
</style>
