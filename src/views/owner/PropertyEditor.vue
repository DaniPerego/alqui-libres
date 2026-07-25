<template>
  <div class="property-editor">
    <div class="page-header">
      <h1 class="page-title">{{ isEditing ? 'Editar Propiedad' : 'Nueva Propiedad' }}</h1>
    </div>
    
    <form @submit.prevent="handleSubmit" class="editor-form">
      <!-- Imágenes -->
      <section class="form-section card">
        <h2 class="section-title">Imágenes de la Propiedad</h2>
        <p class="section-description">Añade fotos atractivas de tu propiedad. La primera será la imagen principal.</p>
        
        <div class="image-upload-area">
          <div class="image-preview-grid">
            <div 
              v-for="(image, index) in formData.images" 
              :key="index"
              class="image-preview-item"
            >
              <img :src="image" :alt="`Imagen ${index + 1}`" />
              <div class="image-overlay">
                <button 
                  type="button" 
                  @click="removeImage(index)" 
                  class="btn-remove-image"
                  title="Eliminar imagen"
                >
                  ✕
                </button>
                <span v-if="index === 0" class="badge-main">Principal</span>
                <div v-if="imageUploads[index] && imageUploads[index].progress > 0 && imageUploads[index].progress < 100" class="upload-progress">
                  <div class="progress-bar" :style="{ width: imageUploads[index].progress + '%' }"></div>
                </div>
                <span v-if="imageUploads[index] && imageUploads[index].error" class="badge-error">Error</span>
              </div>
            </div>
            
            <!-- Upload Button -->
            <label class="upload-box">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                @change="handleImageUpload"
                style="display: none;"
              />
              <div class="upload-content">
                <span class="upload-icon">📷</span>
                <span class="upload-text">Añadir Fotos</span>
                <span class="upload-hint">JPG, PNG hasta 5MB</span>
              </div>
            </label>
          </div>
          
          <div v-if="formData.images.length === 0" class="no-images">
            <p>No has añadido imágenes aún. Añade al menos una foto de tu propiedad.</p>
          </div>
        </div>
      </section>
      
      <!-- Información Básica -->
      <section class="form-section card">
        <h2 class="section-title">Información Básica</h2>
        
        <div class="form-group">
          <label class="label">Título del Anuncio *</label>
          <input 
            v-model="formData.title" 
            type="text" 
            class="input" 
            placeholder="Ej: Hermosa casa con parrilla cerca del centro"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="label">Descripción *</label>
          <textarea 
            v-model="formData.description" 
            class="textarea" 
            placeholder="Describe tu propiedad..."
            rows="5"
            required
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="label">Tipo de Propiedad *</label>
            <select v-model="formData.propertyType" class="select" required>
              <option value="">Seleccionar...</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="cabana">Cabaña</option>
              <option value="departamento">Departamento</option>
              <option value="loft">Loft</option>
            </select>
          </div>
        </div>
      </section>
      
      <!-- Ubicación -->
      <section class="form-section card">
        <h2 class="section-title">Ubicación</h2>
        
        <div class="form-group">
          <label class="label">Dirección *</label>
          <input 
            v-model="formData.location.address" 
            type="text" 
            class="input" 
            required
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="label">Ciudad *</label>
            <input 
              v-model="formData.location.city" 
              type="text" 
              class="input" 
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label">Provincia/Estado *</label>
            <input 
              v-model="formData.location.state" 
              type="text" 
              class="input" 
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label class="label">País *</label>
          <input 
            v-model="formData.location.country" 
            type="text" 
            class="input" 
            required
          />
        </div>
      </section>
      
      <!-- Capacidad -->
      <section class="form-section card">
        <h2 class="section-title">Capacidad</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label class="label">Huéspedes *</label>
            <input 
              v-model.number="formData.capacity.guests" 
              type="number" 
              class="input" 
              min="1"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label">Habitaciones *</label>
            <input 
              v-model.number="formData.capacity.bedrooms" 
              type="number" 
              class="input" 
              min="1"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label">Camas *</label>
            <input 
              v-model.number="formData.capacity.beds" 
              type="number" 
              class="input" 
              min="1"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label">Baños *</label>
            <input 
              v-model.number="formData.capacity.bathrooms" 
              type="number" 
              class="input" 
              min="1"
              step="0.5"
              required
            />
          </div>
        </div>
      </section>
      
      <!-- Precios -->
      <section class="form-section card">
        <h2 class="section-title">Precios</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label class="label">Precio por Noche *</label>
            <input 
              v-model.number="formData.pricing.basePrice" 
              type="number" 
              class="input" 
              min="0"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label">Tarifa de Limpieza</label>
            <input 
              v-model.number="formData.pricing.cleaningFee" 
              type="number" 
              class="input" 
              min="0"
            />
          </div>
          
          <div class="form-group">
            <label class="label">Moneda *</label>
            <select v-model="formData.pricing.currency" class="select" required>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </section>
      
      <!-- Características Locales (VENTAJA COMPETITIVA) -->
      <section class="form-section card highlight-section">
        <h2 class="section-title">🎯 Características Locales</h2>
        <p class="section-description">
          Estos detalles hacen que tu propiedad destaque en búsquedas locales
        </p>
        
        <div class="form-row">
          <div class="form-group">
            <label class="label">Tipo de Parrilla</label>
            <select v-model="formData.localFeatures.grillType" class="select">
              <option value="">Sin parrilla</option>
              <option value="carbon">Carbón</option>
              <option value="gas">Gas</option>
              <option value="electrica">Eléctrica</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="label">Tamaño de Cochera</label>
            <select v-model="formData.localFeatures.parkingSize" class="select">
              <option value="">Sin cochera</option>
              <option value="pequena">Pequeña (1 auto)</option>
              <option value="mediana">Mediana (2 autos)</option>
              <option value="grande">Grande (3+ autos)</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="label">Distancia al Centro (km)</label>
          <input 
            v-model.number="formData.localFeatures.distanceToCenter" 
            type="number" 
            class="input" 
            min="0"
            step="0.1"
          />
        </div>
      </section>
      
      <!-- Amenidades -->
      <section class="form-section card">
        <h2 class="section-title">Amenidades</h2>
        
        <div class="amenities-grid">
          <label v-for="amenity in availableAmenities" :key="amenity" class="amenity-checkbox">
            <input 
              type="checkbox" 
              :value="amenity"
              v-model="formData.amenities"
            />
            <span>{{ amenity }}</span>
          </label>
        </div>
      </section>
      
      <!-- Botones de Acción -->
      <div class="form-actions">
        <button type="button" @click="$router.back()" class="btn btn-secondary">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="!loading">{{ isEditing ? 'Guardar Cambios' : 'Publicar Propiedad' }}</span>
          <span v-else>Guardando...</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertyStore } from '@/stores/property'
