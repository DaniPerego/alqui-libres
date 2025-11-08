<template>
  <div class="auth-page">
    <div class="container">
      <div class="auth-wrapper">
        <div class="auth-card card">
          <h1 class="auth-title">Crear Cuenta</h1>
          <p class="auth-subtitle">Empieza a publicar tus propiedades</p>
          
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label for="displayName" class="label">Nombre Completo</label>
              <input 
                id="displayName"
                v-model="formData.displayName" 
                type="text" 
                class="input" 
                placeholder="Juan Pérez"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="email" class="label">Correo Electrónico</label>
              <input 
                id="email"
                v-model="formData.email" 
                type="email" 
                class="input" 
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="password" class="label">Contraseña</label>
              <input 
                id="password"
                v-model="formData.password" 
                type="password" 
                class="input" 
                placeholder="Mínimo 6 caracteres"
                required
                minlength="6"
              />
            </div>
            
            <div class="form-group">
              <label for="confirmPassword" class="label">Confirmar Contraseña</label>
              <input 
                id="confirmPassword"
                v-model="formData.confirmPassword" 
                type="password" 
                class="input" 
                placeholder="Repite tu contraseña"
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
              <span v-if="!loading">Crear Cuenta</span>
              <span v-else>Creando cuenta...</span>
            </button>
          </form>
          
          <div class="auth-footer">
            <p>¿Ya tienes cuenta? 
              <router-link to="/login" class="auth-link">Inicia Sesión</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  // Validar contraseñas
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    loading.value = false
    return
  }
  
  const result = await authStore.register(
    formData.value.email, 
    formData.value.password,
    formData.value.displayName
  )
  
  if (result.success) {
    router.push('/panel')
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
