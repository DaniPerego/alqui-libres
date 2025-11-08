# 🧪 Guía de Testing - Alquí Libres

## Modo de Prueba (Mock Data)

La aplicación puede funcionar **sin configuración de Firebase** usando datos de prueba (mock data). Esto permite testear todas las funcionalidades principales.

## Credenciales de Prueba

Para acceder al panel de propietario en modo demo:

```
Email: demo@alquilubres.com
Password: demo123
```

## Funcionalidades Disponibles para Testing

### ✅ Sin Autenticación (Público)

#### 1. Página de Inicio (`/`)
- **Qué testear:**
  - Hero section con mensaje principal
  - Formulario de búsqueda inline
  - Sección de características (ventajas competitivas)
  - CTA de registro
  - Responsive design (mobile/tablet/desktop)

#### 2. Búsqueda de Propiedades (`/buscar`)
- **Qué testear:**
  - Carga de propiedades mock (4 propiedades disponibles)
  - Filtros básicos: ciudad, fechas, huéspedes
  - Filtros avanzados (toggle):
    - Tipo de propiedad
    - **Tipo de parrilla** (característica diferenciadora)
    - **Tamaño de estacionamiento** (característica diferenciadora)
    - Rango de precio
  - Contador de resultados
  - Cards de propiedades con:
    - Imagen principal
    - Título, ubicación, precio
    - Capacidad (huéspedes, habitaciones, baños)
    - Rating y número de reseñas
    - Link a detalle

#### 3. Detalle de Propiedad (`/propiedad/1`)
- **Qué testear:**
  - Galería de imágenes
  - Información completa de la propiedad
  - Características destacadas (localFeatures)
  - Lista de amenidades
  - Calculadora de precio transparente
  - Formulario de contacto
  - Reseñas de huéspedes
  - Botón de contacto

### ✅ Con Autenticación (Propietario)

#### 4. Login (`/login`)
- **Qué testear:**
  - Formulario de login con validación
  - Mensaje de error si credenciales incorrectas
  - Redirección al panel tras login exitoso
  - Link a registro

#### 5. Dashboard del Propietario (`/panel`)
- **Qué testear:**
  - Tarjetas de estadísticas (propiedades, mensajes, vistas, ganancia estimada)
  - Gráfico de ingresos mensuales
  - Propiedades recientes (primeras 3)
  - Mensajes no leídos (primeros 3)
  - Navegación a secciones completas

#### 6. Mis Propiedades (`/panel/propiedades`)
- **Qué testear:**
  - Listado de 3 propiedades mock del usuario
  - Botón "Agregar Nueva Propiedad"
  - Cards con información resumida
  - Estados: Activa/Inactiva
  - Botones: Ver, Editar, Eliminar
  - Filtros por estado

#### 7. Editor de Propiedades (`/panel/propiedades/nueva` o `/panel/propiedades/editar/:id`)
- **Qué testear:**
  - Formulario completo con todas las secciones:
    - **Información Básica:** título, descripción, tipo
    - **Ubicación:** ciudad, estado, país
    - **Capacidad:** huéspedes, habitaciones, camas, baños
    - **Precios:** precio base, tarifa de limpieza
    - **CARACTERÍSTICAS LOCALES** (sección destacada):
      - Tipo de parrilla
      - Tamaño de estacionamiento
      - Atracciones cercanas
      - Distancia al centro
    - **Amenidades:** checklist múltiple
    - **Imágenes:** placeholder (pendiente integración)
  - Validación de campos requeridos
  - Botones: Guardar, Cancelar
  - Modo crear vs modo editar

#### 8. Mensajes (`/panel/mensajes`)
- **Qué testear:**
  - Listado de 3 mensajes mock
  - Estados: No leído / Leído
  - Información del mensaje:
    - Nombre del huésped
    - Propiedad consultada
    - Fechas de check-in/check-out
    - Número de huéspedes
    - Mensaje completo
  - Plantillas de respuesta rápida
  - Formulario de respuesta
  - Filtros por estado (Todos/No leídos)

