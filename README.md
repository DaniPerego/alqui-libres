# AlquiLibres - Plataforma Hiper-Local de Alquileres Temporarios

## 🎯 Descripción del Proyecto

AlquiLibres es una plataforma de alquileres temporarios que compite en nichos hiper-locales con una **ventaja competitiva única**: modelo de suscripción fija para propietarios, eliminando las comisiones por reserva (15-25%) que cobran gigantes como Airbnb y Booking.

## 🚀 Características Principales

### Para Propietarios (Locatarios)
- ✅ **Suscripción Fija** - Sin comisiones por reserva
- ✅ **Editor de Anuncios Simplificado** - Más fácil que las plataformas globales
- ✅ **Filtros Hiper-Locales** - Datos específicos que los gigantes no tienen
- ✅ **Calendario Sincronizado** - Compatible con iCal
- ✅ **Sistema de Mensajería** - Con plantillas de respuesta rápida
- ✅ **Panel de Control Intuitivo** - Gestión total de propiedades

### Para Huéspedes
- ✅ **Búsqueda Rápida y Relevante** - Motor optimizado para búsquedas locales
- ✅ **Filtros Hiper-Locales** - Tipo de parrilla, tamaño de cochera, cercanía a atracciones
- ✅ **Transparencia Total** - Precio final sin cargos ocultos
- ✅ **Sistema de Confianza** - Reseñas verificadas
- ✅ **Fotos de Alta Calidad** - Display optimizado

## 🛠️ Stack Tecnológico

### Frontend
- **Vue.js 3** - Framework reactivo y liviano
- **Vue Router** - Navegación SPA
- **Pinia** - State management
- **Vite** - Build tool ultra-rápido

### Backend
- **Firebase Authentication** - Sistema de autenticación
- **Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de imágenes

### Estilo
- **CSS Variables** - Sistema de diseño personalizado
- **Mobile-First** - Diseño responsive

## 📁 Estructura del Proyecto

```
alqui-libres/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Estilos globales y utilidades
│   ├── components/
│   │   └── layout/
│   │       ├── AppHeader.vue     # Header con navegación
│   │       └── AppFooter.vue     # Footer
│   ├── config/
│   │   ├── firebase.js           # Configuración de Firebase
│   │   └── firestore-structure.js # Documentación de colecciones
│   ├── router/
│   │   └── index.js              # Rutas de la aplicación
│   ├── stores/
│   │   ├── auth.js               # Estado de autenticación
│   │   ├── property.js           # Gestión de propiedades
│   │   └── search.js             # Motor de búsqueda
│   ├── views/
│   │   ├── auth/
│   │   │   ├── Login.vue         # Vista de login
│   │   │   └── Register.vue      # Vista de registro
│   │   ├── owner/
│   │   │   ├── Dashboard.vue     # Layout del panel
│   │   │   ├── MyProperties.vue  # Lista de propiedades
│   │   │   ├── PropertyEditor.vue # Editor de propiedades
│   │   │   ├── Messages.vue      # Bandeja de mensajes
│   │   │   └── Subscription.vue  # Gestión de suscripción
│   │   ├── Home.vue              # Página de inicio
│   │   ├── Search.vue            # Búsqueda de propiedades
│   │   └── PropertyDetail.vue    # Detalle de propiedad
│   ├── App.vue                   # Componente raíz
│   └── main.js                   # Punto de entrada
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## 🔧 Instalación y Configuración

### 1. Instalar Dependencias

```powershell
npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Habilita Storage para imágenes
5. Copia las credenciales de configuración

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_PAYMENT_PUBLIC_KEY=tu_clave_de_pago
```

### 4. Iniciar el Servidor de Desarrollo

```powershell
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 5. Compilar para Producción

