# 🔮 Roadmap Técnico Detallado - AlquiLibres

## 📋 Features Pendientes por Prioridad

### 🔴 CRÍTICO (Implementar antes del lanzamiento público)

#### 1. Sistema de Upload de Imágenes
**Archivo:** `src/components/shared/ImageUploader.vue`

```vue
<template>
  <div class="image-uploader">
    <input 
      type="file" 
      multiple 
      accept="image/*"
      @change="handleFileSelect"
      ref="fileInput"
    />
    <div class="preview-grid">
      <div v-for="(image, index) in images" :key="index">
        <img :src="image.url" />
        <button @click="removeImage(index)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storage } from '@/config/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// TODO: Implementar lógica de upload
// - Validar tamaño (max 5MB)
// - Comprimir imágenes
// - Subir a Firebase Storage
// - Obtener URLs
</script>
```

**Prioridad:** ALTA
**Esfuerzo:** 4-6 horas
**Dependencias:** Firebase Storage configurado

---

#### 2. Integración de Pagos
**Archivos necesarios:**
- `src/services/payment.js`
- `src/views/owner/Checkout.vue`
- `src/components/payment/CreditCardForm.vue`

**Opciones recomendadas:**

**A. Stripe (Internacional)**
```javascript
// src/services/stripe.js
import { loadStripe } from '@stripe/stripe-js'

export const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

export const createSubscription = async (priceId) => {
  // Crear subscription en Stripe
}
```

**B. MercadoPago (LATAM)**
```javascript
// src/services/mercadopago.js
import { MercadoPago } from '@mercadopago/sdk-react'

export const initMercadoPago = () => {
  const mp = new MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY)
  return mp
}
```

**Prioridad:** CRÍTICA
**Esfuerzo:** 8-12 horas
**Dependencias:** Cuenta en pasarela de pagos

---

#### 3. Sistema de Mensajería en Tiempo Real
**Archivo:** `src/views/owner/Messages.vue` (actualizar)

```javascript
// Usar Firestore onSnapshot para tiempo real
import { onSnapshot, collection, query, where } from 'firebase/firestore'

const unsubscribe = onSnapshot(
  query(
    collection(db, messagesPath),
    where('status', '==', 'unread')
  ),
  (snapshot) => {
    // Actualizar mensajes en tiempo real
    messages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }
)
```

**Prioridad:** ALTA
**Esfuerzo:** 6-8 horas

---

### 🟡 IMPORTANTE (Próximas 2-4 semanas)

#### 4. Sincronización de Calendario iCal
**Archivo:** `src/services/calendar.js`

```javascript
// Importar desde Airbnb, Booking, etc.
export const importICalendar = async (icalUrl, propertyId) => {
  const response = await fetch(icalUrl)
  const icalData = await response.text()
  
  // Parsear iCal
  const events = parseICAL(icalData)
  
  // Sincronizar fechas bloqueadas en Firestore
  await updateBlockedDates(propertyId, events)
}

// Exportar para otros servicios
export const generateICalUrl = (propertyId) => {
  // Generar URL pública para que Airbnb/Booking lean
  return `https://alquilubres.com/cal/${propertyId}.ics`
}
```

**Prioridad:** MEDIA-ALTA
**Esfuerzo:** 10-15 horas
**Librerías:** `ical.js` o `node-ical`

---

#### 5. Sistema de Reseñas Verificadas
**Archivos:**
- `src/components/reviews/ReviewForm.vue`
- `src/components/reviews/ReviewList.vue`
- `src/stores/reviews.js`

**Flujo:**
1. Huésped contacta/reserva
2. Después de check-out, recibe email para reseñar
3. Solo puede reseñar si hay evidencia de reserva
4. Review se marca como "Verificado"

**Base de datos:**
```javascript
// /artifacts/alqui-libres/public/data/reviews/{reviewId}
{
  listingId: string,
  guestId: string,
  guestName: string,
  rating: number,
  comment: string,
  verified: boolean,  // Solo true si hay reserva confirmada
  response: string,   // Respuesta del propietario
  createdAt: timestamp
}
```

**Prioridad:** MEDIA
**Esfuerzo:** 8-12 horas

---

#### 6. Dashboard de Analytics
**Archivo:** `src/views/owner/Analytics.vue`

**Métricas a mostrar:**
- Vistas de tu propiedad (últimos 30 días)
- Tasa de conversión (vistas → contactos)
- Comparación con propiedades similares
- Precio promedio en tu zona
- Mejor época del año

**Implementación:**
```javascript
// Crear colección de analytics
// /artifacts/alqui-libres/analytics/views/{date}
{
  listingId: string,
  viewCount: number,
  contactCount: number,
  date: string
}

