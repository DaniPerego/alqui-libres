# 📋 Lista de Pendientes - Alquí Libres

## 🚀 Prioridad Alta (Pre-lanzamiento)

### 1. Panel de Administrador General
- [ ] Crear store de admin (`stores/admin.js`)
- [ ] Vista de dashboard administrativo
- [ ] Gestión de planes de suscripción (crear, editar, precios)
- [ ] Control de pagos y membresías activas
- [ ] Panel de usuarios registrados
- [ ] Estadísticas globales de la plataforma
- [ ] Moderación de propiedades (aprobar/rechazar)
- [ ] Sistema de roles y permisos

### 2. SEO y Posicionamiento Web
- [ ] Meta tags optimizados en `index.html` (Open Graph, Twitter Cards)
- [ ] Schema.org markup para propiedades (JSON-LD)
- [ ] Sitemap.xml dinámico
- [ ] robots.txt configurado
- [ ] Meta descriptions únicas por página
- [ ] Títulos SEO dinámicos (Vue Router meta)
- [ ] Implementar lazy loading de imágenes
- [ ] Optimizar Core Web Vitals
- [ ] Añadir canonical URLs
- [ ] Integrar Google Analytics / Search Console

### 3. Modelo de Contrato Legal
- [ ] Crear vista `/terminos-y-condiciones`
- [ ] Template de contrato de suscripción
- [ ] Términos de uso del servicio
- [ ] Política de privacidad (GDPR compliant)
- [ ] Políticas de cancelación y reembolsos
- [ ] Acuerdo de responsabilidades locador/locatario
- [ ] Checkbox de aceptación en registro
- [ ] Generación de PDF del contrato
- [ ] Sistema de firma digital (opcional)

### 4. Completar Footer y Links Legales
- [ ] Página "Sobre Nosotros" (`/nosotros`)
- [ ] Página "Cómo Funciona" (`/como-funciona`)
- [ ] Página "Preguntas Frecuentes" (FAQ) (`/faq`)
- [ ] Página "Contacto" (`/contacto`)
- [ ] Blog o Centro de Ayuda (`/ayuda`)
- [ ] Términos de Servicio (`/terminos`)
- [ ] Política de Privacidad (`/privacidad`)
- [ ] Política de Cookies (`/cookies`)
- [ ] Redes sociales (links reales)

---

## 🔧 Mejoras Técnicas Críticas

### 5. Sistema de Pagos Real
- [ ] Integrar Stripe o MercadoPago
- [ ] Flujo de checkout de suscripción
- [ ] Webhooks para confirmación de pago
- [ ] Panel de facturación para propietarios
- [ ] Gestión de métodos de pago
- [ ] Renovación automática de suscripciones
- [ ] Sistema de cupones/descuentos

### 6. Configuración de Firebase
- [ ] Crear proyecto en Firebase Console
- [ ] Configurar Firestore Database
- [ ] Configurar Firebase Storage (imágenes)
- [ ] Configurar Firebase Authentication
- [ ] Implementar Security Rules
- [ ] Actualizar `.env` con credenciales reales
- [ ] Migrar datos mock a Firestore

### 7. Sistema de Imágenes Real
- [ ] Subir imágenes a Firebase Storage
- [ ] Generar URLs públicas persistentes
- [ ] Optimización de imágenes (compresión)
- [ ] Thumbnails automáticos
- [ ] Watermark en imágenes (opcional)
- [ ] Límite de imágenes por propiedad

### 8. Sistema de Mensajería en Tiempo Real
- [ ] Implementar chat con Firestore onSnapshot
- [ ] Notificaciones de nuevos mensajes
- [ ] Indicador de mensajes no leídos
- [ ] Historial de conversaciones
- [ ] Upload de archivos en chat
- [ ] Notificaciones push (opcional)

### 9. Sistema de Reservas Completo
- [ ] Calendario de disponibilidad real
- [ ] Bloqueo de fechas reservadas
- [ ] Sincronización con iCal (Airbnb/Booking)
- [ ] Flujo de reserva con pago
- [ ] Confirmación de reserva por email
- [ ] Sistema de cancelaciones
- [ ] Gestión de check-in/check-out

### 10. Sistema de Reviews Completo
- [ ] CRUD completo de reviews
- [ ] Solo huéspedes que reservaron pueden opinar
- [ ] Sistema de valoración bidireccional (huésped ↔ anfitrión)
- [ ] Moderación de reviews
- [ ] Respuesta del propietario a reviews
- [ ] Cálculo de rating promedio actualizado

