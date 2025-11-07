<template>
  <div class="my-properties">
    <div class="page-header">
      <h1 class="page-title">Mis Propiedades</h1>
      <router-link to="/panel/propiedades/nueva" class="btn btn-primary">
        + Nueva Propiedad
      </router-link>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando propiedades...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadProperties" class="btn btn-secondary">Reintentar</button>
    </div>
    
    <div v-else-if="propertyStore.properties.length === 0" class="empty-state">
      <div class="empty-icon">🏠</div>
      <h2>No tienes propiedades publicadas</h2>
      <p>Publica tu primera propiedad y comienza a recibir reservas</p>
      <router-link to="/panel/propiedades/nueva" class="btn btn-primary btn-lg">
        Publicar Primera Propiedad
      </router-link>
    </div>
    
    <div v-else class="properties-grid">
      <div v-for="property in propertyStore.properties" :key="property.id" class="property-card card">
        <div class="property-image">
          <img 
            :src="property.images?.[0] || '/placeholder.jpg'" 
            :alt="property.title"
          />
          <span class="property-status" :class="property.status">
            {{ property.status === 'active' ? 'Activa' : 'Inactiva' }}
          </span>
        </div>
        
        <div class="property-content">
          <h3 class="property-title">{{ property.title }}</h3>
          <p class="property-location">
            📍 {{ property.location?.city }}, {{ property.location?.state }}
          </p>
          <p class="property-price">
            ${{ property.pricing?.basePrice }} / noche
          </p>
          
          <div class="property-actions">
            <router-link 
              :to="`/panel/propiedades/${property.id}/editar`" 
              class="btn btn-secondary btn-sm"
            >
              Editar
            </router-link>
            <button 
              @click="confirmDelete(property.id)" 
              class="btn btn-danger btn-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePropertyStore } from '@/stores/property'
import { useAuthStore } from '@/stores/auth'

const propertyStore = usePropertyStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const loadProperties = async () => {
  loading.value = true
  error.value = ''
  
  const result = await propertyStore.fetchUserProperties(authStore.userId)
  
  if (!result.success) {
    error.value = result.error
  }
  
  loading.value = false
}

const confirmDelete = async (propertyId) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
    const result = await propertyStore.deleteProperty(authStore.userId, propertyId)
    
    if (result.success) {
      // Recargar propiedades
      loadProperties()
    } else {
      alert('Error al eliminar la propiedad: ' + result.error)
    }
  }
}

onMounted(() => {
  loadProperties()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.property-card {
  overflow: hidden;
  transition: transform var(--transition-base);
}

.property-card:hover {
  transform: translateY(-5px);
}

.property-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.property-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.property-status {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.property-status.active {
  background-color: var(--secondary-color);
  color: white;
}

.property-status.inactive {
  background-color: var(--gray-400);
  color: white;
}

.property-content {
  padding: var(--spacing-lg);
}

.property-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.property-location {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
}

.property-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
}

.property-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.property-actions .btn {
  flex: 1;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>
