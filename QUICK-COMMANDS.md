# ⚡ Quick Commands - AlquiLibres

Comandos rápidos para desarrollo y deployment.

---

## 🔧 Desarrollo

### Frontend (Vite)
```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Firebase Functions
```bash
# Instalar dependencias de functions
npm run functions:install
# o
cd functions && npm install

# Ejecutar emuladores locales
npm run functions:serve
# o
firebase emulators:start --only functions

# Ver logs en tiempo real
npm run functions:logs
```

---

## 🚀 Deployment

### Hosting (GitHub Pages)
```bash
# Deploy solo hosting
npm run deploy:hosting

# Deploy preview
npm run deploy:preview
```

### Functions
```bash
# Deploy solo functions
npm run deploy:functions

# Deploy functions + rules
firebase deploy --only functions,firestore
```

### Deploy Completo
```bash
# Hosting + Functions + Rules
npm run deploy:all
```

---

## 🔐 Firebase Auth

```bash
# Login a Firebase
firebase login

# Ver proyectos disponibles
firebase projects:list

# Seleccionar proyecto
firebase use alqui-libres

# Ver proyecto actual
firebase use
```

---

## 📧 Configurar Notificaciones

### 1. Variables de entorno
```bash
cd functions
cp .env.example .env
# Edita .env con tus credenciales
```

### 2. SendGrid
```bash
# Obtén tu API key en: https://app.sendgrid.com/settings/api_keys
# Agrégala a functions/.env:
SENDGRID_API_KEY=SG.xxxxxxxxxx
FROM_EMAIL=notificaciones@alquilibres.com
```

### 3. Twilio WhatsApp
```bash
# Obtén credenciales en: https://console.twilio.com/
# Agrégalas a functions/.env:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Deploy
```bash
npm run deploy:functions
```

---

## 📊 Logs y Debugging

### Ver logs de Functions
```bash
# Logs en tiempo real
firebase functions:log

# Logs de función específica
firebase functions:log --only createReservation

# Últimos 50 logs
firebase functions:log -n 50

# Logs con filtro
firebase functions:log --only createReservation -n 100
```

### Ver logs en Firebase Console
https://console.firebase.google.com/ > Functions > Logs

---

## 🧪 Testing

### Test API local
```bash
# Crear reserva
curl -X POST http://localhost:5001/alqui-libres/us-central1/createReservation \
  -H "Content-Type: application/json" \
  -d @test-data/reservation.json

# Confirmar reserva
curl -X POST http://localhost:5001/alqui-libres/us-central1/confirmReservation \
  -H "Content-Type: application/json" \
  -d '{"reservationId": "res_123", "ownerId": "user_456"}'
```

### Test API producción
```bash
# Cambiar localhost por:
https://us-central1-alqui-libres.cloudfunctions.net/createReservation
```

---

## 🔥 Firestore

### Deploy solo rules
```bash
npm run deploy:rules
# o
firebase deploy --only firestore:rules
```

### Ver datos en Firestore
https://console.firebase.google.com/ > Firestore Database

---

## 🐛 Troubleshooting

### Limpiar cache y reinstalar
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Functions
cd functions
rm -rf node_modules package-lock.json
npm install
```

### Ver errores de compilación
```bash
# Frontend
npm run build

# Functions
cd functions
npm run lint
```

### Revisar configuración
```bash
# Ver config de Firebase Functions
firebase functions:config:get

# Ver proyecto activo
firebase use

# Ver servicios disponibles
firebase list
```

---

## 📚 Documentación Completa

- **Setup notificaciones:** `DEPLOYMENT-NOTIFICATIONS.md`
- **API Reference:** `functions/README.md`
- **Tasks pendientes:** `PENDIENTES.md`
- **Changelog:** `CHANGELOG.md`

---

## 🆘 Ayuda Rápida

```bash
# Ver comandos disponibles
npm run

# Ayuda de Firebase CLI
firebase --help
firebase deploy --help

# Ayuda de functions
cd functions
npm run --help
```

---

## 🎯 Flujo Típico de Desarrollo

```bash
# 1. Pull cambios
git pull origin main

# 2. Instalar/actualizar dependencias
npm install
cd functions && npm install && cd ..

# 3. Desarrollo local
npm run dev
# En otra terminal:
npm run functions:serve

# 4. Testing
# Probar en http://localhost:5173
# Probar functions en http://localhost:5001

# 5. Build
npm run build

# 6. Deploy
npm run deploy:all

# 7. Commit
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

---

## 🚀 Deploy Rápido (Producción)

```bash
# Un solo comando para todo
npm run build && firebase deploy

# O paso a paso
npm run build
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## ⚙️ Configuración Inicial (Primera vez)

```bash
# 1. Clonar repo
git clone https://github.com/DaniPerego/alqui-libres.git
cd alqui-libres

# 2. Instalar dependencias frontend
npm install

# 3. Instalar dependencias functions
cd functions
npm install
cd ..

# 4. Configurar Firebase
firebase login
firebase use --add
# Selecciona: alqui-libres

# 5. Configurar variables de entorno
cd functions
cp .env.example .env
# Edita .env con tus credenciales
cd ..

# 6. Ejecutar localmente
npm run dev

# 7. Probar functions localmente
npm run functions:serve
```

---

¿Más ayuda? Lee la documentación completa en `/docs` o abre un issue en GitHub.
