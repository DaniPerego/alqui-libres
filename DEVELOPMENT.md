# AlquiLibres - Guía de Desarrollo

## 🏗️ Arquitectura de la Aplicación

### Patrón de Diseño

La aplicación sigue un patrón **Flux/Redux** usando Pinia para la gestión del estado:

```
Vista (Vue Component) → Acción (Store Action) → Firestore → Mutación (Store State) → Vista
```

### Flujo de Datos

1. **Usuario interactúa** con un componente Vue
2. Componente **llama a una acción** del store
3. Store **comunica con Firebase/Firestore**
4. Firebase retorna datos
5. Store **actualiza el estado**
6. Vue **reactivamente actualiza** la vista

## 📦 Stores (Pinia)

### Auth Store (`stores/auth.js`)

Gestiona la autenticación de usuarios:

- `user`: Usuario actual autenticado
- `isAuthenticated`: Boolean de estado de autenticación
- `login()`: Iniciar sesión
- `register()`: Crear cuenta
- `logout()`: Cerrar sesión
- `checkAuth()`: Verificar estado de autenticación

### Property Store (`stores/property.js`)

Gestiona las propiedades del locatario:

- `properties`: Array de propiedades del usuario
- `currentProperty`: Propiedad actualmente seleccionada
- `fetchUserProperties()`: Obtener propiedades del usuario
- `createProperty()`: Crear nueva propiedad
- `updateProperty()`: Actualizar propiedad existente
- `deleteProperty()`: Eliminar propiedad
- `syncToPublicListings()`: Sincronizar con colección pública

### Search Store (`stores/search.js`)

Gestiona la búsqueda pública de propiedades:

- `listings`: Todas las propiedades disponibles
- `filteredListings`: Propiedades filtradas
- `filters`: Objeto con filtros activos
- `searchListings()`: Buscar en Firestore
- `applyClientFilters()`: Aplicar filtros en el cliente
- `updateFilters()`: Actualizar filtros de búsqueda

## 🔄 Ciclo de Vida de una Propiedad

### 1. Creación

```javascript
// Usuario completa el formulario en PropertyEditor.vue
const formData = {
  title: "Casa con Parrilla",
  description: "...",
  // ... más datos
}

// Se llama al store
await propertyStore.createProperty(userId, formData)

// El store crea dos documentos:
// 1. Colección privada: /artifacts/alqui-libres/users/{userId}/properties/{id}
// 2. Colección pública: /artifacts/alqui-libres/public/data/listings/{id}
```

### 2. Sincronización

La función `syncToPublicListings()` mantiene sincronizadas ambas colecciones:
- **Privada**: Datos completos para el propietario
- **Pública**: Datos optimizados para búsqueda (sin información sensible)

### 3. Búsqueda

```javascript
// Usuario busca propiedades
await searchStore.searchListings()

// Firestore query con índices:
query(
  listingsRef,
  where('isActive', '==', true),
  where('location.city', '==', city),
  orderBy('createdAt', 'desc')
)

// Filtros adicionales se aplican en el cliente
searchStore.applyClientFilters()
```

## 🎨 Componentes Reutilizables

### Estructura de un Componente

```vue
<template>
  <!-- Contenido del componente -->
</template>

<script setup>
// Composition API - más limpio y eficiente
import { ref, computed, onMounted } from 'vue'

// Estado local
const data = ref(null)

// Computed properties
const processedData = computed(() => {
  // transformación
})

// Métodos
const handleAction = () => {
  // lógica
}

// Lifecycle
onMounted(() => {
  // inicialización
})
</script>

<style scoped>
/* Estilos con scope local */
</style>
```

## 🔐 Seguridad y Validación

### Reglas de Firestore

Las reglas en `firestore.rules.json` garantizan que:
- Solo el propietario puede editar sus propiedades
- Todos pueden leer listings públicos
- Las reviews requieren autenticación
- Los datos privados son inaccesibles

