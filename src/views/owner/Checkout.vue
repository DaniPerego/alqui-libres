<template>
  <div class="checkout-view">
    <div class="container">
      <div class="checkout-header">
        <router-link to="/panel/suscripcion" class="back-link">← Volver a planes</router-link>
        <h1>Finalizar suscripción</h1>
      </div>

      <div class="checkout-content">
        <div class="plan-summary card">
          <h2>Resumen de tu suscripción</h2>
          <div v-if="selectedPlan" class="plan-info">
            <div class="plan-header">
              <h3>{{ selectedPlan.name }}</h3>
              <span v-if="selectedPlan.recommended" class="badge-recommended">Recomendado</span>
            </div>
            <div class="plan-price">
              <span class="price-amount">${{ formatPrice(selectedPlan.price) }}</span>
              <span class="price-period">ARS por mes</span>
            </div>
            <div class="plan-features">
              <h4>Incluye:</h4>
              <ul>
                <li v-for="(feature, index) in selectedPlan.features" :key="index">✓ {{ feature }}</li>
              </ul>
            </div>
            <div class="pricing-details">
              <div class="detail-row">
                <span>Suscripción mensual</span>
                <span>${{ formatPrice(selectedPlan.price) }}</span>
              </div>
              <div class="detail-row total">
                <span>Total a pagar hoy</span>
                <span>${{ formatPrice(selectedPlan.price) }} ARS</span>
              </div>
            </div>
            <div class="payment-info-summary">
              <p>💳 Pago seguro con MercadoPago</p>
              <p>🔄 Renovación automática mensual</p>
              <p>❌ Cancela cuando quieras</p>
            </div>
          </div>
        </div>

        <div class="payment-section card">
          <h2>Método de pago</h2>
          
          <div v-if="!mpConfigured && isDev" class="config-warning">
            <div class="warning-icon">⚠️</div>
            <p class="warning-title">MercadoPago no configurado</p>
            <p class="warning-text">Estás en modo desarrollo.</p>
            <div class="warning-actions">
              <button @click="simulatePayment" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Simulando...' : '🧪 Simular pago exitoso' }}
              </button>
            </div>
          </div>

          <div v-else-if="!mpConfigured && !isDev" class="config-error">
            <p>❌ El servicio de pagos no está disponible</p>
          </div>

          <div v-else class="mp-payment">
            <div class="payment-tabs">
              <button @click="paymentMode = 'card'" :class="['tab-btn', { active: paymentMode === 'card' }]">💳 Tarjeta</button>
              <button @click="paymentMode = 'qr'" :class="['tab-btn', { active: paymentMode === 'qr' }]">📱 QR MercadoPago</button>
            </div>

            <div v-if="paymentMode === 'card'" class="payment-form">
              <div id="cardPaymentBrick_container"></div>
              <div v-if="brickError" class="error-message">❌ {{ brickError }}</div>
              <p class="security-note">🔒 Pago 100% seguro</p>
            </div>

            <div v-else class="qr-payment">
              <div v-if="!qrCode" class="qr-generate">
                <div class="qr-icon">📱</div>
                <h3>Pagar con QR de MercadoPago</h3>
                <p>Escanea el código QR con la app de MercadoPago</p>
                <button @click="generateQRCode" class="btn btn-primary" :disabled="loading">
                  {{ loading ? 'Generando QR...' : '🔄 Generar código QR' }}
                </button>
              </div>

              <div v-else class="qr-display">
                <h3>Escanea el código QR</h3>
                <div class="qr-container">
                  <img :src="qrCode" alt="QR MercadoPago" class="qr-image">
                </div>
                <div class="qr-info">
                  <p class="qr-amount">Monto: ${{ formatPrice(selectedPlan.price) }} ARS</p>
                  <p class="qr-instructions">1. Abre la app de MercadoPago<br>2. Toca "Pagar con QR"<br>3. Escanea este código</p>
                </div>
                <button @click="resetQR" class="btn btn-outline">🔄 Generar nuevo QR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { loadMercadoPago } from '@mercadopago/sdk-js'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const planId = ref(route.query.plan)
const loading = ref(false)
const paymentMode = ref('card')
const brickError = ref('')
const qrCode = ref(null)
let cardPaymentBrick = null

