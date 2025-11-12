<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Panel de Administración</h1>
        <p class="dashboard-subtitle">Vista general de la plataforma Alquí Libres</p>
      </div>
      <button @click="refreshData" class="btn btn-primary" :disabled="adminStore.loading">
        <span v-if="!adminStore.loading">🔄 Actualizar</span>
        <span v-else>Cargando...</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ adminStore.stats.totalUsers }}</div>
          <div class="stat-label">Usuarios Totales</div>
          <div class="stat-detail">{{ adminStore.activeUsers.length }} activos</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">🏘️</div>
        <div class="stat-content">
          <div class="stat-value">{{ adminStore.stats.totalProperties }}</div>
          <div class="stat-label">Propiedades</div>
          <div class="stat-detail">{{ adminStore.stats.pendingApprovals }} pendientes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">💳</div>
        <div class="stat-content">
          <div class="stat-value">{{ adminStore.stats.activeSubscriptions }}</div>
          <div class="stat-label">Suscripciones Activas</div>
          <div class="stat-detail">Este mes</div>
        </div>
      </div>

      <div class="stat-card highlight">
        <div class="stat-icon purple">💰</div>
        <div class="stat-content">
          <div class="stat-value">${{ adminStore.stats.monthlyRevenue.toFixed(2) }}</div>
          <div class="stat-label">Ingresos Mensuales</div>
          <div class="stat-detail">USD recurrente</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <h2 class="section-title">Acciones Rápidas</h2>
      <div class="actions-grid">
        <router-link to="/admin/usuarios" class="action-card">
          <span class="action-icon">👥</span>
          <span class="action-text">Gestionar Usuarios</span>
          <span class="action-badge">{{ adminStore.users.length }}</span>
        </router-link>

        <router-link to="/admin/propiedades" class="action-card">
          <span class="action-icon">🏠</span>
          <span class="action-text">Moderar Propiedades</span>
          <span class="action-badge" v-if="adminStore.stats.pendingApprovals > 0">
            {{ adminStore.stats.pendingApprovals }}
          </span>
        </router-link>

        <router-link to="/admin/planes" class="action-card">
          <span class="action-icon">💎</span>
          <span class="action-text">Gestionar Planes</span>
          <span class="action-badge">{{ adminStore.subscriptionPlans.length }}</span>
        </router-link>

        <router-link to="/admin/pagos" class="action-card">
          <span class="action-icon">💳</span>
          <span class="action-text">Config. Pagos</span>
          <span class="action-badge" v-if="!adminStore.paymentSettings">⚠️</span>
          <span class="action-badge success" v-else>✓</span>
        </router-link>

        <router-link to="/admin/configuracion" class="action-card">
          <span class="action-icon">⚙️</span>
          <span class="action-text">Configuración</span>
        </router-link>
      </div>
    </div>

    <!-- Revenue by Plan -->
    <div class="revenue-section card">
      <h2 class="section-title">Ingresos por Plan</h2>
      <div class="revenue-grid">
        <div 
          v-for="(revenue, planName) in adminStore.revenueByPlan" 
          :key="planName"
          class="revenue-item"
        >
          <div class="revenue-plan">{{ planName }}</div>
          <div class="revenue-bar-container">
            <div 
              class="revenue-bar" 
              :style="{ width: calculatePercentage(revenue) + '%' }"
            ></div>
          </div>
          <div class="revenue-amount">${{ revenue.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <!-- Recent Users -->
    <div class="recent-section card">
      <div class="section-header">
        <h2 class="section-title">Usuarios Recientes</h2>
        <router-link to="/admin/usuarios" class="view-all-link">Ver todos →</router-link>
      </div>
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in recentUsers" :key="user.uid">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.email?.charAt(0).toUpperCase() }}</div>
                  <span>{{ user.displayName || 'Sin nombre' }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="plan-badge" :class="user.subscription?.planId">
                  {{ getPlanName(user.subscription?.planId) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pending Approvals -->
    <div v-if="adminStore.pendingProperties.length > 0" class="pending-section card">
      <div class="section-header">
        <h2 class="section-title">Propiedades Pendientes de Aprobación</h2>
        <router-link to="/admin/propiedades" class="view-all-link">Ver todas →</router-link>
      </div>
      <div class="pending-grid">
        <div 
          v-for="property in adminStore.pendingProperties.slice(0, 4)" 
          :key="property.id"
          class="pending-card"
        >
          <img :src="property.mainImage" :alt="property.title" class="pending-image" />
          <div class="pending-content">
            <h3 class="pending-title">{{ property.title }}</h3>
            <p class="pending-location">📍 {{ property.location.city }}, {{ property.location.state }}</p>
            <div class="pending-actions">
              <button @click="approveProperty(property.id)" class="btn-approve">✓ Aprobar</button>
              <button @click="rejectProperty(property.id)" class="btn-reject">✕ Rechazar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const recentUsers = computed(() => 
  [...adminStore.users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
)

const refreshData = async () => {
  await adminStore.loadAllData()
}

const calculatePercentage = (revenue) => {
  const max = Math.max(...Object.values(adminStore.revenueByPlan))
  return max > 0 ? (revenue / max) * 100 : 0
}

const getPlanName = (planId) => {
  if (!planId) return 'Sin plan'
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  return plan ? plan.name : planId
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const approveProperty = async (propertyId) => {
  const result = await adminStore.updatePropertyStatus(propertyId, 'active')
  if (result.success) {
    alert(result.message || 'Propiedad aprobada')
  }
}

const rejectProperty = async (propertyId) => {
  if (!confirm('¿Estás seguro de rechazar esta propiedad?')) return
  
  const result = await adminStore.updatePropertyStatus(propertyId, 'rejected')
  if (result.success) {
    alert(result.message || 'Propiedad rechazada')
  }
}

onMounted(() => {
  adminStore.loadAllData()
})
</script>

<style scoped>
.admin-dashboard {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.dashboard-subtitle {
  color: var(--gray-600);
  font-size: 1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: #eff6ff;
}

.stat-icon.orange {
  background: #fff4ed;
}

.stat-icon.green {
  background: #f0fdf4;
}

.stat-icon.purple {
  background: rgba(255, 255, 255, 0.2);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.stat-card.highlight .stat-value {
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xs);
}

.stat-card.highlight .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-detail {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.stat-card.highlight .stat-detail {
  color: rgba(255, 255, 255, 0.7);
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-card {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--gray-900);
  transition: all 0.2s ease;
  position: relative;
}

.action-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-icon {
  font-size: 2.5rem;
}

.action-text {
  font-weight: 600;
  text-align: center;
}

.action-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.action-badge.success {
  background: #10b981;
}

/* Revenue Section */
.revenue-section {
  margin-bottom: var(--spacing-2xl);
}

.revenue-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.revenue-item {
  display: grid;
  grid-template-columns: 150px 1fr 120px;
  gap: var(--spacing-md);
  align-items: center;
}

.revenue-plan {
  font-weight: 600;
  color: var(--gray-900);
}

.revenue-bar-container {
  height: 32px;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.revenue-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: var(--radius-md);
  transition: width 0.5s ease;
}

.revenue-amount {
  text-align: right;
  font-weight: 700;
  color: var(--gray-900);
  font-size: 1.125rem;
}

/* Recent Section */
.recent-section {
  margin-bottom: var(--spacing-2xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.view-all-link {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.875rem;
}

.view-all-link:hover {
  text-decoration: underline;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: var(--spacing-md);
  border-bottom: 2px solid var(--gray-200);
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.users-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--gray-200);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.plan-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.plan-badge.basic {
  background: #dbeafe;
  color: #1e40af;
}

.plan-badge.pro {
  background: #fef3c7;
  color: #92400e;
}

.plan-badge.enterprise {
  background: #f3e8ff;
  color: #6b21a8;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* Pending Approvals */
.pending-section {
  margin-bottom: var(--spacing-2xl);
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.pending-card {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
}

.pending-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.pending-content {
  padding: var(--spacing-md);
}

.pending-title {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  font-size: 1rem;
  color: var(--gray-900);
}

.pending-location {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.pending-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-approve,
.btn-reject {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: var(--spacing-md);
  }

  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .revenue-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .revenue-amount {
    text-align: left;
  }

  .users-table {
    overflow-x: auto;
  }
}
</style>
