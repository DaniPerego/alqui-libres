<template>
  <div class="auth-page">
    <div class="container">
      <div class="auth-wrapper">
        <!-- Demo Info Banner -->
        <div v-if="isDemoMode" class="demo-info-card">
          <div class="demo-info-header">
            <span class="demo-icon"><FlaskConical :size="20" /></span>
            <strong>{{ t('auth.demoMode') }}</strong>
          </div>
          <p class="demo-info-text">
            {{ t('auth.demoDescription') }}
          </p>
          <div class="demo-credentials">
            <div class="demo-credential-item">
              <span class="demo-label">{{ t('auth.guest') }}</span>
              <code class="demo-value">huesped@alquilibres.com / guest123</code>
              <button @click="autofillDemo('huesped@alquilibres.com','guest123')" class="copy-btn" title="Autocompletar"><Zap :size="16" /></button>
            </div>
            <div class="demo-credential-item">
              <span class="demo-label">{{ t('auth.owner') }}</span>
              <code class="demo-value">usuario@alquilibres.com / user123</code>
              <button @click="autofillDemo('usuario@alquilibres.com','user123')" class="copy-btn" title="Autocompletar"><Zap :size="16" /></button>
            </div>
          </div>
          <p class="demo-warning"><AlertTriangle :size="16" /> {{ t('auth.demoWarning') }}</p>
        </div>

        <div class="auth-card card">
          <h1 class="auth-title">{{ t('auth.loginTitle') }}</h1>
          <p class="auth-subtitle">{{ t('auth.loginSubtitle') }}</p>
          
          <form @submit.prevent="handleSubmit" class="auth-form" autocomplete="off">
            <div class="form-group">
              <label for="email" class="label"><Mail :size="18" /> {{ t('auth.email') }}</label>
              <input 
                id="email"
                ref="emailInput"
                v-model="formData.email" 
                type="email" 
                class="input" 
                placeholder="tu@email.com"
                name="alqui-user"
                autocomplete="off"
                required
                @focus="disarmAutofillGuard"
                @keydown="disarmAutofillGuard"
              />
            </div>
            
            <div class="form-group">
              <label for="password" class="label"><Lock :size="18" /> {{ t('auth.password') }}</label>
              <input 
                id="password"
                ref="passwordInput"
                v-model="formData.password" 
                type="password" 
                class="input" 
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                name="alqui-pass"
                autocomplete="off"
                required
                @focus="disarmAutofillGuard"
                @keydown="disarmAutofillGuard"
              />
            </div>
            
            <Transition name="error-slide">
              <div v-if="error" class="error-message">
                {{ error }}
              </div>
            </Transition>
            
            <button 
              type="submit" 
              class="btn btn-primary btn-lg" 
              :disabled="loading"
            >
              <span v-if="!loading">{{ t('auth.loginButton') }}</span>
              <span v-else>{{ t('auth.loading') }}</span>
            </button>
          </form>
          
          <div class="auth-footer">
            <p>{{ t('auth.noAccount') }} 
              <router-link to="/registro" class="auth-link">{{ t('auth.register') }}</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { FlaskConical, Zap, AlertTriangle, Mail, Lock } from '@lucide/vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const isDemoMode = ref(true)

const emailInput = ref(null)
const passwordInput = ref(null)

// The browser's password/address manager drops saved values into the fields
// right after load. The form must always start empty, so a short-lived guard
// clears anything the browser injected — and steps aside the moment the user
// focuses or types (never fight the user's own input).
const autofillGuard = ref(true)
const disarmAutofillGuard = () => {
  autofillGuard.value = false
}

const clearBrowserAutofill = () => {
  if (!autofillGuard.value) return
  for (const el of [emailInput.value, passwordInput.value]) {
    if (el && el.value && document.activeElement !== el) {
      el.value = ''
    }
  }
  if (formData.value.email || formData.value.password) {
    formData.value.email = ''
    formData.value.password = ''
  }
}

onMounted(async () => {
  await nextTick()
  clearBrowserAutofill()
  requestAnimationFrame(clearBrowserAutofill)
  setTimeout(clearBrowserAutofill, 300)
})

// Autocompletar credenciales demo
const autofillDemo = (email, password) => {
  autofillGuard.value = false
  formData.value.email = email
  formData.value.password = password
}

// Copiar al portapapeles
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('Copiado al portapapeles:', text)
  } catch (err) {
    console.log('No se pudo copiar automaticamente')
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  const result = await authStore.login(formData.value.email, formData.value.password)
  
  if (result.success) {
    const requested = router.currentRoute.value.query.redirect
    if (authStore.user?.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push(requested || '/panel')
    }
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
  display: flex;
  align-items: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.demo-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95em;
  opacity: 0.8;
  margin-top: 8px;
}

.auth-card {
  padding: var(--spacing-2xl);
  border-top: 4px solid;
  border-image: linear-gradient(90deg, #667eea, #764ba2) 1;
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

.form-group .label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-message {
  background-color: #fee;
  color: var(--danger-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  padding: 0 var(--spacing-md);
  margin: 0;
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

/* Responsive - Mobile adjustments */
@media (max-width: 600px) {
  .auth-page {
    padding: var(--spacing-md) 0;
    min-height: auto;
  }

  .demo-info-card {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    font-size: 0.875rem;
  }

  .demo-info-header {
    font-size: 1rem;
    margin-bottom: var(--spacing-sm);
  }

  .demo-info-text {
    font-size: 0.875rem;
    margin-bottom: var(--spacing-sm);
  }

  .demo-credentials {
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .demo-credential-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: var(--spacing-sm);
  }

  .demo-label {
    font-size: 0.8rem;
    min-width: auto;
  }

  .demo-value {
    font-size: 0.75rem;
    padding: 3px 8px;
    width: 100%;
    word-break: break-all;
  }

  .copy-btn {
    align-self: flex-end;
    margin-top: -4px;
  }

  .auth-card {
    padding: var(--spacing-lg);
  }

  .auth-title {
    font-size: 1.5rem;
  }

  .auth-subtitle {
    font-size: 0.875rem;
  }
}
</style>
