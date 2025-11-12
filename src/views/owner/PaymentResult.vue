<template>
  <div class="payment-result-view">
    <div class="container">
      <div class="result-card">
        <!-- Success -->
        <div v-if="status === 'success'" class="result-content success">
          <div class="icon-container">
            <div class="success-checkmark">
              <div class="check-icon">
                <span class="icon-line line-tip"></span>
                <span class="icon-line line-long"></span>
                <div class="icon-circle"></div>
                <div class="icon-fix"></div>
              </div>
            </div>
          </div>
          
          <h1>¡Pago exitoso! 🎉</h1>
          <p class="subtitle">Tu suscripción ha sido activada correctamente</p>
          
          <div class="payment-details">
            <div class="detail-item">
              <span class="label">Plan contratado:</span>
              <span class="value">{{ paymentStore.currentPlan?.name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Monto pagado:</span>
              <span class="value">${{ formatPrice(paymentStore.currentPlan?.price) }} ARS</span>
            </div>
            <div class="detail-item">
              <span class="label">Próxima renovación:</span>
              <span class="value">{{ formatDate(paymentStore.currentSubscription?.expiresAt) }}</span>
            </div>
          </div>

          <div class="next-steps">
            <h3>¿Qué sigue?</h3>
            <ul>
              <li>✓ Ya puedes publicar tus propiedades</li>
              <li>✓ Recibe reservas sin comisiones</li>
              <li>✓ Accede a estadísticas en tiempo real</li>
            </ul>
          </div>

          <div class="actions">
            <router-link to="/panel/propiedades" class="btn btn-primary btn-large">
              Publicar mi primera propiedad
            </router-link>
            <router-link to="/panel/suscripcion" class="btn btn-outline">
              Ver mi suscripción
            </router-link>
          </div>
        </div>

        <!-- Failure -->
        <div v-else-if="status === 'failure'" class="result-content failure">
          <div class="icon-container">
            <div class="error-icon">
              <div class="error-circle">
                <span class="error-line error-line-1"></span>
                <span class="error-line error-line-2"></span>
              </div>
            </div>
          </div>
          
          <h1>Pago rechazado</h1>
          <p class="subtitle">No pudimos procesar tu pago</p>
          
          <div class="error-reasons">
            <h3>Posibles causas:</h3>
            <ul>
              <li>Fondos insuficientes</li>
              <li>Datos de la tarjeta incorrectos</li>
              <li>Límite de compra excedido</li>
              <li>Tarjeta vencida o bloqueada</li>
            </ul>
          </div>

          <div class="actions">
            <router-link to="/panel/checkout?retry=true" class="btn btn-primary btn-large">
              Reintentar pago
            </router-link>
            <router-link to="/panel/suscripcion" class="btn btn-outline">
              Volver a planes
            </router-link>
          </div>

          <div class="support">
            <p>¿Necesitas ayuda? <a href="mailto:soporte@alquilibres.com">Contacta a soporte</a></p>
          </div>
        </div>

        <!-- Pending -->
        <div v-else-if="status === 'pending'" class="result-content pending">
          <div class="icon-container">
            <div class="pending-icon">
              <div class="clock-loader">
                <div class="clock-hand"></div>
              </div>
            </div>
          </div>
          
          <h1>Pago en proceso</h1>
          <p class="subtitle">Estamos procesando tu pago</p>
          
          <div class="pending-info">
            <p>Tu pago está siendo verificado por MercadoPago. Este proceso puede tardar unos minutos.</p>
            <p><strong>Te enviaremos un email</strong> cuando tu suscripción esté activa.</p>
          </div>

          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot completed"></div>
              <div class="timeline-content">
                <h4>Pago iniciado</h4>
                <p>Tu solicitud fue recibida</p>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot active"></div>
              <div class="timeline-content">
                <h4>En verificación</h4>
                <p>Procesando tu pago...</p>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h4>Activación</h4>
                <p>Tu plan será activado</p>
              </div>
            </div>
          </div>

          <div class="actions">
            <router-link to="/panel" class="btn btn-primary btn-large">
              Ir al panel
            </router-link>
            <button @click="checkPaymentStatus" class="btn btn-outline" :disabled="checking">
              {{ checking ? 'Verificando...' : 'Verificar estado' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()

const status = ref(route.query.status || 'pending')
const checking = ref(false)

const formatPrice = (price) => {
  return price?.toLocaleString('es-AR') || '0'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const checkPaymentStatus = async () => {
  checking.value = true
  try {
    await paymentStore.fetchCurrentSubscription()
    if (paymentStore.hasActiveSubscription) {
      status.value = 'success'
    }
  } catch (error) {
    console.error('Error checking payment:', error)
  } finally {
    checking.value = false
  }
}

onMounted(async () => {
  // Recargar datos de suscripción
  await paymentStore.fetchCurrentSubscription()
  
  // Si el pago fue exitoso, actualizar localStorage
  if (status.value === 'success') {
    const mockUserData = localStorage.getItem('mockUser')
    if (mockUserData) {
      const user = JSON.parse(mockUserData)
      if (user.subscription) {
        localStorage.setItem('mockUser', JSON.stringify(user))
      }
    }
  }
})
</script>

<style scoped>
.payment-result-view {
  min-height: calc(100vh - 200px);
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
}

.result-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.result-content {
  padding: 3rem 2rem;
  text-align: center;
}

/* Icon Animations */
.icon-container {
  margin-bottom: 2rem;
}

/* Success Checkmark Animation */
.success-checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.check-icon {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid #10b981;
}

.icon-line {
  height: 5px;
  background-color: #10b981;
  display: block;
  border-radius: 2px;
  position: absolute;
  z-index: 10;
}

.line-tip {
  top: 46px;
  left: 14px;
  width: 25px;
  transform: rotate(45deg);
  animation: icon-line-tip 0.75s;
}

.line-long {
  top: 38px;
  right: 8px;
  width: 47px;
  transform: rotate(-45deg);
  animation: icon-line-long 0.75s;
}

@keyframes icon-line-tip {
  0% { width: 0; left: 1px; top: 19px; }
  54% { width: 0; left: 1px; top: 19px; }
  70% { width: 50px; left: -8px; top: 37px; }
  84% { width: 17px; left: 21px; top: 48px; }
  100% { width: 25px; left: 14px; top: 45px; }
}

@keyframes icon-line-long {
  0% { width: 0; right: 46px; top: 54px; }
  65% { width: 0; right: 46px; top: 54px; }
  84% { width: 55px; right: 0px; top: 35px; }
  100% { width: 47px; right: 8px; top: 38px; }
}

.icon-circle {
  top: -4px;
  left: -4px;
  z-index: 10;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: absolute;
  box-sizing: content-box;
  border: 4px solid rgba(16, 185, 129, 0.2);
}

.icon-fix {
  top: 8px;
  width: 5px;
  left: 26px;
  z-index: 1;
  height: 85px;
  position: absolute;
  transform: rotate(-45deg);
  background-color: white;
}

/* Error Icon Animation */
.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.error-circle {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid #ef4444;
  animation: rotate-circle 0.5s ease-in;
}

.error-line {
  height: 5px;
  background-color: #ef4444;
  display: block;
  border-radius: 2px;
  position: absolute;
  top: 37px;
  width: 47px;
}

.error-line-1 {
  left: 17px;
  transform: rotate(45deg);
  animation: error-line-1 0.5s 0.25s ease-in;
}

.error-line-2 {
  right: 16px;
  transform: rotate(-45deg);
  animation: error-line-2 0.5s 0.25s ease-in;
}

@keyframes rotate-circle {
  0% { transform: rotate(-45deg); }
  100% { transform: rotate(0); }
}

@keyframes error-line-1 {
  0% { width: 0; left: 37px; }
  100% { width: 47px; left: 17px; }
}

@keyframes error-line-2 {
  0% { width: 0; right: 37px; }
  100% { width: 47px; right: 16px; }
}

/* Pending Clock Animation */
.pending-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.clock-loader {
  width: 80px;
  height: 80px;
  border: 4px solid #f59e0b;
  border-radius: 50%;
  position: relative;
  animation: pulse 2s ease-in-out infinite;
}

.clock-hand {
  width: 2px;
  height: 30px;
  background: #f59e0b;
  position: absolute;
  top: 10px;
  left: 50%;
  transform-origin: bottom center;
  animation: rotate-hand 2s linear infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes rotate-hand {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}

/* Content Styles */
h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2rem;
}

.payment-details {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #64748b;
}

.value {
  font-weight: 600;
  color: #1a202c;
}

.next-steps {
  text-align: left;
  background: #ecfdf5;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.next-steps h3 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.next-steps ul {
  list-style: none;
  padding: 0;
}

.next-steps li {
  padding: 0.5rem 0;
  color: #065f46;
}

.error-reasons {
  text-align: left;
  background: #fef2f2;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.error-reasons h3 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #991b1b;
}

.error-reasons ul {
  list-style: disc;
  padding-left: 1.5rem;
  color: #dc2626;
}

.pending-info {
  background: #fffbeb;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.pending-info p {
  margin: 0.5rem 0;
  color: #92400e;
}

/* Timeline */
.timeline {
  margin: 2rem 0;
  padding: 0 2rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 3px solid #cbd5e0;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.timeline-dot.completed {
  background: #10b981;
  border-color: #059669;
}

.timeline-dot.active {
  background: #f59e0b;
  border-color: #d97706;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.timeline-content h4 {
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
  color: #1a202c;
}

.timeline-content p {
  font-size: 0.875rem;
  margin: 0;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.support {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.support p {
  color: #64748b;
  font-size: 0.875rem;
}

.support a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

.support a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .result-content {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-large {
    width: 100%;
  }
}
</style>
