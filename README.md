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
- **Autenticación JWT nativa** - Tokens firmados en el servidor, sin dependencias de terceros
- **API serverless en Vercel** - Handlers Node.js bajo `api-handlers/`
- **PostgreSQL + Prisma** - Base de datos relacional con ORM tipado
- **Vercel Blob** - Almacenamiento de imágenes con `POST /api/upload`

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
  │   │   └── mercadopago.js        # Configuración de MercadoPago
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

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completá los valores reales:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
BLOB_READ_WRITE_TOKEN=your_blob_read_write_token
VITE_PAYMENT_PUBLIC_KEY=your_payment_public_key
JWT_SECRET=un_secreto_largo_y_aleatorio_para_firmar_tokens
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

## 🗄️ Estructura de Base de Datos (PostgreSQL / Prisma)

El esquema relacional se define en `prisma/schema.prisma`. Las tablas principales son:

- **User** - Cuentas, roles (`owner`, `guest`, `admin`), contraseñas hasheadas y estado
- **Property** - Propiedades publicadas, ubicación, precios, reglas y características locales
- **Reservation** - Reservas solicitadas con fechas y estado
- **Message** - Mensajes entre huéspedes y propietarios
- **Review** - Reseñas verificadas y calificaciones
- **Subscription / SubscriptionPlan** - Planes de suscripción y pagos
- **Payment / Notification** - Pagos y notificaciones del sistema

Las migraciones se manejan con Prisma:

```powershell
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

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

- Autenticación con JWT firmado en el servidor (`JWT_SECRET`)
- Contraseñas hasheadas con bcrypt
- Validación de datos en cliente y servidor
- Protección de rutas privadas por rol
- Subida de imágenes restringida a tipos de imagen y 5MB máximo

## 💳 Integración de Pagos

La plataforma está preparada para integrar pasarelas de pago para gestionar suscripciones:

- Stripe
- MercadoPago
- PayPal
- Otras pasarelas locales

La integración se configura mediante la variable `VITE_PAYMENT_PUBLIC_KEY` en el archivo `.env`

## 🚀 Despliegue

### Opciones de Hosting

1. **Vercel** (Recomendado)
```powershell
npm run build
vercel deploy
```

2. **Netlify**
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
