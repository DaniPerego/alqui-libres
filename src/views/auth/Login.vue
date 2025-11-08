<template>
  <div class="auth-page">
    <div class="container">
      <div class="auth-wrapper">
        <!-- Demo Info Banner -->
        <div v-if="isDemoMode" class="demo-info-card">
          <div class="demo-info-header">
            <span class="demo-icon">🧪</span>
            <strong>Modo de Prueba</strong>
          </div>
          <p class="demo-info-text">
            Use estas credenciales para acceder al panel demo:
          </p>
          <div class="demo-credentials">
            <div class="demo-credential-item">
              <span class="demo-label">Email:</span>
              <code class="demo-value">demo@alquilubres.com</code>
              <button @click="copyToClipboard('demo@alquilubres.com')" class="copy-btn" title="Copiar">📋</button>
            </div>
            <div class="demo-credential-item">
              <span class="demo-label">Password:</span>
              <code class="demo-value">demo123</code>
              <button @click="copyToClipboard('demo123')" class="copy-btn" title="Copiar">📋</button>
            </div>
          </div>
          <button @click="autofillDemo" class="btn-autofill">
            ⚡ Autocompletar credenciales
          </button>
        </div>

        <div class="auth-card card">
          <h1 class="auth-title">Iniciar Sesión</h1>
          <p class="auth-subtitle">Accede a tu panel de control</p>
          
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label class="label">Correo Electrónico</label>
              <input 
                v-model="formData.email" 
                type="email" 
                class="input" 
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="label">Contraseña</label>
              <input 
                v-model="formData.password" 
                type="password" 
                class="input" 
                placeholder="••••••••"
                required
              />
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary btn-lg" 
              :disabled="loading"
            >
              <span v-if="!loading">Iniciar Sesión</span>
              <span v-else>Cargando...</span>
            </button>
          </form>
          
          <div class="auth-footer">
            <p>¿No tienes cuenta? 
              <router-link to="/registro" class="auth-link">Regístrate</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { auth } from '@/config/firebase'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const isDemoMode = computed(() => !auth)

// Autocompletar credenciales demo
const autofillDemo = () => {
  formData.value.email = 'demo@alquilubres.com'
  formData.value.password = 'demo123'
}

// Copiar al portapapeles
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('✅ Copiado al portapapeles:', text)
  } catch (err) {
    console.log('⚠️ No se pudo copiar automáticamente')
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  const result = await authStore.login(formData.value.email, formData.value.password)
  
  if (result.success) {
    const redirect = router.currentRoute.value.query.redirect || '/panel'
    router.push(redirect)
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>

<style scoped>
.auth-page {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
}

.auth-wrapper {
  max-width: 450px;
  margin: 0 auto;
}

/* Demo Info Card */
.demo-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.demo-info-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.125rem;
  margin-bottom: var(--spacing-md);
}

.demo-icon {
  font-size: 1.5rem;
}

.demo-info-text {
  margin-bottom: var(--spacing-md);
  opacity: 0.95;
}

.demo-credentials {
  background: rgba(255, 255, 255, 0.15);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.demo-credential-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.demo-credential-item:last-child {
  margin-bottom: 0;
}

.demo-label {
  font-weight: 600;
  min-width: 80px;
}

.demo-value {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  flex: 1;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-autofill {
  width: 100%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-autofill:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

.auth-card {
  padding: var(--spacing-2xl);
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.auth-subtitle {
  text-align: center;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.error-message {
  background-color: #fee;
  color: var(--danger-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.auth-footer {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
  text-align: center;
}

.auth-link {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