#### 9. Suscripción (`/panel/suscripcion`)
- **Qué testear:**
  - Estado actual de suscripción
  - Planes disponibles (Básico, Pro, Premium)
  - **Calculadora de ahorro vs comisión:**
    - Input de reservas mensuales
    - Input de precio promedio
    - Comparación automática:
      - Costo con Airbnb (15% comisión)
      - Costo con Booking (18% comisión)
      - Costo con Alquí Libres (suscripción fija)
    - **Ahorro anual destacado**
  - Características de cada plan
  - Botones CTA por plan

## Datos de Prueba Disponibles

### Propiedades Mock
1. **Casa Familiar con Parrilla y Pileta** - Villa Carlos Paz
2. **Departamento Céntrico con Vista al Mar** - Mar del Plata
3. **Cabaña Rústica en las Sierras** - Mina Clavero
4. **Loft Moderno en Palermo** - Buenos Aires

### Mensajes Mock
- 3 mensajes de consulta de diferentes huéspedes
- Diferentes estados (leído/no leído)
- Fechas futuras para testing

### Reseñas Mock
- 4+ reseñas con ratings 5/5
- Comentarios verificados
- Diferentes fechas

## Checklist de Testing

### Frontend General
- [ ] Diseño responsive (mobile, tablet, desktop)
- [ ] Navegación entre páginas
- [ ] Header y Footer en todas las vistas
- [ ] Estados de carga (loading spinners)
- [ ] Mensajes de error apropiados
- [ ] Transiciones y animaciones suaves
- [ ] Accesibilidad (contraste, tamaño de fuente)

### Funcionalidad Core
- [ ] **Búsqueda con filtros hiper-locales** (tipo parrilla, tamaño parking)
- [ ] **Calculadora de precio transparente**
- [ ] **Comparador de costos** (suscripción vs comisión)
- [ ] CRUD de propiedades
- [ ] Sistema de mensajes
- [ ] Autenticación y protección de rutas

### UX/UI
- [ ] Jerarquía visual clara
- [ ] CTAs destacados
- [ ] Formularios intuitivos
- [ ] Feedback visual de acciones
- [ ] Consistencia de estilos
- [ ] Uso efectivo del color primario (#2563eb)

### Ventajas Competitivas Visibles
- [ ] **Filtros hiper-locales** destacados en búsqueda
- [ ] **Calculadora de ahorro** en página de suscripción
- [ ] Pricing transparente en detalle de propiedad
- [ ] Mensaje claro de "sin comisiones"

## Problemas Conocidos / Pendientes

### ⏳ Por Implementar
- [ ] Subida real de imágenes a Firebase Storage
- [ ] Integración con pasarela de pago (Stripe/MercadoPago)
- [ ] Mensajería en tiempo real con Firestore onSnapshot
- [ ] Sincronización con calendarios externos (iCal)
- [ ] Sistema completo de reseñas con CRUD

### 🐛 Bugs a Verificar
- [ ] Validación exhaustiva de formularios
- [ ] Manejo de edge cases en filtros
- [ ] Performance con grandes cantidades de datos
- [ ] Compatibilidad cross-browser

## Siguiente Paso: Configuración Real

Cuando estés listo para conectar Firebase:

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Copiar credenciales al archivo `.env`
3. Habilitar Authentication (Email/Password)
4. Crear base de datos Firestore
5. Configurar Firebase Storage
6. Aplicar las reglas de seguridad (`firestore.rules.json`, `storage.rules`)

## Comando para Testing

```bash
npm run dev
```

Abre: http://localhost:5173

---

**Nota:** El modo mock está diseñado para permitir testing completo de UI/UX y flujos de usuario sin dependencias de backend. Los datos se resetean al recargar la página.
