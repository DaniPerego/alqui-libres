<template>
  <div class="admin-settings">
    <header class="page-header">
      <h1>⚙️ Configuración General</h1>
      <p class="subtitle">Configuración general de la plataforma</p>
    </header>

    <div class="settings-container">
      <div class="settings-section">
        <h2>🌐 Información de la Plataforma</h2>
        <div class="form-group">
          <label>Nombre de la Plataforma</label>
          <input type="text" v-model="settings.platformName" class="form-control">
        </div>
        <div class="form-group">
          <label>Email de Contacto</label>
          <input type="email" v-model="settings.contactEmail" class="form-control">
        </div>
        <div class="form-group">
          <label>Teléfono de Soporte</label>
          <input type="tel" v-model="settings.supportPhone" class="form-control">
        </div>
      </div>

      <div class="settings-section">
        <h2>💼 Comisiones y Tarifas</h2>
        <div class="form-group">
          <label>Comisión por Reserva (%)</label>
          <input type="number" v-model="settings.commissionRate" class="form-control" min="0" max="100">
          <small>Actualmente: Sin comisiones (modelo de suscripción)</small>
        </div>
      </div>

      <div class="settings-section">
        <h2>📧 Notificaciones</h2>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="settings.emailNotifications">
            Habilitar notificaciones por email
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="settings.whatsappNotifications">
            Habilitar notificaciones por WhatsApp
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h2>🔒 Seguridad</h2>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="settings.requireEmailVerification">
            Requerir verificación de email
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="settings.moderateProperties">
            Moderar propiedades antes de publicar
          </label>
        </div>
      </div>

      <div class="actions">
        <button @click="saveSettings" class="btn-primary" :disabled="saving">
          {{ saving ? 'Guardando...' : '💾 Guardar Cambios' }}
        </button>
      </div>
    </div>

    <!-- Toast de confirmación -->
    <transition name="fade">
      <div v-if="showToast" class="toast success">
        ✅ Configuración guardada correctamente
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const settings = computed({
  get: () => adminStore.platformSettings,
  set: (val) => {
    adminStore.platformSettings = val
  }
})

const saving = ref(false)
const showToast = ref(false)

const saveSettings = async () => {
  saving.value = true
  
  try {
    const result = await adminStore.updatePlatformSettings(settings.value)
    
    if (result.success) {
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } else {
      alert('Error al guardar: ' + (result.error || 'Error desconocido'))
    }
  } catch (error) {
    console.error('Error guardando configuración:', error)
    alert('Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  adminStore.initPlatformSettings()
})
</script>

<style scoped>
.admin-settings {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.settings-container {
  max-width: 800px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.settings-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

small {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .admin-settings {
    padding: 1rem;
  }

  .settings-section {
    padding: 1.5rem;
  }
}
</style>