### Validación de Formularios

```javascript
// Validación en el cliente
const handleSubmit = async () => {
  // Validar datos antes de enviar
  if (!formData.title || formData.title.length < 5) {
    error.value = "El título debe tener al menos 5 caracteres"
    return
  }
  
  // Enviar a Firestore
  await propertyStore.createProperty(userId, formData)
}
```

## 🚀 Optimizaciones de Performance

### 1. Lazy Loading de Rutas

```javascript
// router/index.js
const Home = () => import('@/views/Home.vue')
const Search = () => import('@/views/Search.vue')
```

Cada ruta se carga solo cuando es necesaria.

### 2. Code Splitting

```javascript
// vite.config.js
rollupOptions: {
  output: {
    manualChunks: {
      'vue-vendor': ['vue', 'vue-router', 'pinia'],
      'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
    }
  }
}
```

### 3. Índices de Firestore

Crear índices compuestos para búsquedas complejas:

```
Collection: listings
Fields: isActive (ASC), location.city (ASC), createdAt (DESC)
```

### 4. Caché de Imágenes

```html
<!-- Headers en firebase.json -->
"Cache-Control": "max-age=31536000"
```

## 🧪 Testing

### Unit Tests (Recomendado)

```javascript
// tests/stores/auth.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('debería autenticar usuario', async () => {
    const store = useAuthStore()
    await store.login('test@example.com', 'password')
    expect(store.isAuthenticated).toBe(true)
  })
})
```

### E2E Tests (Cypress recomendado)

```javascript
// cypress/e2e/property-creation.cy.js
describe('Crear Propiedad', () => {
  it('permite crear una nueva propiedad', () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type('test@example.com')
    cy.get('[data-cy=password]').type('password')
    cy.get('[data-cy=submit]').click()
    
    cy.visit('/panel/propiedades/nueva')
    cy.get('[data-cy=title]').type('Casa de Prueba')
    // ... más pasos
  })
})
```

## 📊 Análisis y Monitoreo

### Firebase Analytics

```javascript
// main.js
import { getAnalytics } from 'firebase/analytics'

const analytics = getAnalytics(app)

// Trackear eventos
logEvent(analytics, 'property_created', {
  userId: user.uid,
  propertyType: 'casa'
})
```

### Performance Monitoring

```javascript
import { getPerformance } from 'firebase/performance'

const perf = getPerformance(app)
```

## 🔧 Comandos Útiles

```powershell
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linter
npm run lint

# Formatear código
npm run format

# Tests
npm run test

# Deploy a Firebase
firebase deploy

# Solo hosting
firebase deploy --only hosting

# Solo Firestore rules
firebase deploy --only firestore:rules
```

## 📝 Convenciones de Código

### Naming

- **Componentes**: PascalCase (`PropertyEditor.vue`)
- **Stores**: camelCase (`propertyStore`)
- **Variables**: camelCase (`userData`)
- **Constantes**: UPPER_CASE (`API_KEY`)

### Commits

Usar conventional commits:

```
feat: añade filtro de tipo de parrilla
fix: corrige error en calendario
docs: actualiza README
style: formatea código
refactor: optimiza búsqueda
test: añade tests para auth
```

### Estructura de Archivos

```
ComponentName.vue
├── <template>        # HTML del componente
├── <script setup>    # Lógica (Composition API)
└── <style scoped>    # Estilos locales
```

## 🐛 Debugging

### Vue DevTools

Instalar extensión de navegador: [Vue.js DevTools](https://devtools.vuejs.org/)

### Firebase Emulators

Para desarrollo local:

```powershell
firebase emulators:start
```

## 🔄 Git Workflow

```bash
# Crear rama feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits
git add .
git commit -m "feat: añade nueva funcionalidad"

# Push
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

## 📚 Recursos Adicionales

- [Vue.js Docs](https://vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev/)

---

¿Preguntas? Consulta la documentación o abre un issue en GitHub.
