# 🚀 Guía de Deployment - Sistema de Notificaciones

Esta guía te explica cómo configurar y deployar el sistema completo de notificaciones para AlquiLibres.

## 📋 Pre-requisitos

- Cuenta de Firebase (Blaze Plan - requerido para Functions)
- Cuenta de SendGrid (para emails)
- Cuenta de Twilio (para WhatsApp)
- Node.js 18+
- Firebase CLI instalado: `npm install -g firebase-tools`

---

## 1️⃣ Configurar Firebase Functions

### Paso 1: Instalar dependencias

```bash
cd functions
npm install
```

### Paso 2: Crear archivo .env

Copia el archivo de ejemplo y llena las credenciales:

```bash
cp .env.example .env
```

Edita `functions/.env` con tus credenciales reales (ver sección de configuración más abajo).

### Paso 3: Configurar variables de entorno en Firebase

**Opción A: Usando .env local (desarrollo)**
```bash
# Las variables se cargan automáticamente desde .env
```

**Opción B: Configurar en Firebase (producción)**
```bash
firebase functions:config:set \
  sendgrid.key="SG.tu_api_key_aqui" \
  sendgrid.from_email="notificaciones@alquilibres.com" \
  twilio.account_sid="ACxxxxxxxxxxxxx" \
  twilio.auth_token="tu_auth_token" \
  twilio.whatsapp_number="whatsapp:+14155238886" \
  app.frontend_url="https://daniperego.github.io/alqui-libres"
```

Para ver la configuración actual:
```bash
firebase functions:config:get
```

---

## 2️⃣ Configurar SendGrid (Emails)

### Paso 1: Crear cuenta
1. Ve a https://signup.sendgrid.com/
2. Completa el registro (plan gratuito: 100 emails/día)
3. Verifica tu email

### Paso 2: Verificar dominio/email
1. Ve a **Settings > Sender Authentication**
2. **Opción A - Single Sender** (más rápido):
   - Clic en "Verify a Single Sender"
   - Usa: `notificaciones@alquilibres.com` o tu email personal
   - Verifica el email que te envían
   
3. **Opción B - Domain Authentication** (profesional):
   - Clic en "Authenticate Your Domain"
   - Sigue los pasos para configurar DNS

### Paso 3: Crear API Key
1. Ve a **Settings > API Keys**
2. Clic en "Create API Key"
3. Nombre: "AlquiLibres Production"
4. Permisos: "Full Access" o "Mail Send"
5. **¡IMPORTANTE!** Copia la API key (solo se muestra una vez)
6. Guárdala en `functions/.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
   FROM_EMAIL=notificaciones@alquilibres.com
   ```

### Paso 4: Probar envío
```bash
# En la carpeta functions/
node -e "
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('TU_API_KEY');
sgMail.send({
  to: 'tu_email@test.com',
  from: 'notificaciones@alquilibres.com',
  subject: 'Test AlquiLibres',
  text: 'Funciona!'
}).then(() => console.log('✅ Email enviado')).catch(err => console.error('❌', err));
"
```

---

## 3️⃣ Configurar Twilio (WhatsApp)

### Paso 1: Crear cuenta
1. Ve a https://www.twilio.com/try-twilio
2. Completa el registro (plan gratuito: $15 de crédito)
3. Verifica tu teléfono

### Paso 2: Obtener credenciales
1. Ve al Dashboard: https://console.twilio.com/
2. Copia el **Account SID** y **Auth Token**
3. Guárdalos en `functions/.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=tu_auth_token_secreto
   ```

### Paso 3: Configurar WhatsApp Sandbox (Desarrollo)

**IMPORTANTE:** El sandbox es para testing. Los números deben "unirse" primero.

