<template>
  <div class="owner-profile">
    <div class="profile-header">
      <h1>Mi Perfil</h1>
      <p class="subtitle">Gestiona tu información personal y de contacto</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        @click="activeTab = 'personal'" 
        :class="['tab', { active: activeTab === 'personal' }]"
      >
        👤 Información Personal
      </button>
      <button 
        @click="activeTab = 'contact'" 
        :class="['tab', { active: activeTab === 'contact' }]"
      >
        📞 Contactos
      </button>
      <button 
        @click="activeTab = 'social'" 
        :class="['tab', { active: activeTab === 'social' }]"
      >
        🌐 Redes Sociales
      </button>
      <button 
        @click="activeTab = 'rentals'" 
        :class="['tab', { active: activeTab === 'rentals' }]"
      >
        📋 Mis alquileres
      </button>
      <button 
        @click="activeTab = 'preview'" 
        :class="['tab', { active: activeTab === 'preview' }]"
      >
        👁️ Vista Previa
      </button>
    </div>
    <!-- Tab: Mis alquileres (solo huésped) -->
    <div v-if="activeTab === 'rentals'" class="tab-content card">
      <h2 class="section-title">Historial de Alquileres</h2>
      <div v-if="rentals.length === 0" class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No tienes alquileres registrados aún.</p>
      </div>
      <div v-else class="rentals-list">
        <div v-for="rental in rentals" :key="rental.id" class="rental-item">
          <div class="rental-info">
            <strong>{{ rental.propertyTitle }}</strong>
            <p>Fechas: {{ rental.checkIn }} - {{ rental.checkOut }}</p>
            <p>Estado: <span :class="['rental-status', rental.status]">{{ rental.status }}</span></p>
          </div>
          <div class="rental-actions">
            <a v-if="rental.whatsapp" :href="`https://wa.me/${rental.whatsapp}`" target="_blank" class="btn btn-outline">Contactar por WhatsApp</a>
            <a v-if="rental.email" :href="`mailto:${rental.email}`" class="btn btn-outline">Contactar por Email</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Información Personal -->
    <div v-if="activeTab === 'personal'" class="tab-content card">
      <h2 class="section-title">Información Personal</h2>
      
      <div class="form-group">
        <label class="label">Foto de Perfil</label>
        <div class="avatar-upload">
          <div class="avatar-preview">
            <img v-if="profile.photoURL" :src="profile.photoURL" alt="Avatar">
            <div v-else class="avatar-placeholder">
              {{ profile.displayName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
          </div>
          <div class="avatar-actions">
            <button @click="triggerFileUpload" class="btn btn-outline">
              📷 Cambiar Foto
            </button>
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              @change="handleFileUpload" 
              style="display: none"
            >
            <p class="help-text">JPG, PNG o GIF. Máximo 2MB</p>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="label required">Nombre Completo</label>
          <input 
            v-model="profile.displayName" 
            type="text" 
            class="input"
            placeholder="Juan Pérez"
          >
        </div>

        <div class="form-group">
          <label class="label">Email</label>
          <input 
            v-model="profile.email" 
            type="email" 
            class="input"
            disabled
          >
          <p class="help-text">El email no se puede cambiar</p>
        </div>
      </div>

      <div class="form-group">
        <label class="label">Biografía</label>
        <textarea 
          v-model="profile.bio" 
          class="textarea"
          rows="4"
          placeholder="Cuéntales a tus huéspedes un poco sobre ti..."
          maxlength="500"
        ></textarea>
        <p class="help-text">{{ profile.bio?.length || 0 }}/500 caracteres</p>
      </div>

      <div class="form-group">
        <label class="label">Ciudad</label>
        <input 
          v-model="profile.city" 
          type="text" 
          class="input"
          placeholder="Córdoba"
        >
      </div>
    </div>

    <!-- Tab: Contactos -->
    <div v-if="activeTab === 'contact'" class="tab-content card">
      <h2 class="section-title">Información de Contacto</h2>
      
      <div class="info-banner">
        <span class="icon">🔒</span>
        <div>
          <strong>Privacidad:</strong> Tu información de contacto solo será visible para usuarios registrados en la plataforma.
        </div>
      </div>

      <!-- Contacto Principal -->
      <div class="contact-section">
        <h3 class="subsection-title">📞 Contacto Principal</h3>
        <p class="help-text">Este será tu contacto principal para recibir reservas</p>

        <div class="form-row">
          <div class="form-group">
            <label class="label required">Teléfono</label>
            <input 
              v-model="profile.contactoPrincipal.telefono" 
              type="tel" 
              class="input"
              placeholder="+54 351 123-4567"
            >
          </div>

          <div class="form-group">
            <label class="label required">WhatsApp</label>
            <input 
              v-model="profile.contactoPrincipal.whatsapp" 
              type="tel" 
              class="input"
              placeholder="+54 351 123-4567"
            >
            <p class="help-text">Puede ser el mismo que el teléfono</p>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Email de Contacto</label>
          <input 
            v-model="profile.contactoPrincipal.email" 
            type="email" 
            class="input"
            :placeholder="profile.email"
          >
          <p class="help-text">Si está vacío, se usará tu email principal</p>
        </div>
      </div>

      <!-- Contacto Secundario solo para propietarios -->
      <div v-if="authStore.user?.role === 'owner'" class="contact-section secondary">
        <div class="subsection-header">
          <h3 class="subsection-title">📱 Contacto Secundario (Opcional)</h3>
          <label class="toggle-label">
            <input 
              v-model="profile.contactoSecundario.enabled" 
              type="checkbox"
              class="toggle-input"
            >
            <span class="toggle-slider"></span>
            <span class="toggle-text">
              {{ profile.contactoSecundario.enabled ? 'Activado' : 'Desactivado' }}
            </span>
          </label>
        </div>
        <p class="help-text">Útil si tienes un administrador o encargado</p>
        <div v-if="profile.contactoSecundario.enabled" class="secondary-form">
          <div class="form-group">
            <label class="label">Descripción</label>
            <input 
              v-model="profile.contactoSecundario.descripcion" 
              type="text" 
              class="input"
              placeholder="Administrador, Encargado, Secretaría..."
            >
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="label">Teléfono</label>
              <input 
                v-model="profile.contactoSecundario.telefono" 
                type="tel" 
                class="input"
                placeholder="+54 351 999-8888"
              >
            </div>
            <div class="form-group">
              <label class="label">WhatsApp</label>
              <input 
                v-model="profile.contactoSecundario.whatsapp" 
                type="tel" 
                class="input"
                placeholder="+54 351 999-8888"
              >
            </div>
          </div>
          <div class="form-group">
            <label class="label">Email</label>
            <input 
              v-model="profile.contactoSecundario.email" 
              type="email" 
              class="input"
              placeholder="admin@empresa.com"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Redes Sociales -->
    <div v-if="activeTab === 'social'" class="tab-content card">
      <h2 class="section-title">Redes Sociales</h2>
      <p class="help-text">Agrega tus redes sociales para generar más confianza</p>

      <div class="social-form">
        <div class="form-group social-input">
          <label class="label">
            <span class="social-icon instagram">📷</span>
            Instagram
          </label>
          <div class="input-with-prefix">
            <span class="prefix">@</span>
            <input 
              v-model="profile.redesSociales.instagram" 
              type="text" 
              class="input"
              placeholder="usuario"
            >
          </div>
        </div>

        <div class="form-group social-input">
          <label class="label">
            <span class="social-icon facebook">📘</span>
            Facebook
          </label>
          <div class="input-with-prefix">
            <span class="prefix">facebook.com/</span>
            <input 
              v-model="profile.redesSociales.facebook" 
              type="text" 
              class="input"
              placeholder="usuario"
            >
          </div>
        </div>

        <div class="form-group social-input">
          <label class="label">
            <span class="social-icon linkedin">💼</span>
            LinkedIn
          </label>
          <div class="input-with-prefix">
            <span class="prefix">linkedin.com/in/</span>
            <input 
              v-model="profile.redesSociales.linkedin" 
              type="text" 
              class="input"
              placeholder="usuario"
            >
          </div>
        </div>

        <div class="form-group social-input">
          <label class="label">
            <span class="social-icon website">🌐</span>
            Sitio Web
          </label>
          <input 
            v-model="profile.redesSociales.website" 
            type="url" 
            class="input"
            placeholder="https://misitio.com"
          >
        </div>
      </div>
    </div>

    <!-- Tab: Vista Previa -->
    <div v-if="activeTab === 'preview'" class="tab-content card">
      <h2 class="section-title">Vista Previa del Perfil</h2>
      <p class="help-text">Así verán tu perfil los usuarios registrados</p>

      <div class="profile-preview">
        <div class="preview-header">
          <div class="preview-avatar">
            <img v-if="profile.photoURL" :src="profile.photoURL" alt="Avatar">
            <div v-else class="avatar-placeholder">
              {{ profile.displayName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
          </div>
          <div class="preview-info">
            <h3 class="preview-name">{{ profile.displayName || 'Tu Nombre' }}</h3>
            <p class="preview-location">📍 {{ profile.city || 'Tu Ciudad' }}</p>
            <p class="preview-bio">{{ profile.bio || 'Tu biografía aparecerá aquí...' }}</p>
          </div>
        </div>

        <!-- Contactos Preview -->
        <div class="preview-section">
          <h4>📞 Contacto</h4>
          <div class="preview-contacts">
            <div v-if="profile.contactoPrincipal.telefono" class="preview-contact-item">
              <strong>Teléfono:</strong> {{ profile.contactoPrincipal.telefono }}
            </div>
            <div v-if="profile.contactoPrincipal.whatsapp" class="preview-contact-item">
              <strong>WhatsApp:</strong> {{ profile.contactoPrincipal.whatsapp }}
            </div>
            <div v-if="profile.contactoPrincipal.email" class="preview-contact-item">
              <strong>Email:</strong> {{ profile.contactoPrincipal.email || profile.email }}
            </div>
          </div>

          <div v-if="profile.contactoSecundario.enabled && profile.contactoSecundario.telefono" class="preview-contacts secondary">
            <h5>{{ profile.contactoSecundario.descripcion || 'Contacto Secundario' }}</h5>
            <div v-if="profile.contactoSecundario.telefono" class="preview-contact-item">
              <strong>Teléfono:</strong> {{ profile.contactoSecundario.telefono }}
            </div>
            <div v-if="profile.contactoSecundario.whatsapp" class="preview-contact-item">
              <strong>WhatsApp:</strong> {{ profile.contactoSecundario.whatsapp }}
            </div>
            <div v-if="profile.contactoSecundario.email" class="preview-contact-item">
              <strong>Email:</strong> {{ profile.contactoSecundario.email }}
            </div>
          </div>
        </div>

        <!-- Redes Sociales Preview -->
        <div v-if="hasSocialMedia" class="preview-section">
          <h4>🌐 Redes Sociales</h4>
          <div class="preview-social">
            <a v-if="profile.redesSociales.instagram" 
               :href="`https://instagram.com/${profile.redesSociales.instagram}`" 
               target="_blank" 
               class="social-link instagram"
            >
              📷 Instagram
            </a>
            <a v-if="profile.redesSociales.facebook" 
               :href="`https://facebook.com/${profile.redesSociales.facebook}`" 
               target="_blank" 
               class="social-link facebook"
            >
              📘 Facebook
            </a>
            <a v-if="profile.redesSociales.linkedin" 
               :href="`https://linkedin.com/in/${profile.redesSociales.linkedin}`" 
               target="_blank" 
               class="social-link linkedin"
            >
              💼 LinkedIn
            </a>
            <a v-if="profile.redesSociales.website" 
               :href="profile.redesSociales.website" 
               target="_blank" 
               class="social-link website"
            >
              🌐 Sitio Web
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="actions">
      <button @click="cancelChanges" class="btn btn-outline">
        Cancelar
      </button>
      <button @click="saveProfile" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Guardando...' : '💾 Guardar Cambios' }}
      </button>
    </div>

    <!-- Toast de Confirmación -->
    <Transition name="toast">
      <div v-if="showToast" class="toast success">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>✅ Perfil actualizado correctamente</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Simulación de alquileres para el huésped
import { mockMessages } from '@/data/mockData'

const rentals = ref([])

const loadRentals = () => {
  // Solo mostrar alquileres si el usuario es huésped
  if (authStore.user?.role === 'guest') {
    // Simulación: usar mockMessages como historial de alquileres
    rentals.value = mockMessages.map(msg => ({
      id: msg.id,
      propertyTitle: msg.propertyTitle,
      checkIn: msg.checkIn,
      checkOut: msg.checkOut,
      status: msg.status,
      whatsapp: msg.guestEmail?.includes('@') ? null : msg.guestEmail,
      email: msg.guestEmail
    }))
  } else {
    rentals.value = []
  }
}
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const activeTab = ref('personal')
const saving = ref(false)
const showToast = ref(false)
const fileInput = ref(null)

// Perfil del usuario
const profile = ref({
  displayName: '',
  email: '',
  photoURL: '',
  bio: '',
  city: '',
  contactoPrincipal: {
    telefono: '',
    whatsapp: '',
    email: ''
  },
  contactoSecundario: {
    enabled: false,
    descripcion: '',
    telefono: '',
    whatsapp: '',
    email: ''
  },
  redesSociales: {
    instagram: '',
    facebook: '',
    linkedin: '',
    website: ''
  }
})

const hasSocialMedia = computed(() => {
  return profile.value.redesSociales.instagram ||
         profile.value.redesSociales.facebook ||
         profile.value.redesSociales.linkedin ||
         profile.value.redesSociales.website
})

const loadProfile = () => {
  if (authStore.user) {
    profile.value.displayName = authStore.user.displayName || ''
    profile.value.email = authStore.user.email || ''
    profile.value.photoURL = authStore.user.photoURL || ''
    
    // Cargar datos guardados del localStorage (temporal)
    const saved = localStorage.getItem(`profile_${authStore.user.uid}`)
    if (saved) {
      const savedProfile = JSON.parse(saved)
      Object.assign(profile.value, savedProfile)
    }
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validar tamaño (2MB máximo)
  if (file.size > 2 * 1024 * 1024) {
    alert('La imagen es muy grande. Máximo 2MB.')
    return
  }

  // Crear preview
  const reader = new FileReader()
  reader.onload = (e) => {
    profile.value.photoURL = e.target.result
  }
  reader.readAsDataURL(file)
}

const saveProfile = async () => {
  saving.value = true
  
  try {
    // Validaciones
    if (!profile.value.displayName?.trim()) {
      alert('El nombre es obligatorio')
      saving.value = false
      return
    }

    if (!profile.value.contactoPrincipal.telefono?.trim()) {
      alert('El teléfono principal es obligatorio')
      saving.value = false
      return
    }

    if (!profile.value.contactoPrincipal.whatsapp?.trim()) {
      alert('El WhatsApp principal es obligatorio')
      saving.value = false
      return
    }

    // Guardar en localStorage (temporal - luego será Firestore)
    localStorage.setItem(`profile_${authStore.user.uid}`, JSON.stringify(profile.value))
    
    // Actualizar el nombre en el auth store
    await authStore.updateProfile({
      displayName: profile.value.displayName,
      photoURL: profile.value.photoURL
    })

    // Mostrar confirmación
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Error guardando perfil:', error)
    alert('Error al guardar el perfil')
  } finally {
    saving.value = false
  }
}

const cancelChanges = () => {
  if (confirm('¿Descartar los cambios?')) {
    loadProfile()
  }
}

onMounted(() => {
  loadProfile()
  loadRentals()
})
</script>

<style scoped>
.owner-profile {
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: var(--spacing-xl);
}

.profile-header h1 {
  font-size: 2rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--gray-600);
  font-size: 1rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
  overflow-x: auto;
}

.tab {
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--gray-600);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  color: var(--primary-color);
  background: var(--gray-50);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

/* Tab Content */
.tab-content {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.5rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.subsection-title {
  font-size: 1.125rem;
  color: var(--gray-800);
  margin-bottom: var(--spacing-sm);
}

.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

/* Form Styles */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.label {
  display: block;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-xs);
}

.label.required::after {
  content: ' *';
  color: #ef4444;
}

.input,
.textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.help-text {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: var(--spacing-xs);
}

/* Avatar Upload */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--gray-200);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  font-size: 3rem;
  font-weight: 700;
}

.avatar-actions {
  flex: 1;
}

/* Info Banner */
.info-banner {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
}

.info-banner .icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* Contact Sections */
.contact-section {
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.contact-section.secondary {
  background: #fef3c7;
}

.secondary-form {
  margin-top: var(--spacing-lg);
}

/* Toggle Switch */
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
  transition: background 0.3s;
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
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-input:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-text {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

/* Social Media */
.social-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.social-input .label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.social-icon {
  font-size: 1.5rem;
}

.input-with-prefix {
  display: flex;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.input-with-prefix .prefix {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--gray-100);
  color: var(--gray-600);
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.input-with-prefix .input {
  border: none;
  border-radius: 0;
}

/* Preview */
.profile-preview {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.preview-header {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
}

.preview-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.preview-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-info {
  flex: 1;
}

.preview-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-xs);
}

.preview-location {
  color: var(--gray-600);
  margin-bottom: var(--spacing-sm);
}

.preview-bio {
  color: var(--gray-700);
  line-height: 1.6;
}

.preview-section {
  margin-bottom: var(--spacing-xl);
}

.preview-section h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.preview-section h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--spacing-sm);
}

.preview-contacts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
}

.preview-contacts.secondary {
  background: #fef3c7;
  margin-top: var(--spacing-md);
}

.preview-contact-item {
  font-size: 0.875rem;
  color: var(--gray-700);
}

.preview-social {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.social-link {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.social-link.instagram {
  background: #f3e8ff;
  color: #7c3aed;
}

.social-link.facebook {
  background: #dbeafe;
  color: #2563eb;
}

.social-link.linkedin {
  background: #dbeafe;
  color: #0284c7;
}

.social-link.website {
  background: #f3f4f6;
  color: var(--gray-700);
}

.social-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Actions */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: white;
  border: 2px solid var(--gray-300);
  color: var(--gray-700);
}

.btn-outline:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Toast */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  font-weight: 600;
  z-index: 9999;
}

.toast svg {
  width: 24px;
  height: 24px;
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

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .avatar-upload {
    flex-direction: column;
    text-align: center;
  }

  .preview-header {
    flex-direction: column;
    text-align: center;
  }

  .tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .tab {
    font-size: 0.875rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