const isDev = computed(() => import.meta.env.DEV)
const selectedPlan = computed(() => {
  if (!planId.value) return null
  return adminStore.subscriptionPlans.find(p => p.id === planId.value)
})
const mpConfigured = computed(() => {
  const settings = adminStore.paymentSettings
  return settings && settings.publicKey && settings.accessToken
})
const isAdmin = computed(() => authStore.user?.role === 'admin')

const formatPrice = (price) => price?.toLocaleString('es-AR') || '0'

const simulatePayment = async () => {
  if (!selectedPlan.value) return
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await paymentStore.simulatePaymentSuccess(selectedPlan.value.id)
    router.push('/panel/payment-result?status=success')
  } catch (error) {
    router.push('/panel/payment-result?status=failure')
  } finally {
    loading.value = false
  }
}

const generateQRCode = async () => {
  if (!selectedPlan.value) return
  loading.value = true
  try {
    const preference = await paymentStore.createPreference(selectedPlan.value.id)
    
    // Obtener la URL de pago de MercadoPago
    const paymentUrl = isDev.value 
      ? (preference.sandbox_init_point || preference.init_point)
      : preference.init_point
    
    console.log('📱 Generando QR para URL:', paymentUrl)
    console.log('🔑 Preferencia ID:', preference.id)
    
    // Generar QR con la URL real de MercadoPago
    // El usuario escanea el QR y se abre la página de pago de MP en su dispositivo
    qrCode.value = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + 
      encodeURIComponent(paymentUrl)
    
    console.log('✅ QR generado exitosamente')
  } catch (error) {
    console.error('❌ Error generando QR:', error)
    alert('Error al generar código QR: ' + error.message)
  } finally {
    loading.value = false
  }
}

const resetQR = () => { qrCode.value = null }

const initCardPaymentBrick = async () => {
  if (!mpConfigured.value || !selectedPlan.value) return
  try {
    brickError.value = ''
    if (cardPaymentBrick) {
      try { await cardPaymentBrick.unmount() } catch (e) {}
    }
    const publicKey = adminStore.paymentSettings.publicKey
    await loadMercadoPago()
    const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' })
    const bricksBuilder = mp.bricks()
    cardPaymentBrick = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
      initialization: { amount: selectedPlan.value.price, payer: { email: authStore.user?.email || '' } },
      customization: { visual: { style: { theme: 'default' } }, paymentMethods: { maxInstallments: 12, creditCard: 'all', debitCard: 'all' } },
      callbacks: {
        onReady: () => console.log('Brick ready'),
        onSubmit: async (formData) => {
          loading.value = true
          try {
            if (isDev.value) await new Promise(resolve => setTimeout(resolve, 2000))
            await paymentStore.simulatePaymentSuccess(selectedPlan.value.id)
            router.push('/panel/payment-result?status=success')
          } catch (error) {
            brickError.value = error.message || 'Error'
            router.push('/panel/payment-result?status=failure')
          } finally {
            loading.value = false
          }
        },
        onError: (error) => { brickError.value = 'Error al cargar' }
      }
    })
  } catch (error) {
    brickError.value = 'Error: ' + error.message
  }
}

watch(paymentMode, async (newMode) => {
  if (newMode === 'card' && mpConfigured.value) {
    await nextTick()
    await initCardPaymentBrick()
  } else if (newMode === 'qr') {
    qrCode.value = null
  }
})

onMounted(async () => {
  if (!planId.value || !selectedPlan.value) {
    router.push('/panel/suscripcion')
    return
  }
  if (mpConfigured.value && paymentMode.value === 'card') {
    await nextTick()
    await initCardPaymentBrick()
  }
})

onUnmounted(() => {
  if (cardPaymentBrick) {
    try { cardPaymentBrick.unmount() } catch (error) {}
  }
})
</script>

