<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            Alquileres Temporarios <br>
            <span class="highlight">Sin Comisiones</span>
          </h1>
          <p class="hero-subtitle">
            La única plataforma local con suscripción fija para propietarios.<br>
            Sin comisiones por reserva. Maximiza tus ganancias.
          </p>
          
          <!-- Search Form -->
          <div class="search-form">
            <div class="search-inputs">
              <div class="search-input-group">
                <label>Ciudad</label>
                <input 
                  v-model="searchFilters.city" 
                  type="text" 
                  placeholder="¿A dónde vas?"
                  class="input"
                />
              </div>
              
              <div class="search-input-group">
                <label>Check-in</label>
                <input 
                  v-model="searchFilters.checkIn" 
                  type="date" 
                  class="input"
                />
              </div>
              
              <div class="search-input-group">
                <label>Check-out</label>
                <input 
                  v-model="searchFilters.checkOut" 
                  type="date" 
                  class="input"
                />
              </div>
              
              <div class="search-input-group">
                <label>Huéspedes</label>
                <select v-model.number="searchFilters.guests" class="select">
                  <option :value="1">1 huésped</option>
                  <option :value="2">2 huéspedes</option>
                  <option :value="3">3 huéspedes</option>
                  <option :value="4">4 huéspedes</option>
                  <option :value="5">5+ huéspedes</option>
                </select>
              </div>
            </div>
            
            <button @click="handleSearch" class="btn btn-primary btn-lg search-btn">
              Buscar Alojamiento
            </button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">¿Por qué AlquiLibres?</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3 class="feature-title">Sin Comisiones por Reserva</h3>
            <p class="feature-text">
              Los propietarios pagan una suscripción fija mensual. 
              No importa cuántas reservas tengas, tu ganancia es 100%.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📍</div>
            <h3 class="feature-title">Hiper-Local</h3>
            <p class="feature-text">
              Conocemos tu ciudad. Filtros específicos que los gigantes no tienen:
              tipo de parrilla, cercanía a atracciones locales, y más.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Simple y Rápido</h3>
            <p class="feature-text">
              Editor de anuncios intuitivo, calendario sincronizado, 
              y gestión de mensajes más simple que las plataformas globales.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
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
    <section class="cta">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">¿Tienes una propiedad para alquilar?</h2>
          <p class="cta-text">
            Únete a AlquiLibres y ahorra hasta 25% en comisiones.<br>
            Suscripción desde $XX/mes. Sin costos ocultos.
          </p>
          <router-link to="/registro" class="btn btn-primary btn-lg">
            Publicar Mi Propiedad
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'

const router = useRouter()
const searchStore = useSearchStore()

const searchFilters = ref({
  city: '',
  checkIn: '',
  checkOut: '',
  guests: 2
})

const handleSearch = () => {
  searchStore.updateFilters(searchFilters.value)
  router.push('/buscar')
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-2xl);
}

.hero-content {
  text-align: center;
  max-width: 900px;
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
  margin-bottom: var(--spacing-2xl);
  opacity: 0.95;
}

.search-form {
  background: white;
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
}

.features {
  padding: var(--spacing-2xl) 0;
}

.section-title {
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
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
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

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.875rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .search-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
