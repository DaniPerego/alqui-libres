<template>
  <div class="admin-properties">
    <div class="page-header">
      <h1 class="page-title">Gestión de Propiedades</h1>
      <div class="header-stats">
        <span class="stat-chip">Total: {{ adminStore.properties.length }}</span>
        <span class="stat-chip pending">Pendientes: {{ adminStore.pendingProperties.length }}</span>
      </div>
    </div>

    <div class="filters-bar card">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Buscar por título, ciudad..."
        class="search-input"
      />
      <select v-model="filterStatus" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="active">Activas</option>
        <option value="pending">Pendientes</option>
        <option value="rejected">Rechazadas</option>
        <option value="inactive">Inactivas</option>
      </select>
      <select v-model="filterType" class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="casa">Casa</option>
        <option value="apartamento">Apartamento</option>
        <option value="cabana">Cabaña</option>
        <option value="departamento">Departamento</option>
        <option value="loft">Loft</option>
      </select>
    </div>

    <div class="properties-grid">
      <div 
        v-for="property in filteredProperties" 
        :key="property.id"
        class="property-card"
      >
        <div class="property-image">
          <img :src="property.mainImage" :alt="property.title" />
          <div class="property-badges">
            <span class="badge-status" :class="property.status">
              {{ getStatusText(property.status) }}
            </span>
            <span class="badge-type">{{ property.propertyType }}</span>
          </div>
        </div>

        <div class="property-content">
          <h3 class="property-title">{{ property.title }}</h3>
          
          <div class="property-info">
            <div class="info-item">
              <span class="info-icon">📍</span>
              <span>{{ property.location.city }}, {{ property.location.state }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">👤</span>
              <span>Propietario: {{ getOwnerEmail(property.ownerId) }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">💰</span>
              <span>${{ property.pricing.basePrice }}/noche</span>
            </div>
          </div>

          <div class="local-features" v-if="property.localFeatures">
            <span v-if="property.localFeatures.grillType" class="feature-tag">
              🔥 {{ getGrillTypeText(property.localFeatures.grillType) }}
            </span>
            <span v-if="property.localFeatures.parkingSize" class="feature-tag">
              🚗 Parking {{ property.localFeatures.parkingSize }}
            </span>
          </div>

          <div class="property-actions">
            <button 
              v-if="property.status === 'pending'"
              @click="approveProperty(property.id)" 
              class="btn-action approve"
            >
              ✓ Aprobar
            </button>
            <button 
              v-if="property.status === 'pending'"
              @click="rejectProperty(property.id)" 
              class="btn-action reject"
            >
              ✕ Rechazar
            </button>
            <button 
              @click="viewDetails(property)" 
              class="btn-action view"
            >
              👁️ Ver
            </button>
            <button 
              @click="deletePropertyConfirm(property.id)" 
              class="btn-action delete"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredProperties.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>No se encontraron propiedades</h3>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    </div>

    <!-- Property Details Modal -->
    <teleport to="body">
      <div v-if="selectedProperty" class="modal-overlay" @click="selectedProperty = null">
        <div class="modal-content large" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedProperty.title }}</h2>
            <button @click="selectedProperty = null" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="property-details">
              <img :src="selectedProperty.mainImage" class="detail-image" />
              
              <div class="details-grid">
                <div class="detail-section">
                  <h4>Descripción</h4>
                  <p>{{ selectedProperty.description }}</p>
                </div>

                <div class="detail-section">
                  <h4>Ubicación</h4>
                  <p>{{ selectedProperty.location.address }}</p>
                  <p>{{ selectedProperty.location.city }}, {{ selectedProperty.location.state }}</p>
                  <p>{{ selectedProperty.location.country }}</p>
                </div>

                <div class="detail-section">
                  <h4>Capacidad</h4>
                  <ul>
                    <li>👥 {{ selectedProperty.capacity.guests }} huéspedes</li>
                    <li>🛏️ {{ selectedProperty.capacity.bedrooms }} habitaciones</li>
                    <li>🛌 {{ selectedProperty.capacity.beds }} camas</li>
                    <li>🚿 {{ selectedProperty.capacity.bathrooms }} baños</li>
                  </ul>
                </div>

                <div class="detail-section">
                  <h4>Precios</h4>
                  <p><strong>Base:</strong> ${{ selectedProperty.pricing.basePrice }} {{ selectedProperty.pricing.currency }}/noche</p>
                  <p><strong>Limpieza:</strong> ${{ selectedProperty.pricing.cleaningFee }} {{ selectedProperty.pricing.currency }}</p>
                </div>

                <div class="detail-section" v-if="selectedProperty.localFeatures">
                  <h4>Características Locales</h4>
                  <ul>
                    <li v-if="selectedProperty.localFeatures.grillType">
                      🔥 Parrilla: {{ getGrillTypeText(selectedProperty.localFeatures.grillType) }}
                    </li>
                    <li v-if="selectedProperty.localFeatures.parkingSize">
                      🚗 Estacionamiento: {{ selectedProperty.localFeatures.parkingSize }}
                    </li>
                    <li v-if="selectedProperty.localFeatures.distanceToCenter">
                      📍 {{ selectedProperty.localFeatures.distanceToCenter }} km del centro
                    </li>
                  </ul>
                </div>

                <div class="detail-section" v-if="selectedProperty.amenities?.length">
                  <h4>Amenidades</h4>
                  <div class="amenities-tags">
                    <span v-for="amenity in selectedProperty.amenities" :key="amenity" class="amenity-tag">
                      {{ amenity }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()

const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const selectedProperty = ref(null)

const filteredProperties = computed(() => {
  let properties = adminStore.properties

  // Búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    properties = properties.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.location?.city?.toLowerCase().includes(query) ||
      p.location?.state?.toLowerCase().includes(query)
    )
  }

  // Estado
  if (filterStatus.value) {
    properties = properties.filter(p => p.status === filterStatus.value)
  }

  // Tipo
  if (filterType.value) {
    properties = properties.filter(p => p.propertyType === filterType.value)
  }

  return properties
})

