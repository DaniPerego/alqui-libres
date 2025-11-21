<template>
  <div class="dashboard-home">
    <header class="dashboard-header">
      <div>
        <h1>¡Hola, {{ userName }}! 👋</h1>
        <p class="subtitle">Resumen de tu actividad en AlquiLibres</p>
      </div>
      <router-link to="/panel/propiedades/nueva" class="btn btn-primary">
        ➕ Nueva Propiedad
      </router-link>
    </header>

    <!-- Tarjetas de Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon properties">🏠</div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.totalProperties }}</h3>
          <p class="metric-label">Propiedades Publicadas</p>
          <div class="metric-detail">
            <span class="active">{{ stats.activeProperties }} activas</span>
            <span class="inactive">{{ stats.inactiveProperties }} inactivas</span>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon messages">💬</div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.unreadMessages }}</h3>
          <p class="metric-label">Mensajes Sin Leer</p>
          <router-link v-if="stats.unreadMessages > 0" to="/panel/mensajes" class="metric-link">
            Ver mensajes →
          </router-link>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon subscription">💳</div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.subscriptionDays }}</h3>
          <p class="metric-label">Días de Suscripción</p>
          <div class="metric-detail">
            <span :class="['status', subscriptionStatus]">
              {{ subscriptionStatusText }}
            </span>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon views">👁️</div>
        <div class="metric-content">
          <h3 class="metric-value">{{ stats.totalViews }}</h3>
          <p class="metric-label">Visualizaciones Totales</p>
          <p class="metric-trend">
            <span class="trend-up">↑ +{{ stats.viewsThisWeek }}</span> esta semana
          </p>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <section class="quick-actions-section">
      <h2 class="section-title">Acciones Rápidas</h2>
      <div class="quick-actions-grid">
        <router-link to="/panel/propiedades/nueva" class="action-card">
          <div class="action-icon">➕</div>
          <h3>Publicar Propiedad</h3>
          <p>Agrega una nueva propiedad a tu catálogo</p>
        </router-link>

        <router-link to="/panel/propiedades" class="action-card">
          <div class="action-icon">✏️</div>
          <h3>Editar Propiedades</h3>
          <p>Actualiza información de tus publicaciones</p>
        </router-link>

        <router-link to="/panel/mensajes" class="action-card">
          <div class="action-icon">💬</div>
          <h3>Ver Mensajes</h3>
          <p>Responde a consultas de huéspedes</p>
          <span v-if="stats.unreadMessages > 0" class="badge">{{ stats.unreadMessages }}</span>
        </router-link>

        <router-link to="/panel/perfil" class="action-card">
          <div class="action-icon">👤</div>
          <h3>Actualizar Perfil</h3>
          <p>Gestiona tu información de contacto</p>
        </router-link>

        <router-link to="/panel/suscripcion" class="action-card">
          <div class="action-icon">💎</div>
          <h3>Mi Suscripción</h3>
          <p>Ver detalles y cambiar plan</p>
        </router-link>

        <a href="https://wa.me/5493511234567" target="_blank" class="action-card support">
          <div class="action-icon">🆘</div>
          <h3>Soporte</h3>
          <p>¿Necesitas ayuda? Contáctanos</p>
        </a>
      </div>
    </section>

    <!-- Actividad Reciente -->
    <section class="recent-activity-section">
      <h2 class="section-title">Actividad Reciente</h2>
      <div class="activity-list">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            {{ getActivityIcon(activity.type) }}
          </div>
          <div class="activity-content">
            <p class="activity-text">{{ activity.text }}</p>
            <p class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</p>
          </div>
        </div>

        <div v-if="recentActivity.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <p>No hay actividad reciente</p>
          <p class="empty-hint">Las acciones que realices aparecerán aquí</p>
        </div>
      </div>
    </section>

    <!-- Tips y Ayuda -->
    <section class="tips-section">
      <h2 class="section-title">💡 Consejos para Mejorar</h2>
      <div class="tips-grid">
        <div class="tip-card" v-if="!stats.hasProfileComplete">
          <div class="tip-header">
            <span class="tip-icon">👤</span>
            <h3>Completa tu Perfil</h3>
          </div>
          <p>Agrega tus datos de contacto y redes sociales para generar más confianza con los huéspedes.</p>
          <router-link to="/panel/perfil" class="tip-action">Completar ahora →</router-link>
        </div>

        <div class="tip-card" v-if="stats.totalProperties === 0">
          <div class="tip-header">
            <span class="tip-icon">🏠</span>
            <h3>Publica tu Primera Propiedad</h3>
          </div>
          <p>¡Comienza a ganar dinero! Agrega fotos atractivas y una descripción detallada.</p>
          <router-link to="/panel/propiedades/nueva" class="tip-action">Publicar ahora →</router-link>
        </div>

        <div class="tip-card">
          <div class="tip-header">
            <span class="tip-icon">📸</span>
            <h3>Fotos de Calidad</h3>
          </div>
          <p>Las propiedades con 5 o más fotos profesionales reciben un 40% más de consultas.</p>
        </div>

        <div class="tip-card">
          <div class="tip-header">
            <span class="tip-icon">⚡</span>
            <h3>Responde Rápido</h3>
          </div>
          <p>Contesta mensajes en menos de 1 hora para aumentar tus posibilidades de reserva.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const authStore = useAuthStore()