import { useAuthStore } from '@/stores/auth'
import { uploadPropertyImage, deleteStorageImage } from '@/services/storage'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.id)
const loading = ref(false)
const uploadingImages = ref(false)
const imageUploads = ref([])

const formData = ref({
  title: '',
  description: '',
  propertyType: '',
  images: [],
  pricing: {
    basePrice: 0,
    cleaningFee: 0,
    currency: 'USD'
  },
  capacity: {
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1
  },
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
    coordinates: { lat: 0, lng: 0 }
  },
  amenities: [],
  localFeatures: {
    grillType: '',
    parkingSize: '',
    nearbyAttractions: [],
    distanceToCenter: 0
  },
  rules: [],
  availability: {
    calendar: '',
    blockedDates: []
  }
})

const availableAmenities = [
  'WiFi', 'TV', 'Cocina', 'Lavadora', 'Aire Acondicionado',
  'Calefacción', 'Piscina', 'Estacionamiento', 'Parrilla',
  'Jardín', 'Balcón', 'Gimnasio', 'Mascotas Permitidas'
]

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  uploadingImages.value = true
  const tempId = 'temp-' + Date.now()
  
  const uploadPromises = Array.from(files).map(async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`La imagen ${file.name} supera los 5MB`)
      return
    }

    const localPreview = URL.createObjectURL(file)
    const uploadEntry = { localPreview, progress: 0, error: false }
    imageUploads.value.push(uploadEntry)

    formData.value.images.push(localPreview)
    if (formData.value.images.length === 1) {
      formData.value.mainImage = localPreview
    }

    try {
      const url = await uploadPropertyImage(file, authStore.userId, tempId, (progress) => {
        uploadEntry.progress = progress
      })
      const idx = formData.value.images.indexOf(localPreview)
      if (idx !== -1) formData.value.images[idx] = url
      if (formData.value.mainImage === localPreview) formData.value.mainImage = url
      URL.revokeObjectURL(localPreview)
      uploadEntry.done = true
    } catch (err) {
      console.error('Error al subir imagen:', err)
      uploadEntry.error = true
    }
  })

  await Promise.all(uploadPromises)
  uploadingImages.value = false
  event.target.value = ''
}

