<template>
  <div class="property-editor">
    <div class="page-header">
      <h1 class="page-title">{{ isEditing ? 'Editar Propiedad' : 'Nueva Propiedad' }}</h1>
    </div>
    
    <form @submit.prevent="handleSubmit" class="editor-form">
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

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.id)
const loading = ref(false)

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

const handleSubmit = async () => {
  loading.value = true
  
  let result
  if (isEditing.value) {
    result = await propertyStore.updateProperty(
      authStore.userId,
      route.params.id,
      formData.value
    )
  } else {
    result = await propertyStore.createProperty(
      authStore.userId,
      formData.value
    )
  }
  
  if (result.success) {
    router.push('/panel/propiedades')
  } else {
    alert('Error: ' + result.error)
  }
  
  loading.value = false
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