const adminStore = useAdminStore()

const stats = ref({
  totalProperties: 0,
  activeProperties: 0,
  inactiveProperties: 0,
  unreadMessages: 0,
  subscriptionDays: 0,
  totalViews: 0,
  viewsThisWeek: 0,
  hasProfileComplete: false
})

const recentActivity = ref([])

const userName = computed(() => {
  return authStore.user?.displayName?.split(' ')[0] || 'Usuario'
})

const subscriptionStatus = computed(() => {
  if (stats.value.subscriptionDays > 10) return 'active'
  if (stats.value.subscriptionDays > 5) return 'warning'
  return 'expiring'
})

const subscriptionStatusText = computed(() => {
  if (stats.value.subscriptionDays > 10) return 'Activa'
  if (stats.value.subscriptionDays > 5) return 'Por vencer'
  if (stats.value.subscriptionDays > 0) return 'Próxima a vencer'
  return 'Vencida'
})

const loadStats = () => {
  // TODO: Cargar stats reales desde Firestore
  // Por ahora usamos datos de ejemplo
  
  // Verificar si tiene perfil completo
  const profile = localStorage.getItem(`profile_${authStore.user?.uid}`)
  const hasProfile = !!profile
  
  if (hasProfile) {
    const profileData = JSON.parse(profile)
    stats.value.hasProfileComplete = !!(
      profileData.displayName &&
      profileData.contactoPrincipal?.telefono &&
      profileData.contactoPrincipal?.whatsapp
    )
  }

  // Simulación de datos (en producción vendrían de Firestore)
  stats.value = {
    ...stats.value,
    totalProperties: 3,
    activeProperties: 3,
    inactiveProperties: 0,
    unreadMessages: 2,
    subscriptionDays: 23,
    totalViews: 156,
    viewsThisWeek: 28
  }

  // Actividad reciente simulada
  recentActivity.value = [
    {
      id: 1,
      type: 'view',
      text: 'Tu propiedad "Casa con Parrilla" recibió 5 nuevas visitas',
      timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 horas atrás
    },
    {
      id: 2,
      type: 'message',
      text: 'Nuevo mensaje de María sobre "Departamento Céntrico"',
      timestamp: Date.now() - 5 * 60 * 60 * 1000 // 5 horas atrás
    },
    {
      id: 3,
      type: 'property',
      text: 'Editaste la propiedad "Cabaña en las Sierras"',
      timestamp: Date.now() - 24 * 60 * 60 * 1000 // 1 día atrás
    },
    {
      id: 4,
      type: 'subscription',
      text: 'Tu suscripción se renovó exitosamente',
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 días atrás
    }
  ]
}

const getActivityIcon = (type) => {
  const icons = {
    view: '👁️',
    message: '💬',
    property: '🏠',
    subscription: '💳',
    profile: '👤'
  }
  return icons[type] || '📌'
}

const formatRelativeTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(timestamp).toLocaleDateString('es-ES', { 
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
  font-size: 1.75rem;
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
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
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
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-icon.view {
  background: #fef3c7;
}

.activity-icon.message {
  background: #e0e7ff;
}

.activity-icon.property {
  background: #dbeafe;
}

.activity-icon.subscription {
  background: #d1fae5;
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
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
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
  font-size: 1.5rem;
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
