# 🚀 Guía de Inicio Rápido - AlquiLibres

## Instalación en 5 Pasos

### 1️⃣ Clonar e Instalar

```powershell
# Navegar al directorio del proyecto (ya clonado)
cd d:\PROYECTOS\alqui-libres

# Instalar dependencias
npm install
```

### 2️⃣ Configurar Firebase

1. **Crear proyecto en Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Clic en "Agregar proyecto"
   - Sigue el asistente

2. **Habilitar servicios:**
   - **Authentication**: Email/Password
   - **Firestore Database**: Modo de producción
   - **Storage**: Modo de producción

3. **Obtener credenciales:**
   - Ve a Configuración del proyecto > General
   - En "Tus apps", selecciona la app web
   - Copia las credenciales de configuración

### 3️⃣ Configurar Variables de Entorno

```powershell
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env con tus credenciales
# Usa notepad o tu editor favorito
notepad .env
```

Completa con tus datos de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4️⃣ Configurar Reglas de Firebase

```powershell
# Inicializar Firebase en el proyecto
firebase init

# Seleccionar:
# - Firestore
# - Hosting
# - Storage

# Usar los archivos existentes cuando pregunte
```

Luego despliega las reglas:

```powershell
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 5️⃣ Iniciar la Aplicación

```powershell
npm run dev
```

Abre tu navegador en: `http://localhost:5173`

---

## 🎯 Primeros Pasos

### Como Propietario

1. **Registrarse:**
   - Clic en "Publicar Propiedad"
   - Completa el formulario de registro
   - Verifica tu email

2. **Crear Primera Propiedad:**
   - Ve a "Mi Panel" > "Mis Propiedades"
   - Clic en "+ Nueva Propiedad"
   - Completa todos los campos requeridos
   - ¡Presta atención a los filtros hiper-locales! (parrilla, cochera)
   - Clic en "Publicar Propiedad"

3. **Gestionar Suscripción:**
   - Ve a "Mi Panel" > "Mi Suscripción"
   - Selecciona un plan
   - Configura método de pago (integración pendiente)

### Como Huésped

1. **Buscar Propiedades:**
   - En la página principal, usa el buscador
   - Ingresa: Ciudad, fechas, número de huéspedes
   - Usa los filtros hiper-locales para refinar

2. **Ver Detalles:**
   - Clic en cualquier propiedad
   - Revisa fotos, características locales, amenidades
   - Verifica precio total (sin sorpresas)

3. **Contactar:**
   - Clic en "Contactar al Anfitrión"
   - Completa el formulario de consulta

---

## ✅ Verificar Instalación

### Test de Conectividad Firebase

Abre la consola del navegador (F12) y ejecuta:

```javascript
// En la pestaña Console
console.log(firebase.app().options)
```

Deberías ver tu configuración de Firebase.

### Test de Autenticación

1. Intenta registrarte con un email de prueba
2. Si aparece error "auth/operation-not-allowed":
   - Ve a Firebase Console > Authentication
   - Habilita el método "Correo electrónico/Contraseña"

### Test de Firestore

1. Crea una propiedad
2. Ve a Firebase Console > Firestore Database
3. Deberías ver:
   - `artifacts/alqui-libres/users/{tu-uid}/properties/{property-id}`
   - `artifacts/alqui-libres/public/data/listings/{property-id}`

---

## 🐛 Solución de Problemas Comunes

### Error: "Firebase config is invalid"

**Solución:** Verifica que el archivo `.env` tenga todas las variables correctas sin espacios.

### Error: "Missing or insufficient permissions"

**Solución:** 
```powershell
firebase deploy --only firestore:rules
```

### La aplicación no inicia

**Solución:**
```powershell
# Limpiar caché
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

### Las imágenes no se suben

**Solución:** Verifica que las reglas de Storage estén desplegadas:
```powershell
firebase deploy --only storage
```

---

## 📚 Recursos Útiles

- **Documentación completa:** `README.md`
- **Guía de desarrollo:** `DEVELOPMENT.md`
- **Firebase Console:** https://console.firebase.google.com/
- **Vue.js Docs:** https://vuejs.org/

---

## 🎨 Características Destacadas para Probar

### 1. Filtros Hiper-Locales (Ventaja Competitiva)

En la búsqueda pública:
- Filtrar por "Tipo de Parrilla" (carbón, gas, eléctrica)
- Filtrar por "Tamaño de Cochera"
- Ver distancia al centro de cada propiedad

### 2. Transparencia de Precios

Al ver una propiedad:
- El precio base está claramente visible
- La tarifa de limpieza se muestra por separado
- El total se calcula automáticamente
- Sin cargos ocultos ni sorpresas

### 3. Editor Simplificado

Al crear una propiedad:
- Formulario intuitivo en secciones
- Campos específicos locales destacados
- Validación en tiempo real
- Menos pasos que Airbnb/Booking

### 4. Comparativa de Ahorro

En "Mi Suscripción":
- Ver comparativa con Airbnb/Booking
- Calcular ahorro potencial
- Entender el modelo de negocio

---

## 🚀 Próximo Paso: Personalización

1. **Cambiar colores:** Edita `src/assets/styles/main.css`
2. **Agregar tu logo:** Reemplaza en `AppHeader.vue`
3. **Configurar pasarela de pago:** Integra Stripe/MercadoPago
4. **Agregar dominio personalizado:** Configura en Firebase Hosting

---

¡Ya estás listo para empezar! 🎉

Si tienes problemas, consulta `DEVELOPMENT.md` o abre un issue.