// Agregar en PropertyDetail.vue
onMounted(() => {
  trackView(propertyId)
})
```

**Prioridad:** MEDIA
**Esfuerzo:** 10-15 horas

---

### 🟢 MEJORAS (Próximos 1-3 meses)

#### 7. Búsqueda con Mapas Interactivos
**Librerías:** Leaflet o Google Maps

```vue
<template>
  <div class="map-search">
    <div id="map" class="map-container"></div>
    <div class="search-results-sidebar">
      <!-- Lista de propiedades -->
    </div>
  </div>
</template>

<script setup>
import L from 'leaflet'

const map = L.map('map').setView([lat, lng], 13)

// Agregar markers por cada propiedad
listings.value.forEach(listing => {
  L.marker([listing.location.coordinates.lat, listing.location.coordinates.lng])
    .addTo(map)
    .bindPopup(listing.title)
})
</script>
```

**Prioridad:** BAJA-MEDIA
**Esfuerzo:** 6-10 horas

---

#### 8. Notificaciones Push
**Servicios:** Firebase Cloud Messaging

```javascript
// src/services/notifications.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const messaging = getMessaging()

export const requestNotificationPermission = async () => {
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  })
  
  // Guardar token en Firestore
  await saveTokenToFirestore(token)
}

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}
```

**Casos de uso:**
- Nueva reserva solicitada
- Nuevo mensaje de huésped
- Renovación de suscripción próxima

**Prioridad:** BAJA-MEDIA
**Esfuerzo:** 8-12 horas

---

#### 9. Multi-idioma (i18n)
**Librería:** vue-i18n

```javascript
// src/i18n/index.js
import { createI18n } from 'vue-i18n'

const messages = {
  es: {
    home: {
      title: 'Alquileres Sin Comisiones',
      search: 'Buscar Alojamiento'
    }
  },
  en: {
    home: {
      title: 'Rentals Without Commissions',
      search: 'Search Accommodation'
    }
  },
  pt: {
    home: {
      title: 'Aluguéis Sem Comissões',
      search: 'Buscar Acomodação'
    }
  }
}

export default createI18n({
  locale: 'es',
  fallbackLocale: 'es',
  messages
})
```

**Prioridad:** BAJA
**Esfuerzo:** 15-20 horas

---

#### 10. App Móvil Nativa
**Framework:** React Native o Flutter

**Estructura sugerida:**
```
alqui-libres-mobile/
├── src/
│   ├── screens/
│   │   ├── Home.js
│   │   ├── Search.js
│   │   ├── PropertyDetail.js
│   │   └── Dashboard.js
│   ├── components/
│   ├── services/
│   │   └── firebase.js  (reutilizar lógica)
│   └── navigation/
├── ios/
├── android/
└── package.json
```

**Prioridad:** BAJA (después de validar web)
**Esfuerzo:** 80-120 horas

---

## 🎨 Componentes UI Faltantes

### 1. Loading Spinner Mejorado
**Archivo:** `src/components/shared/LoadingSpinner.vue`

```vue
<template>
  <div class="loading-overlay" v-if="show">
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>
```

### 2. Toast Notifications
**Archivo:** `src/components/shared/ToastNotification.vue`

```javascript
// src/composables/useToast.js
export const useToast = () => {
  const showToast = (message, type = 'info') => {
    // Implementar sistema de toasts
  }
  
  return { showToast }
}
```

### 3. Modal Genérico
**Archivo:** `src/components/shared/Modal.vue`

```vue
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="close">×</button>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>
```

### 4. Carousel de Imágenes
**Archivo:** `src/components/shared/ImageCarousel.vue`

Para PropertyDetail con navegación touch/swipe

### 5. Date Range Picker
**Archivo:** `src/components/shared/DateRangePicker.vue`

Mejor UX que inputs de fecha estándar

---

## 🔧 Mejoras Técnicas

### 1. Error Handling Global

```javascript
// src/utils/errorHandler.js
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error)
  
  // Log a servicio externo (Sentry)
  if (import.meta.env.PROD) {
    logToSentry(error)
  }
  
  // Mostrar mensaje al usuario
  showToast(getErrorMessage(error), 'error')
}
```

### 2. Request Interceptor

```javascript
// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(
  config => {
    // Agregar auth token
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)
```

### 3. Caché de Búsquedas

```javascript
// src/stores/search.js
const searchCache = new Map()

