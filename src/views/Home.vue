<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            Alquileres <span class="highlight">Sin Comisiones</span>
          </h1>
          <p class="hero-subtitle">
            La única plataforma local con suscripción fija para propietarios.<br>
            Sin comisiones por reserva. Maximiza tus ganancias.
          </p>

          <!-- Rental Type Tabs -->
          <div class="rental-tabs">
            <button
              :class="['tab-btn', { active: rentalType === 'temporario' }]"
              @click="rentalType = 'temporario'"
            >
              <Clock :size="20" />
              Alquiler Diario
            </button>
            <button
              :class="['tab-btn', { active: rentalType === 'anual' }]"
              @click="rentalType = 'anual'"
            >
              <Calendar :size="20" />
              Alquiler Anual
            </button>
          </div>

          <!-- Search Form -->
          <div class="search-form">
            <div class="search-inputs">
              <div class="search-input-group">
                <label for="home-city">Ciudad</label>
                <input
                  id="home-city"
                  v-model="searchFilters.city"
                  type="text"
                  placeholder="¿A dónde vas?"
                  class="input"
                />
              </div>

              <template v-if="rentalType === 'temporario'">
                <div class="search-input-group">
                  <label for="home-checkin">Check-in</label>
                  <input
                    id="home-checkin"
                    v-model="searchFilters.checkIn"
                    type="date"
                    class="input"
                  />
                </div>

                <div class="search-input-group">
                  <label for="home-checkout">Check-out</label>
                  <input
                    id="home-checkout"
                    v-model="searchFilters.checkOut"
                    type="date"
                    class="input"
                  />
                </div>

                <div class="search-input-group">
                  <label for="home-guests">Huéspedes</label>
                  <select id="home-guests" v-model.number="searchFilters.guests" class="select">
                    <option :value="1">1 huésped</option>
                    <option :value="2">2 huéspedes</option>
                    <option :value="3">3 huéspedes</option>
                    <option :value="4">4 huéspedes</option>
                    <option :value="5">5+ huéspedes</option>
                  </select>
                </div>
              </template>

              <template v-else>
                <div class="search-input-group">
                  <label for="home-bedrooms">Dormitorios</label>
                  <select id="home-bedrooms" v-model.number="searchFilters.minBedrooms" class="select">
                    <option :value="0">Cualquiera</option>
                    <option :value="1">1 dormitorio</option>
                    <option :value="2">2 dormitorios</option>
                    <option :value="3">3 dormitorios</option>
                    <option :value="4">4+ dormitorios</option>
                  </select>
                </div>
                <div class="search-input-group">
                  <label for="home-maxprice">Precio Máx / Mes</label>
                  <input
                    id="home-maxprice"
                    v-model.number="searchFilters.priceMax"
                    type="number"
                    placeholder="Presupuesto mensual"
                    class="input"
                    min="0"
                  />
                </div>
              </template>
            </div>

            <button @click="handleSearch" class="btn btn-primary btn-lg search-btn">
              <Search :size="20" />
              {{ rentalType === 'anual' ? 'Buscar Propiedades' : 'Buscar Alojamiento' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Properties -->
    <section class="featured section-divider">
      <div class="container">
        <p class="section-label">Explorar</p>
        <h2 class="section-heading">Propiedades Destacadas</h2>
        <div class="featured-grid">
          <div
            v-for="property in filteredFeatured"
            :key="property.id"
            class="property-card"
            @click="viewProperty(property.id)"
          >
            <div class="card-image">
              <img :src="property.mainImage" :alt="property.title" loading="lazy" />
              <span :class="['rental-badge', property.rentalType]">
                {{ property.rentalType === 'anual' ? 'Anual' : 'Diario' }}
              </span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ property.title }}</h3>
              <p class="card-location">
                <MapPin :size="14" />
                {{ property.location.city }}, {{ property.location.state }}
              </p>
              <div class="card-footer">
                <div class="card-price">
                  <strong>${{ property.pricing.basePrice }}</strong>
                  <span>{{ property.rentalType === 'anual' ? '/mes' : '/noche' }}</span>
                </div>
                <div class="card-rating" v-if="property.rating">
                  <Star :size="16" fill="#fbbf24" stroke="#fbbf24" />
                  <span>{{ property.rating }}</span>
                  <span class="review-count">({{ property.reviewCount }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features section-divider">
      <div class="container">
        <p class="section-label">Beneficios</p>
        <h2 class="section-heading">¿Por qué AlquiLibres?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon"><Wallet :size="32" /></div>
            <h3 class="feature-title">Sin Comisiones por Reserva</h3>
            <p class="feature-text">
              Los propietarios pagan una suscripción fija mensual.
              No importa cuántas reservas tengas, tu ganancia es 100%.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><MapPin :size="32" /></div>
            <h3 class="feature-title">Hiper-Local</h3>
            <p class="feature-text">
              Conocemos tu ciudad. Filtros específicos que los gigantes no tienen:
              tipo de parrilla, cercanía a atracciones locales, y más.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><Zap :size="32" /></div>
            <h3 class="feature-title">Simple y Rápido</h3>
            <p class="feature-text">
              Editor de anuncios intuitivo, calendario sincronizado,
              y gestión de mensajes más simple que las plataformas globales.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><Shield :size="32" /></div>
            <h3 class="feature-title">Transparencia Total</h3>
            <p class="feature-text">
              Precio final visible desde el principio. Sin tasas ocultas.
              Los huéspedes saben exactamente cuánto van a pagar.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta section-divider">
      <div class="container">
        <div class="cta-content">
          <p class="section-label">Propietarios</p>
          <h2 class="section-heading">¿Tienes una propiedad para alquilar?</h2>
          <p class="cta-text">
            Únete a AlquiLibres y ahorra hasta 25% en comisiones.<br>
            Suscripción desde $XX/mes. Sin costos ocultos.
          </p>
          <router-link to="/registro" class="btn btn-primary btn-lg">
            Publicar Mi Propiedad
            <ArrowRight :size="20" />
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { mockProperties, mockAnnualProperty } from '@/data/mockData'
import { Clock, Calendar, Search, MapPin, Star, Wallet, Zap, Shield, ArrowRight } from '@lucide/vue'

const router = useRouter()
const searchStore = useSearchStore()

const rentalType = ref('temporario')

const searchFilters = ref({
  city: '',
  checkIn: '',
  checkOut: '',
  guests: 2,
  minBedrooms: 0,
  priceMax: 100000
})

const featuredProperties = ref([...mockProperties.slice(0, 3), mockAnnualProperty])

const filteredFeatured = computed(() =>
  featuredProperties.value.filter(p => p.isActive)
)

const handleSearch = () => {
  searchStore.clearFilters()
  const filters = {
    city: searchFilters.value.city,
    rentalType: rentalType.value,
    guests: searchFilters.value.guests
  }
  if (rentalType.value === 'temporario') {
    filters.checkIn = searchFilters.value.checkIn
    filters.checkOut = searchFilters.value.checkOut
    filters.priceMax = 5000
  } else {
    filters.priceMax = searchFilters.value.priceMax
    if (searchFilters.value.minBedrooms > 0) {
      searchStore.filters.minBedrooms = searchFilters.value.minBedrooms
    }
  }
  searchStore.updateFilters(filters)
  router.push('/buscar')
}

const viewProperty = (id) => {
  router.push(`/propiedad/${id}`)
}
</script>

<style scoped>
/* ===== Hero ===== */
.hero {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #4f46e5 100%);
  color: white;
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-2xl);
}

.hero-content {
  text-align: center;
  max-width: 1000px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
}

.highlight {
  color: #fbbf24;
}

.hero-subtitle {
  font-size: 1.125rem;
  margin-bottom: var(--spacing-xl);
  opacity: 0.95;
}

/* ===== Rental Tabs ===== */
.rental-tabs {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  background: transparent;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  border-color: #fbbf24;
  background: #fbbf24;
  color: #1e3a5f;
}

/* ===== Search Form ===== */
.search-form {
  background: white;
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-xl);
}

