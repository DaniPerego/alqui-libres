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
            <label for="search-guests" class="label">{{ t('hero.guests') }}</label>
            <select 
              id="search-guests"
              v-model.number="searchStore.filters.guests" 
              @change="handleSearch"
              class="select"
            >
              <option :value="1">1 {{ t('search.guests') }}</option>
              <option :value="2">2 {{ t('search.guests') }}</option>
              <option :value="3">3 {{ t('search.guests') }}</option>
              <option :value="4">4 {{ t('search.guests') }}</option>
              <option :value="5">5+ {{ t('search.guests') }}</option>
            </select>
          </div>
        </div>
        
        <!-- Filtros Avanzados (Hiper-Locales) -->
        <div class="advanced-filters" :class="{ open: showAdvanced }">
          <button @click="showAdvanced = !showAdvanced" class="toggle-advanced">
            <span class="toggle-label">
              <SlidersHorizontal :size="18" />
              {{ showAdvanced ? t('search.hideFilters') : t('search.advancedFilters') }}
            </span>
            <span class="toggle-chevron" :class="{ rotated: showAdvanced }">
              <ChevronUp v-if="showAdvanced" :size="18" />
              <ChevronDown v-else :size="18" />
            </span>
          </button>
          
          <div v-if="showAdvanced" class="advanced-content">
            <div class="filters-row">
              <div class="filter-group">
                <label for="property-type" class="label">{{ t('search.propertyType') }}</label>
                <select id="property-type" v-model="searchStore.filters.propertyType" @change="handleSearch" class="select">
                  <option value="">{{ t('search.all') }}</option>
                  <option value="casa">{{ t('search.house') }}</option>
                  <option value="apartamento">{{ t('search.apartment') }}</option>
                  <option value="cabana">{{ t('search.cabin') }}</option>
                  <option value="departamento">{{ t('search.apartment') }}</option>
                </select>
              </div>

              <div class="filter-group">
                <label for="rental-type" class="label">{{ t('search.rentalType') }}</label>
                <select id="rental-type" v-model="searchStore.filters.rentalType" @change="handleSearch" class="select">
                  <option value="">{{ t('search.all') }}</option>
                  <option value="temporario">{{ t('search.temporary') }}</option>
                  <option value="anual">{{ t('search.annual') }}</option>
                </select>
              </div>
              
              <!-- FILTROS HIPER-LOCALES (Ventaja Competitiva) -->
              <div class="filter-group">
                <label for="grill-type" class="label">
                  <span class="label-icon"><Flame :size="16" /></span>
                  {{ t('search.grillType') }}
                </label>
                <select 
                  id="grill-type"
                  v-model="searchStore.filters.localFeatures.grillType" 
                  @change="handleSearch" 
                  class="select"
                >
                  <option value="">{{ t('search.any') }}</option>
                  <option value="carbon">{{ t('search.charcoal') }}</option>
                  <option value="gas">{{ t('search.gas') }}</option>
                  <option value="electrica">{{ t('search.electric') }}</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="parking-size" class="label">
                  <span class="label-icon"><Car :size="16" /></span>
                  {{ t('search.parkingSize') }}
                </label>
                <select 
                  id="parking-size"
                  v-model="searchStore.filters.localFeatures.parkingSize" 
                  @change="handleSearch" 
                  class="select"
                >
                  <option value="">{{ t('search.noMatter') }}</option>
                  <option value="pequena">{{ t('search.small') }}</option>
                  <option value="mediana">{{ t('search.medium') }}</option>
                  <option value="grande">{{ t('search.large') }}</option>
                </select>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="price-range">{{ t('search.pricePerNight') }}</label>
              <div class="price-range">
                <input 
                  id="price-min"
                  v-model.number="searchStore.filters.priceMin" 
                  @input="handleSearch"
                  type="number" 
                  class="input" 
                  :placeholder="t('search.min')"
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
                  :placeholder="t('search.max')"
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
            {{ searchStore.resultsCount }} {{ t('search.title') }}
          </h2>
          <button 
            v-if="searchStore.hasActiveFilters" 
            @click="searchStore.clearFilters()"
            class="btn btn-secondary btn-sm clear-filters-btn"
          >
            <X :size="16" />
            {{ t('search.cleanFilters') }}
          </button>
        </div>
        
        <div v-if="searchStore.error" class="error-banner" role="alert">
          <AlertTriangle :size="20" />
          <div class="error-content">
            <p>{{ searchStore.error }}</p>
            <button @click="handleSearch" class="btn btn-outline btn-sm retry-btn">
              {{ t('search.retry') }}
            </button>
          </div>
        </div>

        <div v-if="searchStore.loading" class="loading-container">
          <div class="spinner"></div>
          <p>{{ t('search.searching') }}</p>
        </div>

        <div v-else-if="searchStore.filteredListings.length === 0" class="empty-results">
          <div class="empty-icon-wrapper">
            <SearchIcon :size="48" class="empty-search-icon" />
          </div>
          <h3>{{ t('search.noResults') }}</h3>
          <p>{{ t('search.adjustFilters') }}</p>
        </div>
        
        <div v-else class="results-grid">
          <router-link
            v-for="listing in searchStore.filteredListings"
            :key="listing.id"
            :to="`/propiedad/${listing.id}`"
            class="listing-card"
          >
            <div class="listing-image">
              <img :src="listing.mainImage || '/placeholder.jpg'" :alt="listing.title" loading="lazy" />
            </div>
            
            <div class="listing-content">
              <div class="listing-header">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <div class="listing-rating" v-if="listing.rating > 0">
                  <Star :size="14" fill="#fbbf24" stroke="#fbbf24" />
                  <span>{{ listing.rating.toFixed(1) }}</span>
                </div>
              </div>
              
              <p class="listing-type">
                {{ listing.propertyType }}
                <span class="rental-tag" :class="listing.rentalType">
                  {{ listing.rentalType === 'anual' ? t('search.annualShort') : t('search.temporaryShort') }}
                </span>
              </p>
              <p class="listing-location">
                <MapPin :size="14" />
                <span>{{ listing.location.city }}</span>
              </p>
              
              <div class="listing-capacity">
                <span>{{ listing.capacity.guests }} {{ t('search.guests') }}</span>
                <span>•</span>
                <span>{{ listing.capacity.bedrooms }} hab.</span>
                <span>•</span>
                <span>{{ listing.capacity.beds }} {{ t('search.beds') }}</span>
              </div>
              
              <!-- Características Locales Destacadas -->
              <div v-if="listing.localFeatures" class="local-features">
                <span v-if="listing.localFeatures.grillType" class="feature-tag">
                  <Flame :size="14" />
                  Parrilla {{ listing.localFeatures.grillType }}
                </span>
                <span v-if="listing.localFeatures.parkingSize" class="feature-tag">
                  <Car :size="14" />
                  Cochera {{ listing.localFeatures.parkingSize }}
                </span>
              </div>
              
              <div class="listing-footer">
                <div class="listing-price">
                  <span class="price-amount">${{ listing.pricing.basePrice }}</span>
                  <span class="price-period">{{ listing.rentalType === 'anual' ? '/ mes' : '/ noche' }}</span>
                </div>
                <span class="view-details">
                  {{ t('search.viewDetails') }}
                  <ArrowRight :size="16" />
                </span>
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
import { useI18n } from 'vue-i18n'
import {
  Search as SearchIcon,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Flame,
  Car,
  X,
  SlidersHorizontal,
  ArrowRight,
  AlertTriangle
} from '@lucide/vue'

