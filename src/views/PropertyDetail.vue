<template>
  <div class="property-detail" v-if="property">
    <div class="container">
      <!-- Galería de Imágenes -->
      <div class="image-gallery">
        <div class="main-image">
          <img :src="currentImage" :alt="property.title" />
        </div>
        <div class="thumbnail-grid" v-if="property.images.length > 1">
          <img
            v-for="(image, index) in property.images.slice(0, 5)"
            :key="index"
            :src="image"
            :alt="`${property.title} ${index + 1}`"
            @click="currentImage = image"
            :class="{ active: currentImage === image }"
          />
        </div>
      </div>
      
      <div class="detail-content">
        <!-- Información Principal -->
        <div class="main-info">
          <div class="property-header">
            <div>
              <h1 class="property-title">{{ property.title }}</h1>
              <p class="property-location">
                📍 {{ property.location.city }}, {{ property.location.state }}
              </p>
              <div class="property-meta">
                <span>{{ property.capacity.guests }} huéspedes</span>
                <span>•</span>
                <span>{{ property.capacity.bedrooms }} habitaciones</span>
                <span>•</span>
                <span>{{ property.capacity.beds }} camas</span>
                <span>•</span>
                <span>{{ property.capacity.bathrooms }} baños</span>
              </div>
            </div>
            <div v-if="property.rating" class="property-rating">
              <span class="rating-value">⭐ {{ property.rating.toFixed(1) }}</span>
              <span class="rating-count">({{ property.reviewCount }} reseñas)</span>
            </div>
          </div>
          
          <!-- Descripción -->
          <section class="detail-section">
            <h2 class="section-title">Sobre esta propiedad</h2>
            <p class="property-description">{{ property.description }}</p>
          </section>
          
          <!-- Características Locales Destacadas -->
          <section class="detail-section highlight-section" v-if="property.localFeatures">
            <h2 class="section-title">🎯 Características Especiales</h2>
            <div class="features-grid">
              <div v-if="property.localFeatures.grillType" class="feature-item">
                <span class="feature-icon">🔥</span>
                <div>
                  <strong>Parrilla {{ property.localFeatures.grillType }}</strong>
                  <p>Perfecta para asados al aire libre</p>
                </div>
              </div>
              
              <div v-if="property.localFeatures.parkingSize" class="feature-item">
                <span class="feature-icon">🚗</span>
                <div>
                  <strong>Cochera {{ property.localFeatures.parkingSize }}</strong>
                  <p>Estacionamiento seguro</p>
                </div>
              </div>
              
              <div v-if="property.localFeatures.distanceToCenter" class="feature-item">
                <span class="feature-icon">📍</span>
                <div>
                  <strong>{{ property.localFeatures.distanceToCenter }} km del centro</strong>
                  <p>Ubicación conveniente</p>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Amenidades -->
          <section class="detail-section">
            <h2 class="section-title">Comodidades</h2>
            <div class="amenities-grid">
              <div v-for="amenity in property.amenities" :key="amenity" class="amenity-item">
                <span class="amenity-icon">✓</span>
                <span>{{ amenity }}</span>
              </div>
            </div>
          </section>
          
          <!-- Calendario de Disponibilidad -->
          <section class="detail-section">
            <h2 class="section-title">Disponibilidad</h2>
            <div class="calendar-placeholder">
              <p>📅 Calendario de disponibilidad</p>
              <p class="calendar-note">Selecciona tus fechas para ver la disponibilidad</p>
            </div>
          </section>
        </div>
        
        <!-- Sidebar de Reserva -->
        <aside class="booking-sidebar card">
          <div class="pricing-info">
            <div class="price-display">
              <span class="price-amount">${{ property.pricing.basePrice }}</span>
              <span class="price-period">/ noche</span>
            </div>
            <div v-if="property.pricing.cleaningFee > 0" class="additional-fees">
              <span>Tarifa de limpieza: ${{ property.pricing.cleaningFee }}</span>
            </div>
          </div>
          
          <div class="booking-form">
            <div class="form-group">
              <label class="label">Check-in</label>
              <input v-model="bookingDates.checkIn" type="date" class="input" />
            </div>
            
            <div class="form-group">
              <label class="label">Check-out</label>
              <input v-model="bookingDates.checkOut" type="date" class="input" />
            </div>
            
            <div class="form-group">
              <label class="label">Huéspedes</label>
              <select v-model.number="bookingDates.guests" class="select">
                <option v-for="n in property.capacity.guests" :key="n" :value="n">
                  {{ n }} {{ n === 1 ? 'huésped' : 'huéspedes' }}
                </option>
              </select>
            </div>
          </div>
          
          <div v-if="totalPrice > 0" class="price-breakdown">
            <div class="price-row">
              <span>${{ property.pricing.basePrice }} x {{ nights }} noches</span>
              <span>${{ property.pricing.basePrice * nights }}</span>
            </div>
            <div v-if="property.pricing.cleaningFee > 0" class="price-row">
              <span>Tarifa de limpieza</span>
              <span>${{ property.pricing.cleaningFee }}</span>
            </div>
            <div class="price-row total">
              <strong>Total</strong>
              <strong>${{ totalPrice }}</strong>
            </div>
          </div>
          
          <button @click="contactOwner" class="btn btn-primary btn-lg">
            Contactar al Anfitrión
          </button>
          
          <p class="no-fees-notice">
            ✓ Precio final sin cargos ocultos<br>
            ✓ Sin comisiones adicionales
          </p>
        </aside>
      </div>
      
      <!-- Reseñas -->
      <section class="reviews-section" v-if="reviews.length > 0">
        <h2 class="section-title">Reseñas de Huéspedes</h2>
        <div class="reviews-grid">
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <strong>{{ review.guestName }}</strong>
              <span class="review-rating">⭐ {{ review.rating }}</span>
            </div>
            <p class="review-date">{{ formatDate(review.createdAt) }}</p>
            <p class="review-comment">{{ review.comment }}</p>
            <span v-if="review.verified" class="verified-badge">✓ Verificado</span>
          </div>
        </div>
      </section>
    </div>
  </div>
  
  <div v-else class="loading-container">
    <div class="spinner"></div>
    <p>Cargando propiedad...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSEO, generatePropertySchema } from '@/composables/useSEO'

