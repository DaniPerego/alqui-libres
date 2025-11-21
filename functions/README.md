# Firebase Functions - AlquiLibres

Sistema de notificaciones backend para AlquiLibres usando Firebase Cloud Functions.

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales reales
```

### 3. Ejecutar localmente

```bash
npm run serve
# Functions disponibles en http://localhost:5001
```

### 4. Deployar a producción

```bash
cd ..
npm run deploy:functions
```

---

## 📁 Estructura

```
functions/
├── index.js              # Funciones principales (HTTP + Triggers)
├── emailService.js       # Servicio de emails con SendGrid
├── whatsappService.js    # Servicio de WhatsApp con Twilio
├── package.json          # Dependencias
├── .env.example          # Template de variables de entorno
└── .env                  # Variables de entorno (NO SUBIR A GIT)
```

---

## 🔌 Endpoints Disponibles

### POST /createReservation
Crea una nueva reserva y envía notificaciones al propietario.

**Request:**
```json
{
  "propertyId": "prop123",
  "ownerId": "user456",
  "guestId": "user789",
  "property": {
    "title": "Casa con Parrilla",
    "city": "Villa Carlos Paz",
    "image": "https://..."
  },
  "guestName": "Juan Pérez",
  "guestEmail": "juan@email.com",
  "guestPhone": "+54911...",
  "ownerName": "María González",
  "ownerEmail": "maria@email.com",
  "ownerPhone": "+54911...",
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-05",
  "nights": 4,
  "guests": 2,
  "basePrice": 100,
  "cleaningFee": 20,
  "total": 420,
  "message": "Mensaje opcional del huésped"
}
```

**Response:**
```json
{
  "success": true,
  "reservation": {
    "id": "res_abc123",
    "status": "pending",
    ...
  }
}
```

---

### POST /confirmReservation
Confirma una reserva y notifica al huésped.

**Request:**
```json
{
  "reservationId": "res_abc123",
  "ownerId": "user456"
}
```

**Response:**
```json
{
  "success": true,
  "reservation": {
    "id": "res_abc123",
    "status": "confirmed",
    ...
  }
}
```

---

### POST /rejectReservation
Rechaza una reserva y notifica al huésped con motivo.

**Request:**
```json
{
  "reservationId": "res_abc123",
  "ownerId": "user456",
  "reason": "Fechas no disponibles"
}
```

**Response:**
```json
{
  "success": true,
  "reservation": {
    "id": "res_abc123",
    "status": "rejected",
    ...
  }
}
```

---

### POST /cancelReservation
Cancela una reserva (propietario o huésped).

**Request:**
```json
{
  "reservationId": "res_abc123",
  "userId": "user456",
  "userType": "owner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reserva cancelada exitosamente"
}
```

---

### GET /getOwnerReservations
Obtiene todas las reservas de un propietario.

**Query params:**
- `ownerId` (required): ID del propietario
- `status` (optional): Filtrar por estado (pending, confirmed, rejected, cancelled)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "reservations": [...]
}
```

---

## 🔥 Firestore Triggers

### onReservationCreated
Se ejecuta automáticamente cuando se crea una reserva en Firestore.
Envía notificaciones al propietario (email + WhatsApp).

### onReservationUpdated
Se ejecuta cuando se actualiza el estado de una reserva.
Envía notificaciones al huésped según el nuevo estado.

---

## 🧪 Testing

### Test con curl

```bash
# Crear reserva
curl -X POST http://localhost:5001/alqui-libres/us-central1/createReservation \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "test123",
    "ownerId": "owner123",
    "guestId": "guest123",
    "guestName": "Test User",
    "guestEmail": "test@email.com",
    "guestPhone": "+5491112345678",
    "ownerEmail": "owner@email.com",
    "ownerPhone": "+5491187654321",
    "checkIn": "2025-12-01",
    "checkOut": "2025-12-05",
    "nights": 4,
    "guests": 2,
    "total": 400,
    "property": {
      "title": "Test Property",
      "city": "Test City"
    }
  }'

# Confirmar reserva
curl -X POST http://localhost:5001/alqui-libres/us-central1/confirmReservation \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "res_123",
    "ownerId": "owner123"
  }'
```

### Test con Postman/Insomnia

Importa las URLs:
- Development: `http://localhost:5001/alqui-libres/us-central1/{functionName}`
- Production: `https://us-central1-alqui-libres.cloudfunctions.net/{functionName}`

---

## 📧 Configuración de Servicios

### SendGrid (Emails)

1. Crea cuenta en https://sendgrid.com/
2. Verifica tu email/dominio
3. Crea API key con permisos de Mail Send
4. Agrega a `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxx
   FROM_EMAIL=notificaciones@alquilibres.com
   ```

### Twilio (WhatsApp)

1. Crea cuenta en https://twilio.com/
2. Obtén Account SID y Auth Token del dashboard
3. Configura WhatsApp Sandbox para testing
4. Agrega a `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxx
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

**IMPORTANTE:** Para WhatsApp sandbox, los números deben hacer "join" primero:
- Envía WhatsApp a `+1 415 523 8886`
- Mensaje: `join [código]` (lo ves en el dashboard)

---

## 📊 Logs y Monitoreo

### Ver logs en tiempo real
```bash
firebase functions:log
```

### Ver logs de una función específica
```bash
firebase functions:log --only createReservation
```

### Ver últimos 50 logs
```bash
firebase functions:log -n 50
```

### Firebase Console
Ve a https://console.firebase.google.com/ > Functions > Logs

---

## 🐛 Troubleshooting

### Error: "CORS blocked"
- Ya está configurado con `cors({ origin: true })`
- Verifica que envías `Content-Type: application/json`

### Error: "SendGrid API key invalid"
- Verifica que copiaste bien la key (sin espacios)
- Verifica que el FROM_EMAIL está verificado en SendGrid

### Error: "Twilio authentication failed"
- Verifica Account SID y Auth Token
- No uses el Test Credentials, usa los reales

### Error: "WhatsApp not delivered"
- En sandbox: el número debe haber hecho "join"
- Verifica formato: `whatsapp:+5491112345678`
- Verifica que el número incluye código de país

### Error: "Firebase billing required"
- Upgrade a Blaze Plan en Firebase Console
- Es gratis hasta 2M invocaciones/mes

---

## 💰 Costos

- **Firebase Functions:** Gratis hasta 2M invocaciones/mes
- **SendGrid:** Gratis hasta 100 emails/día
- **Twilio WhatsApp:** 
  - Sandbox: GRATIS (testing only)
  - Production: ~$0.005-$0.05 por mensaje

**Estimación mensual para 100 reservas/mes: ~$0-2**

---

## 📚 Documentación

- [Guía completa de deployment](../DEPLOYMENT-NOTIFICATIONS.md)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)

---

## 🔒 Seguridad

- ✅ Variables de entorno en `.env` (NO subir a Git)
- ✅ CORS habilitado
- ✅ Validación de campos requeridos
- ✅ Verificación de ownership (ownerId, guestId)
- ✅ Firestore Security Rules implementadas

---

## 🚀 Deployment

### Desarrollo (emuladores)
```bash
npm run serve
```

### Producción
```bash
# Desde la raíz del proyecto
npm run deploy:functions

# O deploy completo
npm run deploy:all
```

---

¿Problemas? Revisa [DEPLOYMENT-NOTIFICATIONS.md](../DEPLOYMENT-NOTIFICATIONS.md) para guía completa.