const { t } = useI18n()
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
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
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

.label {
  font-weight: 600;
  color: var(--gray-700);
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-icon {
  display: inline-flex;
  align-items: center;
  color: var(--primary-color);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.toggle-chevron {
  display: inline-flex;
  transition: transform 0.25s ease;
}

.toggle-chevron.rotated {
  transform: rotate(180deg);
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

.clear-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.loading-container,
.empty-results {
  text-align: center;
  padding: var(--spacing-2xl);
}

.error-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-lg);
  color: #b91c1c;
}

.error-banner svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.error-content p {
  margin: 0;
}

.retry-btn {
  align-self: flex-start;
}

.empty-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  margin-bottom: var(--spacing-lg);
}

.empty-search-icon {
  color: var(--primary-color);
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
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  text-decoration: none;
  color: inherit;
}

.listing-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
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
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-700);
  background: #fef9c3;
  padding: 2px 6px;
  border-radius: 999px;
  white-space: nowrap;
}

.listing-type {
  text-transform: capitalize;
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.rental-tag {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: none;
}

.rental-tag.temporario {
  background: #dbeafe;
  color: #1e40af;
}

.rental-tag.anual {
  background: #fef3c7;
  color: #92400e;
}

.listing-location {
  display: flex;
  align-items: center;
  gap: 4px;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
