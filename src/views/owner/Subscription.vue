<template>
  <div class="subscription-view">
    <div class="container">
      <h1 class="page-title">Mi Suscripción</h1>

      <div v-if="paymentStore.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando información...</p>
      </div>

      <div v-else-if="!paymentStore.hasActiveSubscription" class="empty-state card">
        <div class="empty-icon">📋</div>
        <h2>No tienes una suscripción activa</h2>
        <p>Elige un plan para comenzar a publicar propiedades</p>
        <button @click="showPlansModal = true" class="btn btn-primary">
          Ver Planes Disponibles
        </button>
      </div>

      <div v-else class="subscription-content">
        <div class="current-plan card">
          <div class="plan-header">
            <div>
              <h2 class="plan-name">{{ paymentStore.currentPlan?.name }}</h2>
              <div class="plan-price">
                <span class="price-amount">{{ formatPrice(paymentStore.currentPlan?.price) }}</span>
                <span class="price-currency">ARS/mes</span>
              </div>
            </div>
            <div class="status-badges">
              <span class="status-badge" :class="subscriptionStatusClass">
                {{ subscriptionStatusText }}
              </span>
            </div>
          </div>

          <div class="plan-details">
            <div class="detail-item">
              <span class="detail-label">📅 Fecha de inicio:</span>
              <span class="detail-value">{{ formatDate(paymentStore.currentSubscription?.startedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">🔄 Próxima renovación:</span>
              <span class="detail-value">{{ formatDate(paymentStore.currentSubscription?.expiresAt) }}</span>
            </div>
          </div>

          <div class="plan-features">
            <h3>Beneficios:</h3>
            <ul>
              <li v-for="(feature, index) in paymentStore.currentPlan?.features" :key="index">
                {{ feature }}
              </li>
            </ul>
          </div>

          <div class="plan-actions">
            <button @click="showPlansModal = true" class="btn btn-primary">
              Cambiar Plan
            </button>
            <button v-if="paymentStore.currentSubscription?.status === 'active'" @click="handleCancelSubscription" class="btn btn-outline">
              Cancelar Suscripción
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showPlansModal" class="modal-overlay" @click="showPlansModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Elige tu Plan</h2>
            <button @click="showPlansModal = false" class="btn-close">✕</button>
          </div>
          <div class="plans-grid">
            <div 
              v-for="plan in activePlans" 
              :key="plan.id" 
              class="plan-card"
              :class="{ 
                'current': paymentStore.currentSubscription?.planId === plan.id,
                'recommended': plan.recommended 
              }"
            >
              <div v-if="plan.recommended" class="badge-recommended">Recomendado</div>
              <div v-if="paymentStore.currentSubscription?.planId === plan.id" class="badge-current">
                Plan Actual
              </div>
              
              <h3>{{ plan.name }}</h3>
              <div class="plan-price">
                <span class="price-amount">{{ formatPrice(plan.price) }}</span>
                <span class="price-period">ARS/mes</span>
              </div>
              
              <ul class="plan-features-list">
                <li v-for="(feature, index) in plan.features" :key="index">
                  ✓ {{ feature }}
                </li>
              </ul>
              
              <button 
                @click="handleSelectPlan(plan.id)" 
                class="btn btn-primary"
                :disabled="paymentStore.currentSubscription?.planId === plan.id"
              >
                {{ paymentStore.currentSubscription?.planId === plan.id ? 'Plan Actual' : 'Seleccionar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const paymentStore = usePaymentStore()
const adminStore = useAdminStore()
const showPlansModal = ref(false)

const activePlans = computed(() => adminStore.subscriptionPlans.filter(p => p.isActive))

const subscriptionStatusClass = computed(() => {
  const status = paymentStore.currentSubscription?.status
  return {
    'active': status === 'active',
    'cancelled': status === 'cancelled',
    'expired': status === 'expired'
  }
})

const subscriptionStatusText = computed(() => {
  const status = paymentStore.currentSubscription?.status
  const statusMap = { 'active': 'Activa', 'cancelled': 'Cancelada', 'expired': 'Expirada' }
  return statusMap[status] || status
})

const formatPrice = (price) => price?.toLocaleString('es-AR') || '0'

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

const handleSelectPlan = async (planId) => {
  try {
    // Si ya tiene suscripción, cambiar directamente
    if (paymentStore.currentSubscription && paymentStore.currentSubscription.status === 'active') {
      if (confirm('¿Confirmas el cambio de plan? Se aplicará de inmediato.')) {
        await paymentStore.changePlan(planId)
        alert('Plan cambiado exitosamente')
        showPlansModal.value = false
      }
    } else {
      // Si no tiene suscripción, ir al checkout
      showPlansModal.value = false
      router.push({ name: 'checkout', query: { plan: planId } })
    }
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

const handleCancelSubscription = async () => {
  if (!confirm('¿Cancelar suscripción?')) return
  try {
    await paymentStore.cancelSubscription()
    alert('Suscripción cancelada')
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

onMounted(() => paymentStore.fetchCurrentSubscription())
</script>

<style scoped>
.subscription-view { min-height: calc(100vh - 200px); padding: 2rem 0; }
.page-title { font-size: 2rem; margin-bottom: 2rem; color: #1a202c; }
.loading-state { text-align: center; padding: 4rem 2rem; }
.spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 4rem 2rem; }
.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
.current-plan { padding: 2rem; }
.plan-header { display: flex; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #e2e8f0; }
.plan-name { font-size: 1.75rem; margin-bottom: 0.5rem; }
.plan-price { display: flex; align-items: baseline; gap: 0.5rem; }
.price-amount { font-size: 2rem; font-weight: 700; color: #4f46e5; }
.price-currency { color: #64748b; }
.status-badge { padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
.status-badge.active { background: #d1fae5; color: #065f46; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }
.plan-details { display: grid; gap: 1rem; margin-bottom: 2rem; }
.detail-item { display: flex; justify-content: space-between; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; }
.detail-label { font-weight: 500; color: #475569; }
.plan-features { margin-bottom: 2rem; }
.plan-features ul { list-style: disc; padding-left: 1.5rem; }
.plan-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 1000; }
.modal-content { background: white; border-radius: 0.75rem; max-width: 1200px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; padding: 2rem; }
.plan-card { position: relative; padding: 2rem; border: 2px solid #e2e8f0; border-radius: 0.75rem; transition: all 0.3s; }
.plan-card:hover { border-color: #4f46e5; transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
.plan-card.current { border-color: #10b981; background: #f0fdf4; }
.plan-card.recommended { border-color: #4f46e5; }
.badge-recommended, .badge-current { position: absolute; top: -12px; right: 1rem; padding: 0.375rem 1rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
.badge-recommended { background: #4f46e5; color: white; }
.badge-current { background: #10b981; color: white; }
.plan-card h3 { font-size: 1.5rem; margin-bottom: 1rem; color: #1a202c; margin-top: 0.5rem; }
.plan-card .plan-price { margin-bottom: 1.5rem; }
.plan-card .price-amount { font-size: 2rem; font-weight: 700; color: #4f46e5; }
.plan-card .price-period { color: #64748b; font-size: 0.875rem; margin-left: 0.25rem; }
.plan-features-list { list-style: none; padding: 0; margin: 1.5rem 0; }
.plan-features-list li { padding: 0.5rem 0; color: #475569; font-size: 0.875rem; }
.plan-card .btn { width: 100%; margin-top: 1rem; }
.plan-card .btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
