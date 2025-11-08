<template>
  <div class="search-page">
    <div class="container">
      <!-- Filtros de Búsqueda -->
      <div class="search-filters card">
        <div class="filters-row">
          <div class="filter-group">
            <label for="search-city" class="label">Ciudad</label>
            <input 
              id="search-city"
              v-model="searchStore.filters.city" 
              @input="handleSearch"
              type="text" 
              class="input" 
              placeholder="¿A dónde vas?"
            />
          </div>
          
          <div class="filter-group">
            <label for="search-checkin" class="label">Check-in</label>
            <input 
              id="search-checkin"
              v-model="searchStore.filters.checkIn" 
              @change="handleSearch"
              type="date" 
              class="input"
            />
          </div>
          
          <div class="filter-group">
            <label for="search-checkout" class="label">Check-out</label>
            <input 
              id="search-checkout"
              v-model="searchStore.filters.checkOut" 
              @change="handleSearch"
              type="date" 
              class="input"
            />
          </div>
          
          <div class="filter-group">
            <label for="search-guests" class="label">Huéspedes</label>
            <select 
              id="search-guests"
              v-model.number="searchStore.filters.guests" 
              @change="handleSearch"
              class="select"
            >
              <option :value="1">1 huésped</option>
              <option :value="2">2 huéspedes</option>
              <option :value="3">3 huéspedes</option>
              <option :value="4">4 huéspedes</option>
              <option :value="5">5+ huéspedes</option>
            </select>
          </div>
        </div>
        
        <!-- Filtros Avanzados (Hiper-Locales) -->
        <div class="advanced-filters" :class="{ open: showAdvanced }">
          <button @click="showAdvanced = !showAdvanced" class="toggle-advanced">
            {{ showAdvanced ? '▲ Ocultar' : '▼ Mostrar' }} Filtros Avanzados
          </button>
          
          <div v-if="showAdvanced" class="advanced-content">
            <div class="filters-row">
              <div class="filter-group">
                <label for="property-type" class="label">Tipo de Propiedad</label>
                <select id="property-type" v-model="searchStore.filters.propertyType" @change="handleSearch" class="select">
                  <option value="">Todos</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="cabana">Cabaña</option>
                  <option value="departamento">Departamento</option>
                </select>
              </div>
              
              <!-- FILTROS HIPER-LOCALES (Ventaja Competitiva) -->
              <div class="filter-group">
                <label for="grill-type" class="label">🔥 Tipo de Parrilla</label>
                <select 
                  id="grill-type"
                  v-model="searchStore.filters.localFeatures.grillType" 
                  @change="handleSearch" 
                  class="select"
                >
                  <option value="">Cualquiera</option>
                  <option value="carbon">Carbón</option>
                  <option value="gas">Gas</option>
                  <option value="electrica">Eléctrica</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="parking-size" class="label">🚗 Tamaño de Cochera</label>
                <select 
                  id="parking-size"
                  v-model="searchStore.filters.localFeatures.parkingSize" 
                  @change="handleSearch" 
                  class="select"
                >
                  <option value="">No importa</option>
                  <option value="pequena">Pequeña (1 auto)</option>
                  <option value="mediana">Mediana (2 autos)</option>
                  <option value="grande">Grande (3+ autos)</option>
                </select>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="price-range">Precio por Noche</label>
              <div class="price-range">
                <input 
                  id="price-min"
                  v-model.number="searchStore.filters.priceMin" 
                  @input="handleSearch"
                  type="number" 
                  class="input" 
                  placeholder="Mín"
                  aria-label="Precio mínimo"
                />
                <span>-</span>
                <input 
                  id="price-max"
                  v-model.number="searchStore.filters.priceMax" 
                  @input="handleSearch"
                  type="number"
                  aria-label="Precio máximo" 
                  class="input" 
                  placeholder="Máx"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Resultados -->
      <div class="search-results">
        <div class="results-header">
          <h2 class="results-title">
            {{ searchStore.resultsCount }} propiedades encontradas
          </h2>
          <button 
            v-if="searchStore.hasActiveFilters" 
            @click="searchStore.clearFilters()"
            class="btn btn-secondary btn-sm"
          >
            Limpiar Filtros
          </button>
        </div>
        
        <div v-if="searchStore.loading" class="loading-container">
          <div class="spinner"></div>
          <p>Buscando propiedades...</p>
        </div>
        
        <div v-else-if="searchStore.filteredListings.length === 0" class="empty-results">
          <div class="empty-icon">🔍</div>
          <h3>No se encontraron propiedades</h3>
          <p>Intenta ajustar tus filtros de búsqueda</p>
        </div>
        
        <div v-else class="results-grid">
          <router-link
            v-for="listing in searchStore.filteredListings"
            :key="listing.id"
            :to="`/propiedad/${listing.id}`"
            class="listing-card"
          >
            <div class="listing-image">
              <img :src="listing.mainImage || '/placeholder.jpg'" :alt="listing.title" />
            </div>
            
            <div class="listing-content">
              <div class="listing-header">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <div class="listing-rating" v-if="listing.rating > 0">
                  ⭐ {{ listing.rating.toFixed(1) }}
                </div>
              </div>
              
              <p class="listing-type">{{ listing.propertyType }}</p>
              <p class="listing-location">📍 {{ listing.location.city }}</p>
              
              <div class="listing-capacity">
                <span>{{ listing.capacity.guests }} huéspedes</span>
                <span>•</span>
                <span>{{ listing.capacity.bedrooms }} hab.</span>
                <span>•</span>
                <span>{{ listing.capacity.beds }} camas</span>
              </div>
              
              <!-- Características Locales Destacadas -->
              <div v-if="listing.localFeatures" class="local-features">
                <span v-if="listing.localFeatures.grillType" class="feature-tag">
                  🔥 Parrilla {{ listing.localFeatures.grillType }}
                </span>
                <span v-if="listing.localFeatures.parkingSize" class="feature-tag">
                  🚗 Cochera {{ listing.localFeatures.parkingSize }}
                </span>
              </div>
              
              <div class="listing-footer">
                <div class="listing-price">
                  <span class="price-amount">${{ listing.pricing.basePrice }}</span>
                  <span class="price-period">/ noche</span>
                </div>
                <span class="view-details">Ver Detalles →</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSearchStore } from '@/stores/search'

const searchStore = useSearchStore()
const showAdvanced = ref(false)

const handleSearch = () => {
  searchStore.searchListings()
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.search-page {
  padding: var(--spacing-xl) 0;
}

.search-filters {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.advanced-filters {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.toggle-advanced {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  padding: var(--spacing-sm) 0;
  width: 100%;
  text-align: left;
}

.advanced-content {
  margin-top: var(--spacing-lg);
}

.price-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.price-range .input {
  flex: 1;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.results-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
}

.loading-container,
.empty-results {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-results h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.empty-results p {
  color: var(--gray-600);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}

.listing-card {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
  text-decoration: none;
  color: inherit;
}

.listing-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.listing-image {
  width: 100%;
  height: 220px;
  overflow: hidden;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.listing-content {
  padding: var(--spacing-lg);
}

.listing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.listing-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.listing-rating {
  font-size: 0.875rem;
  white-space: nowrap;
}

.listing-type {
  text-transform: capitalize;
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
}

.listing-location {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
}

.listing-capacity {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
}

.local-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.feature-tag {
  background-color: var(--secondary-color);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
}

.listing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--gray-200);
}

.listing-price {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.price-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.price-period {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.view-details {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
