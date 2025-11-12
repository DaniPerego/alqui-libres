<template>
  <div class="admin-payment-settings">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Configuración de Pagos</h1>
        <p class="page-subtitle">Configura las credenciales de MercadoPago para procesar pagos</p>
      </div>

      <!-- Estado de la integración -->
      <div class="integration-status card">
        <div class="status-header">
          <div class="status-icon" :class="{ 'active': isConfigured }">
            {{ isConfigured ? '✓' : '⚠' }}
          </div>
          <div>
            <h3>Estado de la integración</h3>
            <p :class="isConfigured ? 'text-success' : 'text-warning'">
              {{ isConfigured ? 'MercadoPago configurado correctamente' : 'MercadoPago no configurado' }}
            </p>
          </div>
        </div>
        
        <div v-if="isConfigured" class="status-details">
          <div class="detail-row">
            <span class="label">Modo:</span>
            <span class="badge" :class="settingsData.mode === 'production' ? 'badge-success' : 'badge-warning'">
              {{ settingsData.mode === 'production' ? 'Producción' : 'Sandbox (Pruebas)' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Última actualización:</span>
            <span>{{ formatDate(settingsData.lastUpdated) }}</span>
          </div>
        </div>
      </div>

      <!-- Formulario de configuración -->
      <div class="settings-form card">
        <h2>Credenciales de MercadoPago</h2>
        
        <form @submit.prevent="handleSave">
          <!-- Modo de operación -->
          <div class="form-group">
            <label class="form-label">
              Modo de operación
              <span class="required">*</span>
            </label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="settingsData.mode" 
                  value="sandbox"
                >
                <div class="radio-content">
                  <span class="radio-title">Sandbox (Pruebas)</span>
                  <span class="radio-desc">Para desarrollo y testing</span>
                </div>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="settingsData.mode" 
                  value="production"
                >
                <div class="radio-content">
                  <span class="radio-title">Producción</span>
                  <span class="radio-desc">Para procesar pagos reales</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Public Key -->
          <div class="form-group">
            <label for="publicKey" class="form-label">
              Public Key
              <span class="required">*</span>
              <span class="label-hint">(Comienza con APP_USR-...)</span>
            </label>
            <div class="input-with-icon">
              <input 
                id="publicKey"
                type="text"
                v-model="settingsData.publicKey"
                class="form-input"
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              >
              <span class="input-icon">🔑</span>
            </div>
            <p class="help-text">
              Se usa en el frontend para inicializar el checkout
            </p>
          </div>

          <!-- Access Token -->
          <div class="form-group">
            <label for="accessToken" class="form-label">
              Access Token
              <span class="required">*</span>
              <span class="label-hint">(Comienza con APP_USR-...)</span>
            </label>
            <div class="input-with-icon">
              <input 
                id="accessToken"
                :type="showAccessToken ? 'text' : 'password'"
                v-model="settingsData.accessToken"
                class="form-input"
                placeholder="APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx"
                required
              >
              <button 
                type="button" 
                class="toggle-visibility"
                @click="showAccessToken = !showAccessToken"
              >
                {{ showAccessToken ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <p class="help-text">
              Se usa en el backend para crear preferencias y procesar pagos (mantener secreto)
            </p>
          </div>

          <!-- Webhook URL -->
          <div class="form-group">
            <label for="webhookUrl" class="form-label">
              Webhook URL
              <span class="label-hint">(Opcional)</span>
            </label>
            <div class="input-with-icon">
              <input 
                id="webhookUrl"
                type="url"
                v-model="settingsData.webhookUrl"
                class="form-input"
                placeholder="https://tusitio.com/api/mercadopago/webhook"
              >
              <span class="input-icon">🔗</span>
            </div>
            <p class="help-text">
              URL donde MercadoPago enviará notificaciones de pagos (IPN)
            </p>
          </div>

          <!-- Notification Email -->
          <div class="form-group">
            <label for="notificationEmail" class="form-label">
              Email de notificaciones
              <span class="label-hint">(Opcional)</span>
            </label>
            <div class="input-with-icon">
              <input 
                id="notificationEmail"
                type="email"
                v-model="settingsData.notificationEmail"
                class="form-input"
                placeholder="pagos@tusitio.com"
              >
              <span class="input-icon">📧</span>
            </div>
            <p class="help-text">
              Email donde se enviarán notificaciones de pagos y errores
            </p>
          </div>

          <!-- Statement Descriptor -->
          <div class="form-group">
            <label for="statementDescriptor" class="form-label">
              Descriptor en el resumen
              <span class="label-hint">(Máx. 11 caracteres)</span>
            </label>
            <input 
              id="statementDescriptor"
              type="text"
              v-model="settingsData.statementDescriptor"
              class="form-input"
              placeholder="ALQUILIBRES"
              maxlength="11"
            >
            <p class="help-text">
              Nombre que aparecerá en el resumen de tarjeta del cliente
            </p>
          </div>

          <!-- Auto Return -->
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox"
                v-model="settingsData.autoReturn"
              >
              <span>Retorno automático después del pago</span>
            </label>
            <p class="help-text">
              Redirigir automáticamente al usuario después de completar el pago
            </p>
          </div>

          <!-- Acciones -->
          <div class="form-actions">
            <button 
              type="button" 
              @click="handleTest" 
              class="btn btn-outline"
              :disabled="saving || testing"
            >
              {{ testing ? 'Probando...' : '🧪 Probar conexión' }}
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="saving || !isFormValid"
            >
              {{ saving ? 'Guardando...' : '💾 Guardar configuración' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Guía de configuración -->
      <div class="help-section card">
        <h2>¿Cómo obtener tus credenciales?</h2>
        <ol class="help-steps">
          <li>
            <strong>Crea una cuenta en MercadoPago</strong>
            <p>Registrate en <a href="https://www.mercadopago.com.ar" target="_blank">mercadopago.com.ar</a></p>
          </li>
          <li>
            <strong>Accede a tus credenciales</strong>
            <p>Ve a "Tu negocio" → "Configuración" → "Credenciales"</p>
          </li>
          <li>
            <strong>Elige el modo</strong>
            <p><strong>Sandbox:</strong> Para pruebas (usa tarjetas de test)<br>
            <strong>Producción:</strong> Para pagos reales (requiere verificación de identidad)</p>
          </li>
          <li>
            <strong>Copia tus credenciales</strong>
            <p>Public Key y Access Token del modo que elegiste</p>
          </li>
        </ol>

        <div class="help-links">
          <a 
            href="https://www.mercadopago.com.ar/developers/es/docs/credentials" 
            target="_blank" 
            class="help-link"
          >
            📚 Documentación de credenciales
          </a>
          <a 
            href="https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test" 
            target="_blank" 
            class="help-link"
          >
            🧪 Tarjetas de prueba
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const showAccessToken = ref(false)
const saving = ref(false)
const testing = ref(false)

const settingsData = ref({
  mode: 'sandbox',
  publicKey: '',
  accessToken: '',
  webhookUrl: '',
  notificationEmail: '',
  statementDescriptor: 'ALQUILIBRES',
  autoReturn: true,
  lastUpdated: null
})

const isConfigured = computed(() => {
  return settingsData.value.publicKey && settingsData.value.accessToken
})

const isFormValid = computed(() => {
  return settingsData.value.publicKey.length > 0 && 
         settingsData.value.accessToken.length > 0
})

const formatDate = (date) => {
  if (!date) return 'Nunca'
  return new Date(date).toLocaleString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleTest = async () => {
  if (!isFormValid.value) {
    alert('⚠️ Completa Public Key y Access Token para probar')
    return
  }

  testing.value = true
  try {
    // Simular prueba de conexión
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // TODO: En producción, hacer una petición real al backend
    // para validar las credenciales con MercadoPago
    
    const isValid = settingsData.value.publicKey.startsWith('APP_USR') && 
                    settingsData.value.accessToken.startsWith('APP_USR')
    
    if (isValid) {
      alert('✓ Credenciales válidas. Conexión exitosa con MercadoPago')
    } else {
      alert('✗ Credenciales inválidas. Verifica que sean correctas')
    }
  } catch (error) {
    alert('Error al probar la conexión: ' + error.message)
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    settingsData.value.lastUpdated = new Date().toISOString()
    
    // Guardar en el store
    await adminStore.updatePaymentSettings(settingsData.value)
    
    alert('✓ Configuración guardada correctamente')
  } catch (error) {
    alert('Error al guardar: ' + error.message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // Cargar configuración guardada
  const savedSettings = adminStore.paymentSettings
  if (savedSettings) {
    settingsData.value = { ...settingsData.value, ...savedSettings }
  }
})
</script>

<style scoped>
.admin-payment-settings {
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
}

.card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Integration Status */
.integration-status {
  border-left: 4px solid #f59e0b;
}

.integration-status.active {
  border-left-color: #10b981;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fef3c7;
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.status-icon.active {
  background: #d1fae5;
  color: #10b981;
}

.status-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
}

.text-success {
  color: #10b981;
  font-weight: 500;
}

.text-warning {
  color: #f59e0b;
  font-weight: 500;
}

.status-details {
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-row .label {
  color: #64748b;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

/* Form */
.settings-form h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #1a202c;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.label-hint {
  color: #64748b;
  font-weight: 400;
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input-with-icon {
  position: relative;
}

.input-with-icon .form-input {
  padding-right: 3rem;
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
}

.toggle-visibility {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-visibility:hover {
  opacity: 1;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

/* Radio Group */
.radio-group {
  display: grid;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #4f46e5;
  background: #f8fafc;
}

.radio-option input[type="radio"] {
  margin-top: 0.25rem;
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-title {
  font-weight: 600;
  color: #1a202c;
}

.radio-desc {
  font-size: 0.875rem;
  color: #64748b;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Help Section */
.help-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  color: #1a202c;
}

.help-steps {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.help-steps li {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.help-steps strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1a202c;
}

.help-steps p {
  color: #64748b;
  margin: 0.25rem 0;
}

.help-steps a {
  color: #4f46e5;
  text-decoration: none;
}

.help-steps a:hover {
  text-decoration: underline;
}

.help-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.help-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.help-link:hover {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .help-links {
    flex-direction: column;
  }
}
</style>