const removeImage = (index) => {
  const removed = formData.value.images[index]
  formData.value.images.splice(index, 1)
  if (index === 0 && formData.value.images.length > 0) {
    formData.value.mainImage = formData.value.images[0]
  } else if (formData.value.images.length === 0) {
    formData.value.mainImage = ''
  }
  deleteStorageImage(removed)
}

const handleSubmit = async () => {
  if (uploadingImages.value) {
    alert('Esperá a que terminen de subirse las imágenes')
    return
  }
  loading.value = true

  try {
    const data = { ...formData.value }
    if (imageUploads.value.some(u => u.error) && data.images.some(i => i.startsWith('blob:'))) {
      alert('Algunas imágenes no se subieron correctamente. Revisá e intentá de nuevo.')
      loading.value = false
      return
    }

    let result
    if (isEditing.value) {
      result = await propertyStore.updateProperty(
        authStore.userId,
        route.params.id,
        data
      )
    } else {
      result = await propertyStore.createProperty(
        authStore.userId,
        data
      )
    }

    if (result.success) {
      const action = isEditing.value ? 'actualizada' : 'creada'
      console.log(`✅ Propiedad ${action} exitosamente`)
      if (result.message) {
        alert(`✅ ${result.message}\n\nSerás redirigido al listado de propiedades.`)
      }
      router.push('/panel/propiedades')
    } else {
      alert('❌ Error: ' + result.error)
    }
  } catch (err) {
    alert('❌ Error inesperado: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isEditing.value) {
    const result = await propertyStore.fetchProperty(authStore.userId, route.params.id)
    if (result.success) {
      formData.value = { ...formData.value, ...result.data }
    }
  }
})
</script>

<style scoped>
.property-editor {
  max-width: 900px;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form-section {
  padding: var(--spacing-xl);
}

.highlight-section {
  border: 2px solid var(--secondary-color);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
}

.section-description {
  color: var(--gray-600);
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

/* Image Upload Styles */
.image-upload-area {
  margin-top: var(--spacing-md);
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.image-preview-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--gray-200);
  background: var(--gray-100);
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.btn-remove-image {
  background: #ef4444;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove-image:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.badge-main {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-error {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
  background: #dc2626;
  color: white;
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
}
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gray-200);
}
.progress-bar {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.upload-box {
  aspect-ratio: 4/3;
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius-md);
  background: var(--gray-50);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-box:hover {
  border-color: var(--primary-color);
  background: #eff6ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  text-align: center;
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-text {
  font-weight: 600;
  color: var(--gray-700);
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.no-images {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--gray-600);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px dashed var(--gray-300);
}

.amenity-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.amenity-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}
</style>
