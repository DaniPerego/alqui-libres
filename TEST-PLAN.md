# 📋 Plan de Testing Ejecutivo - Alquí Libres

## Resumen de Estado

✅ **Aplicación lista para testing completo**
- Servidor de desarrollo corriendo en: http://localhost:5173
- Modo mock data activado (sin necesidad de Firebase)
- Banner informativo visible con credenciales de prueba
- 0 errores de compilación

## Inicio Rápido

### 1. Login con Cuenta Demo
```
URL: http://localhost:5173/login
Email: demo@alquilubres.com
Password: demo123
```

### 2. Áreas Principales a Testear

#### 🏠 Área Pública (Sin Login)
1. **Homepage** (`/`)
   - Hero con propuesta de valor
   - Buscador inline
   - Features destacando ventajas competitivas

2. **Búsqueda** (`/buscar`)
   - 4 propiedades mock disponibles
   - Filtros estándar + **filtros hiper-locales**
   - Responsive cards

3. **Detalle** (`/propiedad/1`)
   - Galería, info completa
   - **Calculadora de precio transparente**
   - Formulario de contacto

#### 👤 Panel de Propietario (Con Login)
1. **Dashboard** (`/panel`)
   - Estadísticas overview
   - Gráfico de ingresos
   - Resumen de propiedades y mensajes

2. **Propiedades** (`/panel/propiedades`)
   - CRUD completo
   - 3 propiedades mock del usuario demo

3. **Editor** (`/panel/propiedades/nueva`)
   - Formulario con sección **CARACTERÍSTICAS LOCALES** destacada
   - Validaciones

4. **Mensajes** (`/panel/mensajes`)
   - 3 mensajes mock
   - Plantillas de respuesta rápida

5. **Suscripción** (`/panel/suscripcion`)
   - **Calculadora de ahorro vs comisión** (feature clave)
   - Planes con precios

## Testing por Prioridad

### 🔥 Prioridad Alta - Diferenciadores Competitivos

Estas son las funcionalidades que nos diferencian de Airbnb/Booking:

#### 1. Calculadora de Ahorro (Suscripción)
**Ubicación:** `/panel/suscripcion`

**Qué verificar:**
- [ ] Input de "Reservas mensuales" funciona
- [ ] Input de "Precio promedio por noche" funciona
- [ ] Cálculo automático al cambiar valores
- [ ] Comparación con Airbnb (15% comisión)
- [ ] Comparación con Booking (18% comisión)
- [ ] Ahorro anual destacado visualmente
- [ ] Los números son correctos

**Valores de prueba sugeridos:**
- 10 reservas/mes a $100/noche
- Ahorro esperado vs Airbnb: ~$1,800/año
- Ahorro esperado vs Booking: ~$2,160/año

#### 2. Filtros Hiper-Locales
**Ubicación:** `/buscar`

**Qué verificar:**
- [ ] Toggle "Filtros Avanzados" funciona
- [ ] Filtro "Tipo de parrilla" visible y destacado
  - Opciones: Sin parrilla, Eléctrica, Gas, Carbón
- [ ] Filtro "Tamaño de estacionamiento" visible y destacado
  - Opciones: Sin parking, Pequeña (1 auto), Mediana (2-3 autos), Grande (4+ autos)
- [ ] Filtrado funciona correctamente
- [ ] Propiedades sin estos features no aparecen al filtrar

**Casos de prueba:**
- Buscar "Parrilla de carbón" → Debería mostrar 2 propiedades
- Buscar "Estacionamiento grande" → Debería mostrar 1 propiedad
- Combinar ambos filtros

#### 3. Precio Transparente
**Ubicación:** `/propiedad/1`

**Qué verificar:**
- [ ] Precio base visible
- [ ] Tarifa de limpieza separada
- [ ] Total calculado correctamente
- [ ] Mensaje claro: "Sin comisiones ocultas"
- [ ] Comparación opcional con plataformas tradicionales

### 🔷 Prioridad Media - Funcionalidad Core

#### 4. CRUD de Propiedades
**Ubicación:** `/panel/propiedades`

