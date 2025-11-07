# 🚀 Guía de Despliegue - AlquiLibres

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:

- ✅ Cuenta de Firebase activa
- ✅ Firebase CLI instalado
- ✅ Proyecto configurado correctamente
- ✅ Variables de entorno configuradas
- ✅ Tests pasando (si los hay)

## 🔧 Instalación de Firebase CLI

```powershell
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Verificar instalación
firebase --version

# Login a Firebase
firebase login

# Inicializar proyecto (si no lo hiciste antes)
firebase init
```

Durante `firebase init`, selecciona:
- ✅ Firestore
- ✅ Hosting
- ✅ Storage

## 🏗️ Build de Producción

### 1. Preparar el Build

```powershell
# Limpiar build anterior
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Crear nuevo build
npm run build
```

### 2. Verificar el Build

```powershell
# Preview local del build
npm run preview

# Navegar a http://localhost:4173
# Verificar que todo funciona correctamente
```

### Checklist de Verificación:
- [ ] Todas las páginas cargan correctamente
- [ ] No hay errores en consola
- [ ] Imágenes y assets cargan
- [ ] Rutas funcionan (no 404)
- [ ] Formularios funcionan
- [ ] Autenticación funciona

## 🔐 Configuración de Seguridad

### Reglas de Firestore

```powershell
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules
```

Verifica las reglas en Firebase Console:
- Ve a Firestore Database > Rules
- Revisa que las reglas estén aplicadas

### Reglas de Storage

```powershell
# Desplegar reglas de Storage
firebase deploy --only storage
```

### Índices de Firestore

Si aparece error de índices faltantes:

1. Firebase te dará un link para crear el índice
2. Sigue el link
3. Espera a que el índice se cree (5-10 min)

Índices comunes necesarios:
```
Collection: artifacts/alqui-libres/public/data/listings
Fields: 
  - isActive (ASC)
  - location.city (ASC)
  - createdAt (DESC)
```

## 🌐 Despliegue a Firebase Hosting

### Opción 1: Despliegue Completo

```powershell
# Desplegar todo (hosting + reglas)
firebase deploy
```

### Opción 2: Solo Hosting

```powershell
# Desplegar solo el sitio web
firebase deploy --only hosting
```

### Opción 3: Preview antes de Producción

```powershell
# Crear preview temporario
firebase hosting:channel:deploy preview

# Obtendrás una URL temporal como:
# https://alqui-libres--preview-abc123.web.app
```

## 🔄 Workflow de Despliegue Recomendado

### Para Desarrollo

```powershell
# 1. Hacer cambios en código
# 2. Commit a Git
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push a GitHub
git push origin main

# 4. Desplegar preview
firebase hosting:channel:deploy dev

# 5. Probar en URL de preview
# 6. Si todo funciona, desplegar a producción
firebase deploy --only hosting
```

### Para Producción

```powershell
# 1. Asegurarse de estar en branch main
git checkout main
git pull origin main

# 2. Build de producción
npm run build

# 3. Desplegar
firebase deploy

# 4. Verificar en URL de producción
```

## 🌍 Configurar Dominio Personalizado

### 1. Ir a Firebase Console

1. Ve a Hosting > Agregar dominio personalizado
2. Ingresa tu dominio (ej: `alquilubres.com`)

### 2. Configurar DNS

Firebase te dará registros DNS para configurar:

**Tipo A:**
```
@    A    151.101.1.195
@    A    151.101.65.195
```

**Tipo CNAME (para www):**
```
www  CNAME  alqui-libres.web.app
```

### 3. Esperar Verificación

- Puede tomar 24-48 horas
- Firebase verificará automáticamente
- Proveerá certificado SSL gratis

## 📊 Monitoreo Post-Despliegue

### Firebase Console

1. **Hosting:**
   - Métricas de tráfico
   - Requests por minuto
   - Ancho de banda usado

2. **Authentication:**
   - Usuarios registrados
   - Logins por día
   - Métodos de auth usados

3. **Firestore:**
   - Reads/Writes/Deletes
   - Costos estimados
   - Documentos almacenados

4. **Storage:**
   - GB almacenados
   - Descargas
   - Costos

### Google Analytics

```javascript
// Ya incluido en src/config/firebase.js
import { getAnalytics } from 'firebase/analytics'

const analytics = getAnalytics(app)
```

Ve a Firebase Console > Analytics para ver:
- Usuarios activos
- Páginas más vistas
- Tiempo de sesión
- Conversiones

## 🐛 Solución de Problemas

### Error: "Firebase config not found"