---

---

## 🏠 PANEL DEL PROPIETARIO - PLAN DE IMPLEMENTACIÓN

### ✅ YA IMPLEMENTADO:
- [x] Dashboard layout con sidebar
- [x] Mis Propiedades (listado)
- [x] Editor de Propiedades (crear/editar)
- [x] Sistema de Mensajes
- [x] Gestión de Suscripción
- [x] Checkout y pagos con MercadoPago
- [x] Resultado de pago

### 🥇 FASE 1 - FUNCIONALIDAD BÁSICA (Esta semana):

#### 1. Dashboard/Home del Panel
- [ ] Vista principal con métricas rápidas
- [ ] Resumen de propiedades activas/inactivas
- [ ] Últimos mensajes sin leer
- [ ] Estado de suscripción y días restantes
- [ ] Acciones rápidas (nueva propiedad, ver mensajes)
- [ ] Notificaciones recientes

#### 2. Perfil del Propietario CON Contacto ⭐
- [ ] Editar información personal (nombre, bio, foto)
- [ ] **CONTACTO PRINCIPAL:**
  - Teléfono
  - WhatsApp
  - Email
- [ ] **CONTACTO SECUNDARIO (opcional):**
  - Teléfono secundario
  - WhatsApp secundario
  - Email secundario
  - Descripción del contacto (ej: "Administrador")
- [ ] **REDES SOCIALES:**
  - Instagram
  - Facebook  
  - LinkedIn
  - Website personal
- [ ] Toggle "Mostrar contacto solo a usuarios registrados" ✅
- [ ] Vista previa de perfil público
- [ ] Verificación de WhatsApp (badge)

#### 3. Mostrar Contacto en PropertyDetail
- [ ] Botones de contacto (solo usuarios registrados)
- [ ] Botón WhatsApp con mensaje pre-cargado
- [ ] Botón llamar (tel:)
- [ ] Botón email (mailto:)
- [ ] Íconos redes sociales del propietario
- [ ] Mostrar ambos contactos (principal y secundario)
- [ ] Blur/ocultar info si no está registrado

#### 4. Sistema de Reservas Básico
- [ ] Formulario de solicitud de reserva
- [ ] Calendario de disponibilidad
- [ ] Ver reservas pendientes
- [ ] Aprobar/Rechazar reservas
- [ ] **EMAIL al propietario:**
  - Nueva solicitud de reserva
  - Datos del huésped
  - Botones aprobar/rechazar
- [ ] **WhatsApp al propietario:**
  - Notificación a contacto principal
  - Notificación a contacto secundario
- [ ] **EMAIL al huésped:**
  - Confirmación de reserva
  - Datos de contacto del propietario
  - Instrucciones de check-in
- [ ] **WhatsApp al huésped:**
  - Confirmación con datos del propietario

### 🥈 FASE 2 - ESTADÍSTICAS Y REVIEWS (Semana siguiente):

#### 5. Ingresos y Estadísticas
- [ ] Ganancias totales y por propiedad
- [ ] Gráficos de ocupación
- [ ] Proyección de ingresos mensuales
- [ ] Comparativas mes a mes
- [ ] Exportar reportes PDF/Excel

#### 6. Gestión de Reviews
- [ ] Ver todas las reseñas recibidas
- [ ] Responder a reviews
- [ ] Rating promedio por propiedad
- [ ] Alertas de nuevas reseñas
- [ ] Moderación de respuestas

#### 7. Centro de Notificaciones
- [ ] Panel de notificaciones in-app
- [ ] Nueva reserva
- [ ] Nuevo mensaje
- [ ] Suscripción por vencer
- [ ] Nueva review
- [ ] Cambios en políticas
- [ ] Marcar como leído/no leído

### 🥉 FASE 3 - AVANZADO (Post-lanzamiento):

#### 8. Gestión de Contratos
- [ ] Templates de contratos personalizados
- [ ] Generar contrato por reserva
- [ ] Firmas digitales
- [ ] Historial de contratos

#### 9. Configuraciones Avanzadas
- [ ] Políticas de cancelación por propiedad
- [ ] Reglas de la casa editables
- [ ] Precios automáticos (temporada)
- [ ] Descuentos por estadía larga

#### 10. Chat en Vivo Mejorado
- [ ] Indicador "en línea"
- [ ] Respuestas automáticas
- [ ] Plantillas de mensajes
- [ ] Upload de archivos en chat

---

## 🎨 UX/UI y Experiencia de Usuario