1. Ve a **Messaging > Try it out > Send a WhatsApp message**
2. Copia el número del sandbox: `whatsapp:+14155238886`
3. Guarda en `.env`:
   ```
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
4. **Unir tu número al sandbox:**
   - Envía un mensaje de WhatsApp al número: `+1 415 523 8886`
   - Mensaje: `join <codigo>` (el código lo ves en el dashboard)
   - Ejemplo: `join carpet-lucky`

### Paso 4: WhatsApp Business API (Producción)

Para producción necesitas la WhatsApp Business API (requiere aprobación):

1. Ve a **Messaging > Senders > WhatsApp senders**
2. Clic en "Request Access"
3. Completa el formulario de Facebook Business Manager
4. Espera aprobación (puede tardar días/semanas)
5. Una vez aprobado, configura tu número verificado
6. Actualiza `.env` con tu número real:
   ```
   TWILIO_WHATSAPP_NUMBER=whatsapp:+5491112345678
   ```

**Limitaciones del Sandbox:**
- ❌ Solo funciona con números que se "unieron"
- ❌ No es para producción
- ✅ Perfecto para development y testing

**WhatsApp Business API:**
- ✅ Puedes enviar a cualquier número
- ✅ Templates de mensajes pre-aprobados
- ✅ Para producción real

### Paso 5: Probar envío
```bash
# En la carpeta functions/
node -e "
const twilio = require('twilio');
const client = twilio('TU_ACCOUNT_SID', 'TU_AUTH_TOKEN');
client.messages.create({
  from: 'whatsapp:+14155238886',
  to: 'whatsapp:+549TUNUMERO',
  body: '🏠 Test de AlquiLibres!'
}).then(msg => console.log('✅ WhatsApp enviado:', msg.sid)).catch(err => console.error('❌', err));
"
```

---

## 4️⃣ Configurar variables de entorno

Tu archivo `functions/.env` debe verse así:

```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=notificaciones@alquilibres.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# App
FRONTEND_URL=https://daniperego.github.io/alqui-libres
```

**⚠️ NUNCA subas este archivo a Git!** (ya está en .gitignore)

---

## 5️⃣ Deployar Firebase Functions

### Desarrollo: Emuladores locales

```bash
# Instalar emuladores (primera vez)
firebase init emulators

# Ejecutar emuladores
cd functions
npm run serve

# O desde la raíz
firebase emulators:start --only functions
```

Accede a:
- Functions: http://localhost:5001/alqui-libres/us-central1/createReservation
- UI: http://localhost:4000

### Producción: Deploy real

```bash
# 1. Login a Firebase
firebase login

# 2. Verificar proyecto
firebase use --add
# Selecciona tu proyecto: alqui-libres

# 3. Deploy solo functions
firebase deploy --only functions

# 4. Deploy functions + firestore rules
firebase deploy --only functions,firestore

# 5. Deploy completo (hosting + functions + rules)
npm run deploy
```

**URLs después del deploy:**
```
✔ Functions:
  - createReservation: https://us-central1-alqui-libres.cloudfunctions.net/createReservation
  - confirmReservation: https://us-central1-alqui-libres.cloudfunctions.net/confirmReservation
  - rejectReservation: https://us-central1-alqui-libres.cloudfunctions.net/rejectReservation
  - cancelReservation: https://us-central1-alqui-libres.cloudfunctions.net/cancelReservation
  - getOwnerReservations: https://us-central1-alqui-libres.cloudfunctions.net/getOwnerReservations
```

---

## 6️⃣ Configurar Frontend

### Desarrollo (localhost)

Crea `.env.local` en la raíz del proyecto:

```env
VITE_FIREBASE_FUNCTIONS_URL=http://localhost:5001/alqui-libres/us-central1
```

### Producción (GitHub Pages)

Crea `.env.production` en la raíz:

```env
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-alqui-libres.cloudfunctions.net
```

El frontend ya está configurado para usar estas URLs automáticamente.

---

## 7️⃣ Probar el Sistema Completo

### Test 1: Crear reserva desde el frontend

1. Abre http://localhost:5173 (o tu URL de producción)
2. Navega a una propiedad
3. Completa el formulario de reserva
4. Envía la solicitud
5. **Verifica:**
   - ✅ Consola del navegador: "Reserva creada"
   - ✅ Firestore: Nueva entrada en collection `reservations`
   - ✅ Email recibido (revisa spam)
   - ✅ WhatsApp recibido (si configuraste sandbox)

### Test 2: Confirmar/Rechazar reserva

1. Ve al panel del propietario: `/panel/reservas`
2. Click en "Confirmar" o "Rechazar"
3. **Verifica:**
   - ✅ Estado actualizado en Firestore
   - ✅ Email al huésped
   - ✅ WhatsApp al huésped

### Test 3: Ver logs

```bash
# Ver logs en tiempo real
firebase functions:log --only createReservation