const route = useRoute()
const { updateMetaTags, addStructuredData } = useSEO()

// Estado
const property = ref(null)
const currentImage = ref('')
const bookingDates = ref({
  checkIn: '',
  checkOut: '',
  guests: 2
})
const reviews = ref([])

// Computed
const nights = computed(() => {
  if (!bookingDates.value.checkIn || !bookingDates.value.checkOut) return 0
  const checkIn = new Date(bookingDates.value.checkIn)
  const checkOut = new Date(bookingDates.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const totalPrice = computed(() => {
  if (nights.value <= 0) return 0
  const basePrice = property.value.pricing.basePrice * nights.value
  const cleaningFee = property.value.pricing.cleaningFee || 0
  return basePrice + cleaningFee
})

// Métodos
const contactOwner = () => {
  // TODO: Implementar sistema de mensajería
  alert('Función de contacto en desarrollo. Por ahora, muestra un formulario de contacto.')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

// Lifecycle
onMounted(async () => {
  // TODO: Cargar datos reales desde Firestore
  // Datos de ejemplo por ahora
  property.value = {
    id: route.params.id,
    title: 'Hermosa Casa con Parrilla y Vista al Lago',
    description: 'Disfruta de una estadía inolvidable en esta espaciosa casa con parrilla de carbón, cochera para 2 autos, y a solo 5 minutos del centro. Perfecta para familias y grupos de amigos que buscan relajarse en un entorno natural sin alejarse de las comodidades urbanas.',
    propertyType: 'casa',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
    ],
    pricing: {
      basePrice: 120,
      cleaningFee: 30,
      currency: 'USD'
    },
    capacity: {
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2
    },
    location: {
      city: 'Villa Carlos Paz',
      state: 'Córdoba',
      country: 'Argentina'
    },
    amenities: [
      'WiFi', 'TV', 'Cocina completa', 'Aire Acondicionado',
      'Calefacción', 'Parrilla', 'Estacionamiento', 'Jardín'
    ],
    localFeatures: {
      grillType: 'carbon',
      parkingSize: 'mediana',
      distanceToCenter: 3.5
    },
    rating: 4.8,
    reviewCount: 24
  }
  
  currentImage.value = property.value.images[0]
  
  // Actualizar meta tags SEO para esta propiedad
  updateMetaTags({
    title: `${property.value.title} | AlquiLibres`,
    description: property.value.description.substring(0, 160),
    url: `https://alquilibres.com/propiedad/${property.value.id}`,
    image: property.value.images[0] + '?w=1200&h=630&fit=crop',
    keywords: `${property.value.propertyType}, ${property.value.location.city}, alquiler temporario, ${property.value.amenities.join(', ')}`,
    type: 'product'
  })
  
  // Agregar Schema.org structured data
  addStructuredData(generatePropertySchema(property.value))
  
  // Reseñas de ejemplo
  reviews.value = [
    {
      id: '1',
      guestName: 'María González',
      rating: 5,
      comment: 'Excelente lugar, muy limpio y la parrilla es espectacular. El anfitrión fue muy atento.',
      verified: true,
      createdAt: new Date('2024-10-15')
    },
    {
      id: '2',
      guestName: 'Carlos Ramírez',
      rating: 4,
      comment: 'Muy buena ubicación y la casa tiene todo lo necesario. La cochera es amplia.',
      verified: true,
      createdAt: new Date('2024-09-22')
    }
  ]
})
</script>

<style scoped>
.property-detail {
  padding: var(--spacing-xl) 0;
}

.image-gallery {
  margin-bottom: var(--spacing-2xl);
}

.main-image {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-md);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-md);
}

.thumbnail-grid img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 3px solid transparent;
}