**Flujo a testear:**
1. [ ] Ver listado de 3 propiedades mock
2. [ ] Click en "Agregar Nueva Propiedad"
3. [ ] Llenar formulario completo
4. [ ] **Verificar sección "CARACTERÍSTICAS LOCALES"** con estilos destacados
5. [ ] Guardar (simulado - no persiste sin Firebase)
6. [ ] Editar propiedad existente
7. [ ] Cambiar estado Activa/Inactiva

#### 5. Sistema de Mensajes
**Ubicación:** `/panel/mensajes`

**Qué verificar:**
- [ ] 3 mensajes mock visibles
- [ ] Estados: No leído (azul) / Leído (gris)
- [ ] Información completa del mensaje
- [ ] Plantillas de respuesta rápida funcionan
- [ ] Formulario de respuesta

#### 6. Búsqueda y Filtrado
**Ubicación:** `/buscar`

**Casos de prueba:**
- [ ] Buscar por ciudad: "Villa Carlos Paz" → 1 resultado
- [ ] Buscar por ciudad: "Buenos Aires" → 1 resultado
- [ ] Filtrar por tipo: "Casa" → 1 resultado
- [ ] Filtrar por huéspedes: 6+ → 2 resultados
- [ ] Rango de precios: $80-$100 → 2 resultados

### 🔶 Prioridad Baja - UX/UI

#### 7. Responsive Design
**Dispositivos a probar:**
- [ ] Desktop (1920px+)
- [ ] Laptop (1366px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

**Qué verificar:**
- [ ] Navegación se convierte en hamburger menu en mobile
- [ ] Cards de propiedades apilan correctamente
- [ ] Formularios son usables en mobile
- [ ] Imágenes escalan apropiadamente
- [ ] No hay scroll horizontal

#### 8. Navegación y Rutas
**Flujo completo:**
1. [ ] `/` → Homepage
2. [ ] Click "Buscar" → `/buscar`
3. [ ] Click propiedad → `/propiedad/:id`
4. [ ] Click "Iniciar Sesión" → `/login`
5. [ ] Login exitoso → `/panel` (redirect automático)
6. [ ] Navegación interna del panel
7. [ ] Logout → `/` (redirect automático)

#### 9. Estados de Carga y Errores
**Qué verificar:**
- [ ] Loading spinners aparecen durante operaciones
- [ ] Mensajes de error claros y en español
- [ ] Validación de formularios
- [ ] Feedback visual de acciones (ej: guardado exitoso)

## Métricas de Éxito

### Funcionalidad
- ✅ Todas las rutas cargan sin errores
- ✅ Filtros hiper-locales funcionan correctamente
- ✅ Calculadora de ahorro muestra números correctos
- ✅ CRUD de propiedades completo
- ✅ Login/logout funciona

### UX/UI
- ✅ Responsive en todos los dispositivos
- ✅ Colores y tipografía consistentes
- ✅ CTAs claramente visibles
- ✅ Ventajas competitivas destacadas visualmente

### Performance
- ✅ Página carga en < 3 segundos
- ✅ Transiciones suaves
- ✅ No hay flickering o layouts shift

## Problemas Conocidos

### Limitaciones del Modo Mock
❗ **Sin persistencia:** Los cambios no se guardan al recargar
❗ **Imágenes:** Usando placeholders de Unsplash
❗ **Calendario:** No funcional (requiere integración real)
❗ **Pagos:** No funcional (requiere Stripe/MercadoPago)

### Pendientes de Implementación
⏳ **Subida de imágenes** a Firebase Storage
⏳ **Mensajería en tiempo real** con Firestore onSnapshot
⏳ **Sistema de reseñas** completo con CRUD
⏳ **Sincronización iCal** para calendarios externos

## Reporte de Bugs

Si encuentras problemas durante el testing, documenta:

1. **Paso a paso para reproducir**
2. **Comportamiento esperado**
3. **Comportamiento actual**
4. **Capturas de pantalla** (si aplica)
5. **Navegador y versión**
6. **Tamaño de pantalla**

## Siguiente Paso

Una vez validada la funcionalidad mock, el siguiente paso es:

1. **Configurar Firebase** con credenciales reales
2. **Subir reglas de seguridad** (firestore.rules.json, storage.rules)
3. **Testear con datos reales**
4. **Integrar pasarela de pago**
5. **Deploy a producción**

---

**Última actualización:** 2025
**Versión:** 1.0.0 (Mock Mode)
**Estado:** ✅ Listo para testing