const getStatusText = (status) => {
  const statuses = {
    active: 'Activa',
    pending: 'Pendiente',
    rejected: 'Rechazada',
    inactive: 'Inactiva'
  }
  return statuses[status] || status
}

const getGrillTypeText = (type) => {
  const types = {
    sin: 'Sin parrilla',
    carbon: 'Carbón',
    gas: 'Gas',
    electrica: 'Eléctrica'
  }
  return types[type] || type
}

const getOwnerEmail = (ownerId) => {
  const owner = adminStore.users.find(u => u.uid === ownerId)
  return owner?.email || 'Desconocido'
}

const approveProperty = async (propertyId) => {
  const result = await adminStore.updatePropertyStatus(propertyId, 'active')
  if (result.success) {
    alert(result.message || 'Propiedad aprobada')
  } else {
    alert('Error: ' + result.error)
  }
}

const rejectProperty = async (propertyId) => {
  if (!confirm('¿Rechazar esta propiedad?')) return
  
  const result = await adminStore.updatePropertyStatus(propertyId, 'rejected')
  if (result.success) {
    alert(result.message || 'Propiedad rechazada')
  } else {
    alert('Error: ' + result.error)
  }
}

const viewDetails = (property) => {
  selectedProperty.value = property
}

const deletePropertyConfirm = async (propertyId) => {
  if (!confirm('⚠️ ¿Eliminar esta propiedad permanentemente?')) return
  
  const result = await adminStore.deleteProperty(propertyId)
  if (result.success) {
    alert(result.message || 'Propiedad eliminada')
  } else {
    alert('Error: ' + result.error)
  }
}

onMounted(() => {
  if (adminStore.properties.length === 0) {
    adminStore.fetchAllProperties()
  }
  if (adminStore.users.length === 0) {
    adminStore.fetchUsers()
  }
})
</script>

<style scoped>
.admin-properties {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.header-stats {
  display: flex;
  gap: var(--spacing-sm);
}

.stat-chip {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.stat-chip.pending {
  background: #fef3c7;
  color: #92400e;
}

.filters-bar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.search-input,
.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.search-input {
  flex: 1;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.property-card {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.property-image {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.property-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.property-badges {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: flex-end;
}

.badge-status,
.badge-type {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-status {
  background: white;
  color: var(--gray-900);
}

.badge-status.active {
  background: #10b981;
  color: white;
}

.badge-status.pending {
  background: #f59e0b;
  color: white;
}

.badge-status.rejected {
  background: #ef4444;
  color: white;
}

.badge-status.inactive {
  background: var(--gray-400);
  color: white;
}

.badge-type {
  background: rgba(0, 0, 0, 0.6);
  color: white;
}

.property-content {
  padding: var(--spacing-lg);
}

.property-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
  line-height: 1.4;
}

.property-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--gray-600);
}

.info-icon {
  font-size: 1rem;
}

.local-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.feature-tag {
  padding: 0.25rem 0.75rem;
  background: #fef3f2;
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.property-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.btn-action {
  padding: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action.approve {
  background: #10b981;
  color: white;
}

.btn-action.approve:hover {
  background: #059669;
}

.btn-action.reject {
  background: #ef4444;
  color: white;
}

.btn-action.reject:hover {
  background: #dc2626;
}

.btn-action.view {
  background: #3b82f6;
  color: white;
}

.btn-action.view:hover {
  background: #2563eb;
}

.btn-action.delete {
  background: var(--gray-200);
  color: var(--gray-700);
}

.btn-action.delete:hover {
  background: #fee2e2;
  color: #991b1b;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--gray-600);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--gray-100);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--gray-200);
}

.modal-body {
  padding: var(--spacing-lg);
}

.detail-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.details-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.detail-section h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.detail-section p {
  color: var(--gray-700);
  line-height: 1.6;
  margin-bottom: var(--spacing-sm);
}

.detail-section ul {
  list-style: none;
  padding: 0;
}

.detail-section li {
  padding: var(--spacing-xs) 0;
  color: var(--gray-700);
}

.amenities-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.amenity-tag {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-700);
}

@media (max-width: 768px) {
  .admin-properties {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .filters-bar {
    flex-direction: column;
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>