.thumbnail-grid img:hover,
.thumbnail-grid img.active {
  border-color: var(--primary-color);
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-2xl);
}

.property-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--spacing-xl);
}

.property-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.property-location {
  font-size: 1rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-sm);
}

.property-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--gray-600);
}

.property-rating {
  text-align: right;
}

.rating-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.rating-count {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.detail-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
}

.property-description {
  line-height: 1.8;
  color: var(--gray-700);
}

.highlight-section {
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 2px solid var(--secondary-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.feature-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.feature-icon {
  font-size: 2rem;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.amenity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.amenity-icon {
  color: var(--secondary-color);
  font-weight: 700;
}

.calendar-placeholder {
  padding: var(--spacing-2xl);
  background-color: var(--gray-100);
  border-radius: var(--radius-md);
  text-align: center;
}

.calendar-note {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: var(--spacing-sm);
}

.booking-sidebar {
  padding: var(--spacing-xl);
  height: fit-content;
  position: sticky;
  top: 90px;
}

.pricing-info {
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--spacing-lg);
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.price-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.price-period {
  font-size: 1rem;
  color: var(--gray-600);
}

.additional-fees {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.booking-form {
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.price-breakdown {
  padding: var(--spacing-lg);
  background-color: var(--gray-50);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.price-row.total {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--gray-300);
  margin-top: var(--spacing-md);
  font-size: 1.125rem;
}

.no-fees-notice {
  text-align: center;
  font-size: 0.875rem;
  color: var(--secondary-color);
  margin-top: var(--spacing-md);
  line-height: 1.6;
}

.reviews-section {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-2xl);
  border-top: 1px solid var(--gray-200);
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.review-card {
  padding: var(--spacing-lg);
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.review-rating {
  color: var(--warning-color);
}

.review-date {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: var(--spacing-md);
}

.review-comment {
  color: var(--gray-700);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.verified-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--secondary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
  
  .booking-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .main-image {
    height: 300px;
  }
  
  .thumbnail-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .property-header {
    flex-direction: column;
  }
}
</style>