<style scoped>
.checkout-view { min-height: calc(100vh - 200px); padding: 2rem 0; background: #f8fafc; }
.checkout-header { margin-bottom: 2rem; }
.back-link { display: inline-block; color: #4f46e5; text-decoration: none; margin-bottom: 1rem; font-weight: 500; }
.back-link:hover { text-decoration: underline; }
.checkout-header h1 { font-size: 2rem; color: #1a202c; margin: 0; }
.checkout-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; align-items: start; }
.card { background: white; border-radius: 0.75rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.plan-summary h2 { margin: 0 0 1.5rem 0; font-size: 1.5rem; color: #1a202c; }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.plan-header h3 { margin: 0; font-size: 1.75rem; color: #1a202c; }
.badge-recommended { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
.plan-price { margin: 1.5rem 0; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0.75rem; text-align: center; color: white; }
.price-amount { display: block; font-size: 3rem; font-weight: 700; margin-bottom: 0.25rem; }
.price-period { font-size: 1rem; opacity: 0.9; }
.plan-features { margin: 1.5rem 0; }
.plan-features h4 { margin: 0 0 1rem 0; color: #1a202c; font-size: 1rem; }
.plan-features ul { list-style: none; padding: 0; margin: 0; }
.plan-features li { padding: 0.5rem 0; color: #475569; }
.pricing-details { border-top: 2px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem; }
.detail-row { display: flex; justify-content: space-between; padding: 0.5rem 0; color: #64748b; }
.detail-row.total { font-size: 1.125rem; font-weight: 700; color: #1a202c; border-top: 1px solid #e2e8f0; margin-top: 0.5rem; padding-top: 1rem; }
.payment-info-summary { margin-top: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; }
.payment-info-summary p { margin: 0.5rem 0; color: #475569; font-size: 0.875rem; }
.payment-section h2 { margin: 0 0 1.5rem 0; font-size: 1.5rem; color: #1a202c; }
.config-warning { text-align: center; padding: 2rem; background: #fffbeb; border: 2px solid #fbbf24; border-radius: 0.75rem; }
.warning-icon { font-size: 3rem; margin-bottom: 1rem; }
.warning-title { font-size: 1.25rem; font-weight: 700; color: #92400e; margin: 0 0 0.5rem 0; }
.warning-text { color: #78350f; margin-bottom: 1.5rem; }
.warning-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.config-error { text-align: center; padding: 2rem; background: #fef2f2; border: 2px solid #ef4444; border-radius: 0.75rem; color: #991b1b; }
.mp-payment { min-height: 300px; }
.payment-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 2px solid #e2e8f0; }
.tab-btn { flex: 1; padding: 1rem; background: none; border: none; border-bottom: 3px solid transparent; color: #64748b; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { color: #4f46e5; background: #f8fafc; }
.tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; background: #f8fafc; }
.payment-form { padding: 1.5rem 0; }
#cardPaymentBrick_container { margin-bottom: 2rem; }
.error-message { padding: 1rem; background: #fef2f2; border: 1px solid #ef4444; border-radius: 0.5rem; color: #991b1b; margin: 1rem 0; text-align: center; }
.qr-payment { padding: 2rem 0; text-align: center; }
.qr-generate { padding: 3rem 2rem; }
.qr-icon { font-size: 4rem; margin-bottom: 1rem; }
.qr-generate h3 { font-size: 1.5rem; color: #1a202c; margin: 1rem 0; }
.qr-generate p { color: #64748b; margin-bottom: 2rem; }
.qr-display { padding: 2rem; }
.qr-display h3 { font-size: 1.5rem; color: #1a202c; margin-bottom: 2rem; }
.qr-container { display: flex; justify-content: center; margin: 2rem 0; padding: 2rem; background: white; border: 2px solid #e2e8f0; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
.qr-image { width: 300px; height: 300px; border-radius: 0.5rem; }
.qr-info { margin: 2rem 0; padding: 1.5rem; background: #f8fafc; border-radius: 0.5rem; text-align: left; }
.qr-amount { font-size: 1.5rem; font-weight: 700; color: #4f46e5; margin-bottom: 1rem; }
.qr-instructions { color: #475569; line-height: 1.8; }
.security-note { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #64748b; font-size: 0.875rem; margin-top: 2rem; }
.btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; text-decoration: none; display: inline-block; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-outline { background: white; color: #4f46e5; border: 2px solid #4f46e5; }
.btn-outline:hover { background: #f8fafc; }
@media (max-width: 1024px) {
  .checkout-content { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .price-amount { font-size: 2rem; }
  .payment-tabs { flex-direction: column; }
  .tab-btn { border-bottom: none; border-left: 3px solid transparent; }
  .tab-btn.active { border-left-color: #4f46e5; }
  .qr-image { width: 250px; height: 250px; }
}
</style>