# Ver todos los logs
firebase functions:log
```

---

## 8️⃣ Monitoreo y Debugging

### Ver métricas en Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. **Functions > Dashboard**:
   - Invocaciones
   - Errores
   - Tiempo de ejecución
   - Memoria usada

### Debugging común

**❌ Error: "CORS"**
```javascript
// Ya está configurado en functions/index.js
const cors = require('cors')({ origin: true });
```

**❌ Error: "SendGrid API key invalid"**
- Verifica que copiaste bien la key
- Verifica que el email está verificado en SendGrid

**❌ Error: "Twilio authentication failed"**
- Verifica Account SID y Auth Token
- Asegúrate de no tener espacios extra

**❌ Error: "WhatsApp not delivered"**
- En sandbox: el número debe haber hecho "join" primero
- Verifica formato: `whatsapp:+5491112345678`

**❌ Error: "Firebase billing required"**
- Necesitas upgrade a Blaze Plan para Functions
- Ve a Firebase Console > Upgrade

---

## 9️⃣ Costos Estimados

### Firebase (Blaze Plan - Pay as you go)
- **Gratis hasta:**
  - 2M invocaciones/mes
  - 400K GB-segundos
  - 200K CPU-segundos
- **Después:**
  - $0.40 por millón de invocaciones
  - Muy probablemente GRATIS para un proyecto pequeño/mediano

### SendGrid
- **Free:** 100 emails/día = 3,000/mes
- **Essentials ($19/mes):** 50,000 emails/mes
- **Pro ($99/mes):** 100,000 emails/mes

### Twilio WhatsApp
- **Sandbox:** GRATIS (solo testing)
- **WhatsApp Business API:**
  - Conversaciones iniciadas por usuario: $0.005 - $0.01
  - Conversaciones iniciadas por negocio: $0.03 - $0.05
  - ~$15 crédito gratis al registrarte

**Estimación para 100 reservas/mes:**
- Firebase: $0 (dentro del free tier)
- SendGrid: $0 (dentro de 100/día)
- Twilio: ~$1-2 (si usas WhatsApp production)
- **TOTAL: ~$0-2/mes** (¡muy barato!)

---

## 🎉 ¡Listo!

Tu sistema de notificaciones está configurado. Ahora:

1. ✅ Las reservas se crean en Firestore
2. ✅ Los propietarios reciben email + WhatsApp
3. ✅ Los huéspedes reciben confirmaciones
4. ✅ Todo funciona automáticamente

### Próximos pasos opcionales:

- [ ] Configurar templates de email más bonitos
- [ ] Agregar notificaciones push (FCM)
- [ ] Implementar recordatorios automáticos
- [ ] Analytics de emails (open rate, click rate)
- [ ] A/B testing de mensajes

### Soporte:

- SendGrid Docs: https://docs.sendgrid.com/
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Firebase Functions: https://firebase.google.com/docs/functions

---

## 🐛 Troubleshooting Rápido

```bash
# Ver estado de Firebase
firebase projects:list

# Ver funciones deployadas
firebase functions:list

# Ver configuración
firebase functions:config:get

# Eliminar una función
firebase functions:delete nombreFuncion

# Logs en tiempo real
firebase functions:log --only createReservation -n 50

# Test local de una función
cd functions
node -e "const f = require('./index'); f.createReservation(mockRequest, mockResponse)"
```

¿Problemas? Revisa los logs y la documentación oficial. ¡Suerte! 🚀