.search-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.search-input-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
}

.search-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ===== Featured Properties ===== */
.featured {
  padding: var(--spacing-2xl) 0;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.property-card {
  background: white;
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.property-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rental-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rental-badge.temporario {
  background: #dbeafe;
  color: #1e40af;
}

.rental-badge.anual {
  background: #fef3c7;
  color: #92400e;
}

.card-body {
  padding: var(--spacing-lg);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--gray-900);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-location {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-price strong {
  font-size: 1.25rem;
  color: var(--gray-900);
}

.card-price span {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--gray-800);
}

.review-count {
  font-weight: 400;
  color: var(--gray-500);
  font-size: 0.875rem;
}

/* ===== Features ===== */
.features {
  padding: var(--spacing-2xl) 0;
}

.section-heading {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  color: var(--gray-900);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

.feature-card {
  text-align: center;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  background: white;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.feature-text {
  color: var(--gray-600);
  line-height: 1.6;
}

/* ===== CTA ===== */
.cta {
  background: var(--gray-100);
  padding: var(--spacing-2xl) 0;
  text-align: center;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.cta-text {
  font-size: 1.125rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.cta-content .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.875rem;
  }

  .section-heading {
    font-size: 1.5rem;
  }

  .search-inputs {
    grid-template-columns: 1fr;
  }

  .rental-tabs {
    flex-direction: column;
    align-items: stretch;
    padding: 0 var(--spacing-lg);
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }
}
</style>
