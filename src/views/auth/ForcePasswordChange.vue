<template>
  <div class="password-change-page">
    <div class="password-card">
      <div class="card-icon">🔐</div>
      <h1>Cambio de Contraseña Obligatorio</h1>
      <p class="card-subtitle">
        Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
      </p>

      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label>Nueva contraseña</label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Confirmar nueva contraseña</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repite la contraseña"
            required
            class="form-input"
            :class="{ error: confirmPassword && confirmPassword !== newPassword }"
          />
          <span v-if="confirmPassword && confirmPassword !== newPassword" class="form-error">
            Las contraseñas no coinciden
          </span>
        </div>

        <div v-if="error" class="form-error">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="saving || !newPassword || newPassword !== confirmPassword">
          {{ saving ? 'Guardando...' : 'Cambiar Contraseña' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const error = ref('')

onMounted(() => {
  if (!authStore.mustChangePassword) {
    router.push('/')
  }
})

const handleSubmit = async () => {
  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  saving.value = true
  error.value = ''

  const result = await authStore.changePassword(newPassword.value)
  saving.value = false

  if (result.success) {
    const redirect = authStore.user?.role === 'admin' ? '/admin' : '/panel'
    router.push(redirect)
  } else {
    error.value = result.error || 'Error al cambiar la contraseña'
  }
}
</script>

<style scoped>
.password-change-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--gray-50);
}

.password-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.card-subtitle {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.password-form {
  text-align: left;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-input.error {
  border-color: #ef4444;
}

.form-error {
  display: block;
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: var(--spacing-xs);
}

.btn-submit {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: var(--spacing-md);
  transition: all 0.2s ease;
}

.btn-submit:hover {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
