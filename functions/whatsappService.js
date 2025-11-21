const twilio = require('twilio');

// Configurar cliente de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

/**
 * Formatea número de teléfono para WhatsApp
 * Convierte formatos como +54911... o 11... a formato internacional
 */
function formatPhoneNumber(phone) {
  // Remover espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si no empieza con +, agregar código de país (Argentina por defecto)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('54')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('11') || cleaned.startsWith('9')) {
      cleaned = '+549' + cleaned;
    } else {
      cleaned = '+54' + cleaned;
    }
  }
  
  return 'whatsapp:' + cleaned;
}

/**
 * Envía WhatsApp al propietario cuando se crea una nueva reserva
 */
exports.sendNewReservationWhatsApp = async (ownerPhone, reservation) => {
  try {
    const message = `🏠 *Nueva Reserva en AlquiLibres*

📍 *Propiedad:* ${reservation.property.title}
📅 *Check-in:* ${new Date(reservation.checkIn).toLocaleDateString('es-AR')}
📅 *Check-out:* ${new Date(reservation.checkOut).toLocaleDateString('es-AR')}
🛏️ *Noches:* ${reservation.nights}
👥 *Huéspedes:* ${reservation.guests}

👤 *Datos del Huésped:*
• Nombre: ${reservation.guestName}
• Email: ${reservation.guestEmail}
• Teléfono: ${reservation.guestPhone}

💰 *Total:* $${reservation.total.toLocaleString('es-AR')}

${reservation.message ? `💬 *Mensaje:*\n"${reservation.message}"\n\n` : ''}⚠️ *Recordá confirmar o rechazar esta reserva desde tu panel.*

Ver reserva: ${process.env.FRONTEND_URL}/panel/reservas`;

    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formatPhoneNumber(ownerPhone),
      body: message
    });

    console.log('✅ WhatsApp enviado a propietario:', ownerPhone, '- SID:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    // No lanzar error para no bloquear el flujo si WhatsApp falla
    return { success: false, error: error.message };
  }
};

/**
 * Envía WhatsApp al huésped confirmando la reserva
 */
exports.sendReservationConfirmedWhatsApp = async (guestPhone, reservation) => {
  try {
    const message = `✅ *¡Reserva Confirmada!*

¡Excelente noticia! El anfitrión confirmó tu reserva en:

🏠 *${reservation.property.title}*
📍 ${reservation.property.city}

📅 *Check-in:* ${new Date(reservation.checkIn).toLocaleDateString('es-AR')}
📅 *Check-out:* ${new Date(reservation.checkOut).toLocaleDateString('es-AR')}
🛏️ *${reservation.nights} noche${reservation.nights > 1 ? 's' : ''}*

💰 *Total:* $${reservation.total.toLocaleString('es-AR')}

📞 *Contacto del Anfitrión:*
• Nombre: ${reservation.ownerName || 'No disponible'}
• Teléfono: ${reservation.ownerPhone || 'No disponible'}

Ver tu reserva: ${process.env.FRONTEND_URL}/panel/mis-reservas

🏠 AlquiLibres - Alquilá sin intermediarios`;

    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formatPhoneNumber(guestPhone),
      body: message
    });

    console.log('✅ WhatsApp de confirmación enviado al huésped:', guestPhone, '- SID:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de confirmación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía WhatsApp al huésped notificando rechazo de reserva
 */
exports.sendReservationRejectedWhatsApp = async (guestPhone, reservation, reason) => {
  try {
    const message = `😔 *Reserva No Disponible*

Hola ${reservation.guestName},

Lamentablemente, el anfitrión no puede confirmar tu reserva en:

🏠 *${reservation.property.title}*
📍 ${reservation.property.city}

${reason ? `📝 *Motivo:*\n${reason}\n\n` : ''}Te invitamos a buscar otras propiedades disponibles en nuestro catálogo.

Buscar propiedades: ${process.env.FRONTEND_URL}/buscar

🏠 AlquiLibres`;

    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formatPhoneNumber(guestPhone),
      body: message
    });

    console.log('✅ WhatsApp de rechazo enviado al huésped:', guestPhone, '- SID:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp de rechazo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Función auxiliar para enviar WhatsApp genérico
 */
exports.sendWhatsApp = async (to, message) => {
  try {
    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formatPhoneNumber(to),
      body: message
    });

    console.log('✅ WhatsApp enviado a:', to, '- SID:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    return { success: false, error: error.message };
  }
};