const searchListings = async (filters) => {
  const cacheKey = JSON.stringify(filters)
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)
  }
  
  const results = await fetchFromFirestore(filters)
  searchCache.set(cacheKey, results)
  
  return results
}
```

### 4. Lazy Loading de Imágenes

```vue
<template>
  <img 
    :src="placeholder" 
    :data-src="actualImage"
    class="lazy"
  />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const lazyImages = document.querySelectorAll('.lazy')
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        imageObserver.unobserve(img)
      }
    })
  })
  
  lazyImages.forEach(img => imageObserver.observe(img))
})
</script>
```

---

## 🧪 Testing Pendiente

### Unit Tests
```javascript
// tests/stores/property.spec.js
describe('Property Store', () => {
  it('crea propiedad correctamente', async () => {
    // Test
  })
  
  it('sincroniza a colección pública', async () => {
    // Test
  })
})
```

### E2E Tests
```javascript
// cypress/e2e/booking-flow.cy.js
describe('Flujo de Reserva', () => {
  it('permite búsqueda y contacto', () => {
    cy.visit('/')
    cy.get('[data-cy=search-city]').type('Córdoba')
    cy.get('[data-cy=search-submit]').click()
    cy.get('[data-cy=listing-card]').first().click()
    cy.get('[data-cy=contact-button]').click()
  })
})
```

---

## 📦 Dependencias Adicionales Recomendadas

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.1.0",
    "ical.js": "^1.5.0",
    "vue-i18n": "^9.5.0",
    "leaflet": "^1.9.4",
    "@vueuse/core": "^10.5.0"
  },
  "devDependencies": {
    "cypress": "^13.3.0",
    "@vitest/ui": "^0.34.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.3"
  }
}
```

---

## 🎯 Priorización Sugerida

**Sprint 1 (Semana 1-2):**
1. Upload de imágenes
2. Sistema de pagos básico
3. Mensajería en tiempo real

**Sprint 2 (Semana 3-4):**
4. Calendario iCal
5. Sistema de reseñas
6. Toast notifications

**Sprint 3 (Semana 5-6):**
7. Analytics dashboard
8. Notificaciones push
9. Error handling global

**Sprint 4 (Semana 7-8):**
10. Búsqueda con mapas
11. Multi-idioma
12. Tests E2E

---

## 💡 Ideas Innovadoras Futuras

### 1. AI para Optimización de Precios
```javascript
// Usar historical data + eventos locales
const suggestedPrice = await calculateOptimalPrice({
  season: 'summer',
  localEvents: ['Festival de Jazz'],
  competitorPrices: [120, 135, 110],
  yourAmenities: property.amenities
})
```

### 2. Respuestas Automáticas Inteligentes
```javascript
// GPT-4 para responder consultas comunes
const response = await generateResponse({
  guestMessage: "¿Está disponible del 15 al 20?",
  propertyInfo: property,
  availability: calendar
})
```

### 3. Verificación de Identidad
```javascript
// Integración con servicio de verificación
import { verifyIdentity } from '@stripe/identity'

const verified = await verifyIdentity(userId)
```

### 4. Seguro Integrado
```javascript
// Partnership con aseguradora
const insuranceQuote = await getInsuranceQuote({
  propertyValue: 200000,
  nights: 5,
  guests: 4
})
```

---

## 📞 Contribuir

¿Quieres implementar alguna de estas features?

1. Escoge una tarea
2. Crea un branch: `feature/nombre-feature`
3. Implementa
4. Crea Pull Request
5. Celebra 🎉

---

**AlquiLibres** - El futuro de los alquileres temporarios 🚀