**Solución:**
```powershell
# Verificar que .env tiene las variables correctas
cat .env

# Rebuild
npm run build
firebase deploy
```

### Error: "Permission denied" en Firestore

**Solución:**
```powershell
# Verificar reglas de Firestore
firebase firestore:rules:get

# Redesplegar reglas
firebase deploy --only firestore:rules
```

### Build falla con "out of memory"

**Solución:**
```powershell
# Aumentar memoria de Node
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Sitio muestra página en blanco

**Causas comunes:**
1. Variables de entorno no configuradas
2. Error de build no detectado
3. Rutas mal configuradas

**Solución:**
```powershell
# Verificar errores en consola del navegador (F12)
# Revisar logs de build
npm run build > build.log 2>&1
cat build.log
```

## 🔄 Rollback (Volver a Versión Anterior)

Firebase mantiene historial de despliegues:

```powershell
# Ver historial
firebase hosting:clone

# Rollback a versión anterior
firebase hosting:rollback
```

O desde Firebase Console:
1. Hosting > Historial de versiones
2. Seleccionar versión anterior
3. Clic en "Rollback"

## 🚦 CI/CD con GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: tu-proyecto-id
```

### Configurar Secrets en GitHub:

1. Ve a tu repo > Settings > Secrets and variables > Actions
2. Agrega secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - etc.
   - `FIREBASE_SERVICE_ACCOUNT` (JSON completo)

## 📈 Optimizaciones Post-Despliegue

### 1. CDN y Caché

Firebase Hosting ya usa CDN global, pero puedes optimizar:

```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=31536000"
        }]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=31536000"
        }]
      }
    ]
  }
}
```

### 2. Comprimir Imágenes

```powershell
# Instalar imagemin CLI
npm install -g imagemin-cli imagemin-webp

# Comprimir imágenes antes de build
imagemin public/images/*.{jpg,png} --out-dir=public/images/compressed --plugin=webp
```

### 3. Lazy Loading Mejorado

Ya implementado en componentes, pero verifica:
- Imágenes below-the-fold usan lazy loading
- Rutas usan lazy imports
- Components grandes son lazy

### 4. Performance Monitoring

```javascript
// src/main.js
import { getPerformance } from 'firebase/performance'

const perf = getPerformance(app)
```

Ver métricas en Firebase Console > Performance

## 🌐 Alternativas a Firebase Hosting

### Vercel

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### Netlify

```powershell
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Cloudflare Pages

```powershell
# Instalar Wrangler
npm i -g wrangler

# Deploy
wrangler pages deploy dist
```

## ✅ Checklist Final de Despliegue

Antes de lanzar públicamente:

### Técnico
- [ ] Build de producción sin errores
- [ ] Todas las variables de entorno configuradas
- [ ] Reglas de Firestore desplegadas
- [ ] Reglas de Storage desplegadas
- [ ] Índices de Firestore creados
- [ ] SSL certificado activo
- [ ] Dominio personalizado configurado

### Funcional
- [ ] Registro de usuarios funciona
- [ ] Login funciona
- [ ] CRUD de propiedades funciona
- [ ] Búsqueda funciona
- [ ] Mensajería funciona (básica)
- [ ] Sistema de pagos funciona (si implementado)

### SEO y Marketing
- [ ] Meta tags configurados
- [ ] Google Analytics conectado
- [ ] Sitemap generado
- [ ] robots.txt configurado
- [ ] Open Graph tags para social sharing

### Legal
- [ ] Términos y condiciones publicados
- [ ] Política de privacidad publicada
- [ ] Aviso de cookies (si aplica)
- [ ] GDPR compliance (si aplica)

## 📞 Soporte Post-Despliegue

### Monitoreo Continuo

**Herramientas recomendadas:**
1. **Firebase Console** - Métricas básicas
2. **Google Analytics** - Comportamiento de usuarios
3. **Sentry** - Error tracking
4. **LogRocket** - Session replay

### Setup de Sentry (Recomendado)

```javascript
// src/main.js
import * as Sentry from "@sentry/vue"

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
})
```

## 🎉 ¡Listo para Lanzar!

Una vez completado este proceso:

1. Anuncia en redes sociales
2. Contacta a primeros usuarios beta
3. Recolecta feedback
4. Itera rápidamente

**¡Éxito con el lanzamiento de AlquiLibres!** 🚀

---

**Próximos pasos:**
- Ver `BUSINESS.md` para estrategia de crecimiento
- Ver `ROADMAP.md` para features futuras
- Ver `DEVELOPMENT.md` para guía técnica detallada
