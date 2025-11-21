# Estructura de Firestore - AlquiLibres

Este documento describe la estructura de colecciones y documentos en Firestore para la plataforma AlquiLibres.

## 📋 Índice de Colecciones

1. [users](#users) - Usuarios de la plataforma
2. [properties](#properties) - Propiedades publicadas
3. [reservations](#reservations) - Reservas de propiedades
4. [messages](#messages) - Mensajes entre usuarios
5. [reviews](#reviews) - Reseñas de propiedades
6. [subscriptions](#subscriptions) - Suscripciones de usuarios
7. [subscriptionPlans](#subscriptionplans) - Planes de suscripción
8. [platformSettings](#platformsettings) - Configuración general
9. [payments](#payments) - Historial de pagos
10. [notifications](#notifications) - Notificaciones del sistema

---

## Collections

### `users`
Información de los usuarios registrados en la plataforma.

**Documento ID**: `{userId}` (Firebase Auth UID)

```javascript
{
  // Información básica
  email: string,                    // Email del usuario
  displayName: string,              // Nombre completo
  photoURL: string | null,          // URL foto de perfil
  role: 'owner' | 'admin' | 'guest', // Rol del usuario
  isActive: boolean,                // Estado activo/suspendido
  emailVerified: boolean,           // Email verificado
  
  // Perfil extendido (para propietarios)
  city: string | null,              // Ciudad de residencia
  bio: string | null,               // Biografía/descripción
  
  // Contacto principal
  contactoPrincipal: {
    telefono: string,               // Teléfono principal
    whatsapp: string,               // WhatsApp (puede ser igual al teléfono)
    email: string                   // Email de contacto
  },
  
  // Contacto secundario (opcional)
  contactoSecundario: {
    enabled: boolean,               // Si está habilitado
    descripcion: string,            // Ej: "Administración", "Emergencias"
    telefono: string,
    whatsapp: string,
    email: string
  },
  
  // Redes sociales
  redesSociales: {
    instagram: string | null,
    facebook: string | null,
    linkedin: string | null,
    website: string | null
  },
  
  // Suscripción actual (para propietarios)
  subscription: {
    planId: string,                 // ID del plan (basic, pro, enterprise)
    status: 'active' | 'cancelled' | 'expired',
    startedAt: string,              // ISO timestamp
    expiresAt: string,              // ISO timestamp
    autoRenew: boolean,
    lastPaymentDate: string         // ISO timestamp
  } | null,
  
  // Estadísticas
  stats: {
    properties: number,             // Total propiedades publicadas
    bookings: number,               // Total reservas recibidas
    revenue: number                 // Ingresos totales generados
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `role` ASC
- `isActive` ASC + `createdAt` DESC
- `subscription.status` ASC + `subscription.expiresAt` ASC

---

### `properties`
Propiedades publicadas por los propietarios.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Propietario
  ownerId: string,                  // UID del propietario
  ownerName: string,                // Nombre del propietario
  ownerEmail: string,               // Email del propietario
  
  // Información básica
  title: string,                    // Título de la propiedad
  description: string,              // Descripción completa
  propertyType: 'casa' | 'departamento' | 'cabaña' | 'habitacion' | 'otro',
  
  // Ubicación
  location: {
    address: string,                // Dirección completa
    city: string,                   // Ciudad
    state: string,                  // Provincia
    country: string,                // País (default: Argentina)
    postalCode: string,
    coordinates: {                  // Opcional: coordenadas GPS
      lat: number,
      lng: number
    }
  },
  
  // Capacidad
  capacity: {
    guests: number,                 // Huéspedes máximos
    bedrooms: number,               // Cantidad de habitaciones
    beds: number,                   // Cantidad de camas
    bathrooms: number               // Cantidad de baños
  },
  
  // Características locales destacadas
  localFeatures: {
    grillType: 'carbon' | 'gas' | 'electrica' | null,
    parkingSize: 'chica' | 'mediana' | 'grande' | null,
    distanceToCenter: number | null // km al centro
  },
  
  // Amenidades
  amenities: [                      // Array de strings
    'WiFi',
    'TV',
    'Cocina completa',
    'Aire Acondicionado',
    'Calefacción',
    'Parrilla',
    'Estacionamiento',
    'Piscina',
    'Jardín',
    // ... más amenidades
  ],
  
  // Precios
  pricing: {
    basePrice: number,              // Precio base por noche (ARS)
    cleaningFee: number,            // Tarifa de limpieza (ARS)
    currency: string,               // Default: 'ARS'
    weeklyDiscount: number,         // Descuento semanal (%)
    monthlyDiscount: number         // Descuento mensual (%)
  },
  
  // Imágenes
  images: [string],                 // Array de URLs
  
  // Disponibilidad
  availability: {
    minNights: number,              // Mínimo de noches
    maxNights: number,              // Máximo de noches
    checkInTime: string,            // Ej: "14:00"
    checkOutTime: string,           // Ej: "10:00"
    instantBooking: boolean         // Reserva instantánea
  },
  
  // Reglas de la casa
  houseRules: {
    smokingAllowed: boolean,
    petsAllowed: boolean,
    eventsAllowed: boolean,
    childrenAllowed: boolean,
    additionalRules: string         // Reglas adicionales en texto
  },
  
  // Estadísticas
  rating: number,                   // Calificación promedio (0-5)
  reviewCount: number,              // Cantidad de reseñas
  viewCount: number,                // Vistas totales
  bookingCount: number,             // Reservas totales
  
  // Estado
  status: 'pending' | 'active' | 'inactive' | 'rejected',
  isActive: boolean,                // Si está publicada
  featured: boolean,                // Destacada (para planes premium)
  
  // Moderación (admin)
  reviewedAt: Timestamp | null,
  reviewedBy: string | null,        // UID del admin que revisó
  rejectionReason: string | null,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `ownerId` ASC + `createdAt` DESC
- `status` ASC + `createdAt` DESC
- `isActive` ASC + `location.city` ASC + `createdAt` DESC
- `location.city` ASC + `propertyType` ASC + `pricing.basePrice` ASC

---

### `reservations`
Solicitudes y reservas de propiedades.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // IDs relacionados
  propertyId: string,               // ID de la propiedad
  ownerId: string,                  // UID del propietario
  guestId: string,                  // UID del huésped
  
  // Datos de la propiedad (snapshot)
  property: {
    id: string,
    title: string,
    city: string,
    image: string                   // URL primera imagen
  },
  
  // Datos del huésped
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  
  // Datos del propietario (para notificaciones)
  ownerName: string,
  ownerEmail: string,
  ownerPhone: string,
  
  // Fechas y detalles
  checkIn: string,                  // Fecha formato YYYY-MM-DD
  checkOut: string,                 // Fecha formato YYYY-MM-DD
  nights: number,                   // Cantidad de noches
  guests: number,                   // Cantidad de huéspedes
  
  // Precios
  basePrice: number,                // Precio por noche
  cleaningFee: number,              // Tarifa limpieza
  total: number,                    // Total a pagar
  
  // Mensaje del huésped
  message: string,                  // Mensaje/consulta inicial
  
  // Estado
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled',
  
  // Detalles de estado
  confirmedAt: Timestamp | null,
  rejectedAt: Timestamp | null,
  rejectionReason: string | null,
  cancelledAt: Timestamp | null,
  cancelledBy: 'owner' | 'guest' | null,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `ownerId` ASC + `status` ASC + `createdAt` DESC
- `guestId` ASC + `createdAt` DESC
- `propertyId` ASC + `status` ASC + `checkIn` ASC

---

### `messages`
Mensajes entre propietarios y huéspedes.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Participantes
  ownerId: string,                  // UID del propietario
  guestId: string,                  // UID del huésped
  propertyId: string,               // ID de la propiedad
  
  // Contenido
  propertyTitle: string,
  guestName: string,
  guestEmail: string,
  message: string,
  
  // Detalles de consulta
  checkIn: string,                  // Fecha deseada
  checkOut: string,
  guests: number,
  
  // Estado
  status: 'unread' | 'read' | 'replied',
  read: boolean,
  
  // Timestamps
  createdAt: Timestamp,
  readAt: Timestamp | null,
  repliedAt: Timestamp | null
}
```

**Índices recomendados:**
- `ownerId` ASC + `read` ASC + `createdAt` DESC
- `guestId` ASC + `createdAt` DESC

---

### `reviews`
Reseñas de propiedades por huéspedes.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Relaciones
  propertyId: string,
  ownerId: string,
  guestId: string,
  reservationId: string,            // ID de la reserva asociada
  
  // Contenido
  guestName: string,
  rating: number,                   // 1-5 estrellas
  comment: string,                  // Texto de la reseña
  
  // Aspectos específicos (opcional)
  ratings: {
    cleanliness: number,            // 1-5
    communication: number,          // 1-5
    location: number,               // 1-5
    value: number                   // 1-5
  },
  
  // Respuesta del propietario (opcional)
  ownerResponse: string | null,
  ownerRespondedAt: Timestamp | null,
  
  // Estado
  verified: boolean,                // Si el huésped completó la reserva
  visible: boolean,                 // Si está visible públicamente
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `propertyId` ASC + `visible` ASC + `createdAt` DESC
- `guestId` ASC + `createdAt` DESC

---

### `subscriptions`
Registro de suscripciones y cambios de plan.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Usuario
  userId: string,                   // UID del usuario
  userEmail: string,
  
  // Plan
  planId: string,                   // basic, pro, enterprise
  planName: string,
  planPrice: number,
  
  // Estado
  status: 'active' | 'cancelled' | 'expired' | 'pending',
  
  // Fechas
  startedAt: Timestamp,
  expiresAt: Timestamp,
  cancelledAt: Timestamp | null,
  
  // Renovación
  autoRenew: boolean,
  
  // Pago
  paymentMethod: 'mercadopago' | 'stripe' | 'manual',
  lastPaymentDate: Timestamp,
  nextPaymentDate: Timestamp,
  
  // MercadoPago
  preferenceId: string | null,
  paymentId: string | null,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `userId` ASC + `status` ASC
- `status` ASC + `expiresAt` ASC

---

### `subscriptionPlans`
Planes de suscripción configurables por admin.

**Documento ID**: `basic`, `pro`, `enterprise` (IDs fijos)

```javascript
{
  id: string,                       // basic, pro, enterprise
  name: string,                     // "Plan Básico", "Plan Profesional"
  price: number,                    // Precio mensual en ARS
  currency: string,                 // "ARS"
  interval: string,                 // "month"
  
  // Características
  features: [string],               // Array de características
  maxProperties: number,            // -1 para ilimitadas
  
  // Estado
  isActive: boolean,                // Si está disponible para nuevas suscripciones
  recommended: boolean,             // Si se muestra como recomendado
  
  // Orden de visualización (opcional)
  order: number
}
```

**Ejemplo:**
```javascript
{
  id: 'pro',
  name: 'Plan Profesional',
  price: 24999,
  currency: 'ARS',
  interval: 'month',
  features: [
    'Hasta 10 propiedades activas',
    'Sin comisión por reserva',
    'Soporte prioritario 24/7',
    'Panel de gestión avanzado',
    'Estadísticas detalladas',
    'Destacado en búsquedas'
  ],
  maxProperties: 10,
  isActive: true,
  recommended: true
}
```

---

### `platformSettings`
Configuración general de la plataforma (documento único).

**Documento ID**: `general` (único documento)

```javascript
{
  // Información de la plataforma
  platformName: string,             // "AlquiLibres"
  contactEmail: string,             // Email de contacto general
  supportPhone: string,             // Teléfono de soporte
  
  // Comisiones y tarifas
  commissionRate: number,           // Comisión por reserva (%) - Actualmente 0
  
  // Notificaciones
  emailNotifications: boolean,      // Si están habilitadas globalmente
  whatsappNotifications: boolean,   // Si están habilitadas globalmente
  
  // Seguridad
  requireEmailVerification: boolean, // Requerir verificación de email
  moderateProperties: boolean,      // Moderar propiedades antes de publicar
  
  // Última actualización
  updatedAt: Timestamp,
  updatedBy: string                 // UID del admin que actualizó
}
```

**Nota:** Este es el único documento en la colección. Se accede directamente con el ID `general`.

---

### `payments`
Historial de pagos y transacciones.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Usuario
  userId: string,
  userEmail: string,
  
  // Suscripción
  subscriptionId: string,
  planId: string,
  planName: string,
  
  // Monto
  amount: number,
  currency: string,
  
  // Método de pago
  paymentMethod: 'mercadopago' | 'stripe' | 'manual',
  
  // MercadoPago
  preferenceId: string | null,
  paymentId: string | null,
  externalReference: string | null,
  
  // Estado
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded',
  
  // Detalles
  statusDetail: string,             // Detalle del estado
  
  // Timestamps
  paidAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Índices recomendados:**
- `userId` ASC + `createdAt` DESC
- `status` ASC + `createdAt` DESC

---

### `notifications`
Notificaciones del sistema para usuarios.

**Documento ID**: Auto-generado por Firestore

```javascript
{
  // Destinatario
  userId: string,
  
  // Tipo
  type: 'reservation' | 'message' | 'payment' | 'property' | 'system',
  
  // Contenido
  title: string,
  body: string,
  
  // Datos adicionales (opcional)
  data: {
    propertyId: string | null,
    reservationId: string | null,
    messageId: string | null,
    actionUrl: string | null        // URL para redireccionar
  },
  
  // Estado
  read: boolean,
  readAt: Timestamp | null,
  
  // Prioridad
  priority: 'low' | 'normal' | 'high',
  
  // Timestamps
  createdAt: Timestamp,
  expiresAt: Timestamp | null       // Opcional: fecha de expiración
}
```

**Índices recomendados:**
- `userId` ASC + `read` ASC + `createdAt` DESC
- `userId` ASC + `type` ASC + `createdAt` DESC

---

## 🔐 Security Rules Principales

```javascript
// Usuarios: solo lectura del propio perfil y escritura limitada
match /users/{userId} {
  allow read: if request.auth.uid == userId || 
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow update: if request.auth.uid == userId && 
                   (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isActive']));
}

// Propiedades: el propietario puede CRUD sus propias propiedades
match /properties/{propertyId} {
  allow read: if resource.data.isActive == true || 
                 resource.data.ownerId == request.auth.uid ||
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow create: if request.auth.uid != null && 
                   request.resource.data.ownerId == request.auth.uid;
  allow update: if resource.data.ownerId == request.auth.uid ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow delete: if resource.data.ownerId == request.auth.uid ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Reservas: solo propietario y huésped pueden leer
match /reservations/{reservationId} {
  allow read: if resource.data.ownerId == request.auth.uid || 
                 resource.data.guestId == request.auth.uid;
  allow create: if request.auth.uid != null && 
                   request.resource.data.guestId == request.auth.uid;
  allow update: if resource.data.ownerId == request.auth.uid;
}

// Planes: solo admin puede escribir, todos pueden leer planes activos
match /subscriptionPlans/{planId} {
  allow read: if resource.data.isActive == true ||
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Settings: solo admin puede leer/escribir
match /platformSettings/{settingId} {
  allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 📊 Índices Compuestos Requeridos

```json
{
  "indexes": [
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "guestId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🚀 Inicialización y Seeds

### Planes de Suscripción (Auto-seed)
El store automáticamente crea estos documentos si la colección está vacía:

```javascript
// subscriptionPlans/basic
{
  id: 'basic',
  name: 'Plan Básico',
  price: 14999,
  features: ['Hasta 3 propiedades activas', 'Sin comisión por reserva', ...],
  maxProperties: 3,
  isActive: true
}

// subscriptionPlans/pro
{
  id: 'pro',
  name: 'Plan Profesional',
  price: 24999,
  features: ['Hasta 10 propiedades activas', ...],
  maxProperties: 10,
  isActive: true,
  recommended: true
}

// subscriptionPlans/enterprise
{
  id: 'enterprise',
  name: 'Plan Empresarial',
  price: 49999,
  features: ['Propiedades ilimitadas', ...],
  maxProperties: -1,
  isActive: true
}
```

### Settings de Plataforma (Auto-seed)
```javascript
// platformSettings/general
{
  platformName: 'AlquiLibres',
  contactEmail: 'info@alquilibres.com',
  supportPhone: '+54 9 11 1234-5678',
  commissionRate: 0,
  emailNotifications: true,
  whatsappNotifications: true,
  requireEmailVerification: false,
  moderateProperties: false
}
```

---

## 📝 Notas de Implementación

### Modo Demo vs Producción
- **Sin Firebase configurado**: Los stores usan localStorage como fallback
- **Con Firebase**: Sincronización en tiempo real con `onSnapshot`
- Cache local automático para modo offline

### Sincronización en Tiempo Real
Las siguientes colecciones tienen listeners activos:
- `subscriptionPlans` → `adminStore.subscriptionPlans`
- `platformSettings/general` → `adminStore.platformSettings`

### Migración de Datos
Si ya tienes datos en localStorage:
1. Configurar Firebase
2. Al inicializar, los stores intentarán migrar automáticamente
3. Los datos se sembrarán en Firestore si las colecciones están vacías

---

## 🔄 Versionado del Schema

**Versión actual**: 1.0  
**Última actualización**: 12 de noviembre de 2025

### Cambios pendientes (v1.1)
- [ ] Agregar campo `tags` a properties para búsqueda mejorada
- [ ] Implementar colección `analytics` para métricas
- [ ] Agregar `chatRooms` para mensajería en tiempo real

---

## 📞 Soporte

Para dudas sobre el schema o implementación:
- Revisar código en `src/stores/admin.js`
- Ver reglas de seguridad en `firestore.rules`
- Consultar índices en `firestore.indexes.json`