### 11. Onboarding y Tutorial
- [ ] Tour guiado para nuevos usuarios
- [ ] Video explicativo en homepage
- [ ] Tooltips en funciones clave
- [ ] Wizard de publicación de primera propiedad

### 12. Notificaciones
- [ ] Sistema de notificaciones in-app
- [ ] Emails transaccionales (bienvenida, reserva, etc.)
- [ ] Notificaciones de nuevos mensajes
- [ ] Recordatorios de check-in/check-out

### 13. Búsqueda Avanzada
- [ ] Filtro por rango de precios
- [ ] Filtro por fechas específicas
- [ ] Mapa interactivo de resultados
- [ ] Ordenar por: precio, rating, distancia
- [ ] Búsqueda por palabras clave
- [ ] Guardar búsquedas favoritas

### 14. Perfil de Usuario Mejorado
- [ ] Avatar personalizado
- [ ] Biografía del propietario
- [ ] Verificación de identidad
- [ ] Insignias y logros
- [ ] Historial de reservas (como huésped)
- [ ] Propiedades favoritas

---

## 📱 Aplicación Móvil

### 15. PWA (Progressive Web App)
- [ ] Service Worker para offline
- [ ] Manifest.json configurado
- [ ] Instalable en home screen
- [ ] Notificaciones push
- [ ] Caché de datos críticos

---

## 🔒 Seguridad y Performance

### 16. Seguridad
- [ ] Firestore Security Rules estrictas
- [ ] Rate limiting en API
- [ ] Validación server-side de datos
- [ ] Sanitización de inputs
- [ ] Protección CSRF
- [ ] SSL/HTTPS en producción
- [ ] Auditoría de seguridad

### 17. Performance
- [ ] Lazy loading de rutas (ya implementado ✅)
- [ ] Optimización de imágenes
- [ ] Code splitting
- [ ] Caché de datos con Pinia
- [ ] Prefetch de rutas críticas
- [ ] CDN para assets estáticos
- [ ] Monitoring con Sentry o similar

### 18. Testing
- [ ] Tests unitarios (Vitest)
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Tests de componentes
- [ ] CI/CD pipeline

---

## 📊 Analytics y Marketing

### 19. Tracking y Analytics
- [ ] Google Analytics 4
- [ ] Facebook Pixel
- [ ] Hotjar o similar (heatmaps)
- [ ] Conversion tracking
- [ ] A/B testing

### 20. Marketing
- [ ] Landing page optimizada
- [ ] Calculadora ROI más visible
- [ ] Testimonios de usuarios
- [ ] Case studies
- [ ] Email marketing (newsletter)
- [ ] Referral program (invitar amigos)

---

## 🌍 Internacionalización

### 21. Multi-idioma
- [ ] i18n configurado (Español/Inglés/Portugués)
- [ ] Detección automática de idioma
- [ ] Selector de idioma en header
- [ ] Traducción de contenido dinámico

### 22. Multi-moneda
- [ ] Soporte USD, ARS, BRL, EUR
- [ ] Conversión automática
- [ ] Selector de moneda

---

## 🚀 Pre-lanzamiento Final

### 23. Checklist de Lanzamiento
- [ ] Revisión legal completa
- [ ] Testing en múltiples dispositivos
- [ ] Testing en múltiples navegadores
- [ ] Backup y estrategia de recuperación
- [ ] Dominio registrado
- [ ] Hosting configurado (Vercel/Netlify/Firebase)
- [ ] Email corporativo configurado
- [ ] Redes sociales creadas
- [ ] Material de marketing listo
- [ ] Plan de comunicación definido
- [ ] Estrategia de pricing validada
- [ ] Primeros 10-20 usuarios beta invitados

---

## 📝 Notas

**Estado Actual:**
- ✅ Core functionality completa
- ✅ Sistema mock funcionando al 100%
- ✅ UI/UX responsive
- ✅ Ventaja competitiva implementada (filtros hiperlocales + calculadora)

**Próximos Pasos Inmediatos:**
1. Panel Admin (control total plataforma)
2. SEO básico (meta tags, sitemap)
3. Páginas legales (términos, privacidad)
4. Footer completado

**Estimación:**
- Admin Panel: 2-3 días
- SEO + Páginas legales: 1-2 días
- Integración Firebase + Pagos: 3-5 días
- Testing y ajustes: 2-3 días
- **Total estimado: 2-3 semanas para MVP lanzable**

---

**Última actualización:** 7 de noviembre de 2025
