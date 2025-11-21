<template>
  <div class="admin-plans">
    <!-- Toast de notificación -->
    <Transition name="toast">
      <div v-if="saveStatus.show" class="toast" :class="saveStatus.type">
        <svg v-if="saveStatus.type === 'success'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>{{ saveStatus.message }}</span>
      </div>
    </Transition>

    <div class="page-header">
      <h1 class="page-title">Gestión de Planes de Suscripción</h1>
      <p class="page-subtitle">Configura precios, características y límites de cada plan</p>
    </div>

    <div class="plans-grid">
      <div 
        v-for="plan in adminStore.subscriptionPlans" 
        :key="plan.id"
        class="plan-card"
        :class="{ recommended: plan.recommended, inactive: !plan.isActive }"
      >
        <div class="plan-header">
          <div>
            <h3 class="plan-name">{{ plan.name }}</h3>
            <div class="plan-status">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  :checked="plan.isActive"
                  @change="togglePlanStatus(plan.id, $event.target.checked)"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                <span class="toggle-text">{{ plan.isActive ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
          <span v-if="plan.recommended" class="badge-recommended">Recomendado</span>
        </div>

        <div class="plan-pricing">
          <div class="price-group">
            <label class="label">Precio Mensual</label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                :value="plan.price"
                @change="updatePlanPrice(plan.id, $event.target.value)"
                step="0.01"
                class="input price-input"
              />
              <span class="input-suffix">{{ plan.currency }}</span>
            </div>
          </div>

          <div class="price-display">
            <div class="price-value">${{ plan.price.toLocaleString('es-AR') }}</div>
            <div class="price-period">ARS por mes</div>
          </div>
        </div>

        <div class="plan-limits">
          <label class="label">Límite de Propiedades</label>
          <select 
            :value="plan.maxProperties"
            @change="updateMaxProperties(plan.id, $event.target.value)"
            class="select"
          >
            <option v-for="n in 20" :key="n" :value="n">{{ n }} {{ n === 1 ? 'propiedad' : 'propiedades' }}</option>
            <option value="-1">Ilimitadas</option>
          </select>
        </div>

        <div class="plan-features">
          <h4 class="features-title">Características</h4>
          <div class="features-list">
            <div 
              v-for="(feature, index) in plan.features" 
              :key="index"
              class="feature-item"
            >
              <div class="feature-text">
                <span class="feature-icon">✓</span>
                <input 
                  type="text"
                  :value="feature"
                  @change="updateFeature(plan.id, index, $event.target.value)"
                  class="feature-input"
                />
              </div>
              <button 
                @click="removeFeature(plan.id, index)"
                class="btn-remove-feature"
                title="Eliminar característica"
              >
                ✕
              </button>
            </div>
          </div>
          <button 
            @click="addFeature(plan.id)"
            class="btn-add-feature"
          >
            + Añadir característica
          </button>
        </div>

        <div class="plan-stats">
          <div class="stat-item">
            <div class="stat-label">Suscriptores</div>
            <div class="stat-value">{{ getSubscribersCount(plan.id) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Ingresos/mes</div>
            <div class="stat-value">${{ (getSubscribersCount(plan.id) * plan.price).toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Card -->
    <div class="summary-card card">
      <h2 class="section-title">Resumen de Ingresos</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-icon blue">💰</div>
          <div class="summary-content">
            <div class="summary-label">Ingresos Mensuales Totales</div>
            <div class="summary-value">${{ totalMonthlyRevenue.toFixed(2) }}</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-icon green">📊</div>
          <div class="summary-content">
            <div class="summary-label">Proyección Anual</div>
            <div class="summary-value">${{ (totalMonthlyRevenue * 12).toFixed(2) }}</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-icon purple">👥</div>
          <div class="summary-content">
            <div class="summary-label">Total Suscriptores Activos</div>
            <div class="summary-value">{{ totalSubscribers }}</div>
          </div>
        </div>
      </div>

      <!-- Revenue by Plan Chart -->
      <div class="revenue-chart">
        <h3 class="chart-title">Distribución de Ingresos por Plan</h3>
        <div class="chart-bars">
          <div 
            v-for="plan in activePlans" 
            :key="plan.id"
            class="chart-bar-item"
          >
            <div class="chart-bar-label">{{ plan.name }}</div>
            <div class="chart-bar-container">
              <div 
                class="chart-bar"
                :style="{ width: getRevenuePercentage(plan.id) + '%' }"
              ></div>
            </div>
            <div class="chart-bar-value">${{ getRevenue(plan.id).toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Table -->
    <div class="comparison-card card">
      <h2 class="section-title">Tabla Comparativa de Planes</h2>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Característica</th>
              <th v-for="plan in adminStore.subscriptionPlans" :key="plan.id">
                {{ plan.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Precio/mes</strong></td>
              <td v-for="plan in adminStore.subscriptionPlans" :key="plan.id">
                ${{ plan.price }}
              </td>
            </tr>
            <tr>
              <td><strong>Propiedades</strong></td>
              <td v-for="plan in adminStore.subscriptionPlans" :key="plan.id">
                {{ plan.maxProperties === -1 ? 'Ilimitadas' : plan.maxProperties }}
              </td>
            </tr>
            <tr>
              <td><strong>Comisión por reserva</strong></td>
              <td v-for="plan in adminStore.subscriptionPlans" :key="plan.id">
                0%
              </td>
            </tr>
            <tr>
              <td><strong>Estado</strong></td>
              <td v-for="plan in adminStore.subscriptionPlans" :key="plan.id">
                <span :class="plan.isActive ? 'text-success' : 'text-muted'">
                  {{ plan.isActive ? '✓ Activo' : '✕ Inactivo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
onMounted(() => {
  adminStore.initPlans()
})

// Estado para feedback de guardado
const saveStatus = ref({
  show: false,
  message: '',
  type: 'success' // 'success' | 'error'
})

const showSaveMessage = (message, type = 'success') => {
  saveStatus.value = { show: true, message, type }
  setTimeout(() => {
    saveStatus.value.show = false
  }, 3000)
}

const activePlans = computed(() => 
  adminStore.subscriptionPlans.filter(p => p.isActive)
)

const totalSubscribers = computed(() => 
  adminStore.users.filter(u => u.subscription?.status === 'active').length
)

const totalMonthlyRevenue = computed(() => 
  Object.values(adminStore.revenueByPlan).reduce((sum, rev) => sum + rev, 0)
)

const getSubscribersCount = (planId) => {
  return adminStore.users.filter(u => u.subscription?.planId === planId && u.subscription?.status === 'active').length
}

const getRevenue = (planId) => {
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  if (!plan) return 0
  return getSubscribersCount(planId) * plan.price
}

const getRevenuePercentage = (planId) => {
  const revenue = getRevenue(planId)
  return totalMonthlyRevenue.value > 0 ? (revenue / totalMonthlyRevenue.value) * 100 : 0
}

const updatePlanPrice = (planId, newPrice) => {
  const price = parseFloat(newPrice)
  if (isNaN(price) || price < 0) {
    showSaveMessage('Precio inválido', 'error')
    return
  }
  
  adminStore.updateSubscriptionPlan(planId, { price })
  adminStore.updateStats()
  showSaveMessage('Precio actualizado correctamente')
}

const updateMaxProperties = (planId, newMax) => {
  const maxProperties = parseInt(newMax)
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  
  if (plan) {
    // Actualizar el límite
    adminStore.updateSubscriptionPlan(planId, { maxProperties })
    
    // Actualizar la característica del límite en la lista de features
    const propertyFeatureIndex = plan.features.findIndex(f => 
      f.includes('propiedad') || f.includes('Propiedad')
    )
    
    if (propertyFeatureIndex !== -1) {
      const newFeatureText = maxProperties === -1 
        ? 'Propiedades ilimitadas' 
        : `Hasta ${maxProperties} ${maxProperties === 1 ? 'propiedad activa' : 'propiedades activas'}`
      
      const updatedFeatures = [...plan.features]
      updatedFeatures[propertyFeatureIndex] = newFeatureText
      adminStore.updateSubscriptionPlan(planId, { features: updatedFeatures })
    }
    
    showSaveMessage('Límite de propiedades actualizado')
  }
}

const togglePlanStatus = (planId, isActive) => {
  adminStore.updateSubscriptionPlan(planId, { isActive })
  showSaveMessage(`Plan ${isActive ? 'activado' : 'desactivado'}`)
}

const updateFeature = (planId, index, newText) => {
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  if (plan && plan.features[index] !== undefined) {
    const updatedFeatures = [...plan.features]
    updatedFeatures[index] = newText
    adminStore.updateSubscriptionPlan(planId, { features: updatedFeatures })
    showSaveMessage('Característica actualizada')
  }
}

const addFeature = (planId) => {
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  if (plan) {
    const updatedFeatures = [...plan.features, 'Nueva característica']
    adminStore.updateSubscriptionPlan(planId, { features: updatedFeatures })
    showSaveMessage('Característica agregada')
  }
}

const removeFeature = (planId, index) => {
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  if (plan && plan.features.length > 1) {
    const updatedFeatures = plan.features.filter((_, i) => i !== index)
    adminStore.updateSubscriptionPlan(planId, { features: updatedFeatures })
    showSaveMessage('Característica eliminada')
  } else {
    showSaveMessage('Debe haber al menos una característica', 'error')
  }
}
</script>

<style scoped>
.admin-plans {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.page-subtitle {
  color: var(--gray-600);
  font-size: 1rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.plan-card {
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  transition: all 0.3s ease;
}

.plan-card.recommended {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.plan-card.inactive {
  opacity: 0.6;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.plan-status {
  margin-top: var(--spacing-xs);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: var(--gray-300);
  border-radius: 999px;
  position: relative;
  transition: background 0.3s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-input:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
}

.badge-recommended {
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.plan-pricing {
  margin-bottom: var(--spacing-lg);
}

.price-group {
  margin-bottom: var(--spacing-md);
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.input-prefix,
.input-suffix {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--gray-100);
  font-weight: 600;
  color: var(--gray-700);
}

.price-input {
  border: none;
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 1rem;
  font-weight: 600;
}

.price-input:focus {
  outline: none;
}

.price-display {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.price-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

.price-period {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.plan-limits {
  margin-bottom: var(--spacing-lg);
}

.plan-features {
  margin-bottom: var(--spacing-lg);
}

.features-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.feature-text {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.feature-icon {
  color: var(--primary-color);
  font-weight: 700;
}

.feature-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.feature-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-remove-feature {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--gray-200);
  border-radius: 50%;
  cursor: pointer;
  color: var(--gray-600);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove-feature:hover {
  background: #fee2e2;
  color: #991b1b;
}

.btn-add-feature {
  width: 100%;
  padding: var(--spacing-sm);
  border: 2px dashed var(--gray-300);
  background: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--primary-color);
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-add-feature:hover {
  border-color: var(--primary-color);
  background: #eff6ff;
}

.plan-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

/* Summary Card */
.summary-card {
  margin-bottom: var(--spacing-2xl);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.summary-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.summary-icon.blue {
  background: #eff6ff;
}

.summary-icon.green {
  background: #f0fdf4;
}

.summary-icon.purple {
  background: #f3e8ff;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xs);
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

/* Revenue Chart */
.revenue-chart {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chart-bar-item {
  display: grid;
  grid-template-columns: 150px 1fr 120px;
  gap: var(--spacing-md);
  align-items: center;
}

.chart-bar-label {
  font-weight: 600;
  color: var(--gray-900);
}

.chart-bar-container {
  height: 32px;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: var(--radius-md);
  transition: width 0.5s ease;
}

.chart-bar-value {
  text-align: right;
  font-weight: 700;
  color: var(--gray-900);
}

/* Comparison Table */
.comparison-card {
  margin-bottom: var(--spacing-2xl);
}

.comparison-table-wrapper {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: var(--spacing-md);
  text-align: left;
  border: 1px solid var(--gray-200);
}

.comparison-table th {
  background: var(--gray-50);
  font-weight: 700;
  color: var(--gray-900);
}

.comparison-table td {
  color: var(--gray-700);
}

.text-success {
  color: #10b981;
}

.text-muted {
  color: var(--gray-400);
}

@media (max-width: 768px) {
  .admin-plans {
    padding: var(--spacing-md);
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .chart-bar-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .chart-bar-value {
    text-align: left;
  }
}

/* Toast Notification */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  z-index: 9999;
  min-width: 250px;
}

.toast svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.toast.success {
  background-color: #10b981;
  color: white;
}

.toast.error {
  background-color: #ef4444;
  color: white;
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

@media (max-width: 768px) {
  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    min-width: auto;
  }
}
</style>