```powershell
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## 🗄️ Estructura de Base de Datos (Firestore)

### Colecciones Privadas (Propietarios)

```
/artifacts/{appId}/users/{userId}/properties/{propertyId}
```
- Información completa de la propiedad
- Datos privados (dirección completa, reglas internas)
- Calendario de disponibilidad
- Configuración de precios

```
/artifacts/{appId}/users/{userId}/messages/{messageId}
```
- Mensajes de huéspedes
- Estado (leído/no leído)
- Información de la reserva solicitada

```
/artifacts/{appId}/users/{userId}/subscription
```
- Plan de suscripción activo
- Estado de pago
- Fecha de renovación

### Colecciones Públicas (Búsquedas)

```
/artifacts/{appId}/public/data/listings/{listingId}
```
- Información pública de propiedades
- Optimizada para búsquedas rápidas
- Sin datos sensibles

```
/artifacts/{appId}/public/data/reviews/{reviewId}
```
- Reseñas verificadas
- Calificaciones de huéspedes

## 🎨 Características de Diseño

### Sistema de Colores
- **Primary**: Azul (#2563eb) - Confianza y profesionalismo
- **Secondary**: Verde (#10b981) - Éxito y ahorro
- **Danger**: Rojo (#ef4444) - Alertas
- **Warning**: Amarillo (#f59e0b) - Destacados

### Componentes Reutilizables
- Botones (primary, secondary, success, danger)
- Inputs y formularios
- Cards con sombras
- Grid responsive
- Sistema de toast para notificaciones

### Responsive
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Grid adaptativo

## 🔐 Seguridad

- Autenticación con Firebase Auth
- Reglas de seguridad en Firestore
- Validación de datos en cliente y servidor
- Protección de rutas privadas

## 💳 Integración de Pagos

La plataforma está preparada para integrar pasarelas de pago para gestionar suscripciones:

- Stripe
- MercadoPago
- PayPal
- Otras pasarelas locales

La integración se configura mediante la variable `VITE_PAYMENT_PUBLIC_KEY` en el archivo `.env`

## 🚀 Despliegue

### Opciones de Hosting

1. **Firebase Hosting** (Recomendado)
```powershell
npm run build
firebase deploy
```

2. **Vercel**
```powershell
npm run build
vercel deploy
```

3. **Netlify**
```powershell
npm run build
netlify deploy
```

## 📊 Ventaja Competitiva

### Comparación de Costos

| Aspecto | Airbnb/Booking | AlquiLibres |
|---------|----------------|-------------|
| Comisión por reserva | 15-25% | 0% |
| Costo mensual | $0 | $49 |
| 10 reservas x $100 | $150-$250 | $49 |
| **Ahorro** | - | **$101-$201** |

### Características Únicas

1. **Filtros Hiper-Locales**
   - Tipo de parrilla (carbón, gas, eléctrica)
   - Tamaño de cochera
   - Distancia a atracciones locales
   - Características específicas de la zona

2. **Transparencia Total**
   - Precio final visible desde el inicio
   - Sin tasas ocultas
   - Desglose claro de costos

3. **Simplicidad**
   - Editor más simple que los gigantes
   - Panel de control intuitivo
   - Menos pasos para publicar

## 🔄 Próximas Funcionalidades

- [ ] Sistema de mensajería en tiempo real
- [ ] Integración completa de calendario iCal
- [ ] Subida de múltiples imágenes con optimización
- [ ] Sistema de reseñas verificadas
- [ ] Integración de mapas interactivos
- [ ] Dashboard de analytics para propietarios
- [ ] App móvil nativa
- [ ] Sistema de respuestas automáticas
- [ ] Multi-idioma
- [ ] Notificaciones push

## 📝 Licencia

Este proyecto es parte de un sistema propietario. Todos los derechos reservados.

## 👥 Contribución

Para contribuir al proyecto:

1. Clona el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@alquilubres.com
- Documentación: [docs.alquilubres.com]

---

**AlquiLibres** - Alquileres Sin Comisiones 🏠
