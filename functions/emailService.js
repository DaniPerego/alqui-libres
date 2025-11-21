const sgMail = require('@sendgrid/mail');

// Configurar API key de SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

// Email del remitente (debe estar verificado en SendGrid)
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@alquilibres.com';

/**
 * Envía email al propietario cuando se crea una nueva reserva
 */
exports.sendNewReservationEmail = async (ownerEmail, reservation) => {
  try {
    const msg = {
      to: ownerEmail,
      from: FROM_EMAIL,
      subject: `🏠 Nueva Reserva - ${reservation.property.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .property { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .guest-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .dates { display: flex; justify-content: space-between; margin: 15px 0; }
            .date-box { flex: 1; text-align: center; padding: 15px; background: #e7f3ff; border-radius: 8px; margin: 0 5px; }
            .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; text-align: center; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Nueva Reserva Recibida!</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${reservation.ownerName || 'Anfitrión'}</strong>,</p>
              <p>Has recibido una nueva solicitud de reserva en tu propiedad:</p>
              
              <div class="property">
                <h2 style="margin-top: 0;">📍 ${reservation.property.title}</h2>
                <p style="color: #666; margin: 5px 0;">${reservation.property.city}</p>
              </div>
              
              <div class="guest-info">
                <h3 style="margin-top: 0;">👤 Información del Huésped</h3>
                <p><strong>Nombre:</strong> ${reservation.guestName}</p>
                <p><strong>Email:</strong> ${reservation.guestEmail}</p>
                <p><strong>Teléfono:</strong> ${reservation.guestPhone}</p>
                <p><strong>Huéspedes:</strong> ${reservation.guests} persona${reservation.guests > 1 ? 's' : ''}</p>
              </div>
              
              <div class="dates">
                <div class="date-box">
                  <strong>Check-in</strong><br>
                  ${new Date(reservation.checkIn).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div class="date-box">
                  <strong>Check-out</strong><br>
                  ${new Date(reservation.checkOut).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              
              <p style="text-align: center;">
                <strong>${reservation.nights} noche${reservation.nights > 1 ? 's' : ''}</strong>
              </p>
              
              <div class="total">
                💰 Total: $${reservation.total.toLocaleString('es-AR')}
              </div>
              
              ${reservation.message ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>💬 Mensaje del huésped:</strong><br>
                  "${reservation.message}"
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/panel/reservas" class="button">
                  ✅ Confirmar Reserva
                </a>
                <a href="${process.env.FRONTEND_URL}/panel/reservas" class="button" style="background: #dc3545;">
                  ❌ Rechazar
                </a>
              </div>
              
              <div class="footer">
                <p>🏠 AlquiLibres - Alquilá sin intermediarios</p>
                <p style="font-size: 12px;">
                  Este email fue enviado automáticamente. 
                  Podés gestionar tus reservas desde tu <a href="${process.env.FRONTEND_URL}/panel">panel</a>.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log('✅ Email enviado a propietario:', ownerEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};

/**
 * Envía email al huésped confirmando la reserva
 */
exports.sendReservationConfirmedEmail = async (guestEmail, reservation) => {
  try {
    const msg = {
      to: guestEmail,
      from: FROM_EMAIL,
      subject: `✅ Reserva Confirmada - ${reservation.property.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .property { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .dates { display: flex; justify-content: space-between; margin: 15px 0; }
            .date-box { flex: 1; text-align: center; padding: 15px; background: #d4edda; border-radius: 8px; margin: 0 5px; }
            .total { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; text-align: center; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Reserva Confirmada!</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${reservation.guestName}</strong>,</p>
              <p>¡Excelente noticia! Tu reserva ha sido confirmada por el anfitrión.</p>
              
              <div class="property">
                <h2 style="margin-top: 0;">🏠 ${reservation.property.title}</h2>
                <p style="color: #666; margin: 5px 0;">${reservation.property.city}</p>
              </div>
              
              <div class="dates">
                <div class="date-box">
                  <strong>Check-in</strong><br>
                  ${new Date(reservation.checkIn).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                <div class="date-box">
                  <strong>Check-out</strong><br>
                  ${new Date(reservation.checkOut).toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
              </div>
              
              <div class="total">
                💰 Total: $${reservation.total.toLocaleString('es-AR')}
              </div>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📞 Contacto del Anfitrión</h3>
                <p><strong>Nombre:</strong> ${reservation.ownerName || 'No disponible'}</p>
                <p><strong>Teléfono:</strong> ${reservation.ownerPhone || 'No disponible'}</p>
                <p><strong>Email:</strong> ${reservation.ownerEmail || 'No disponible'}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/panel/mis-reservas" class="button">
                  Ver Mi Reserva
                </a>
              </div>
              
              <div class="footer">
                <p>🏠 AlquiLibres - Alquilá sin intermediarios</p>
                <p style="font-size: 12px;">
                  ¿Tenés dudas? Comunicate directamente con el anfitrión usando los datos de contacto.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log('✅ Email de confirmación enviado al huésped:', guestEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    throw error;
  }
};

/**
 * Envía email al huésped notificando rechazo de reserva
 */
exports.sendReservationRejectedEmail = async (guestEmail, reservation, reason) => {
  try {
    const msg = {
      to: guestEmail,
      from: FROM_EMAIL,
      subject: `❌ Reserva no disponible - ${reservation.property.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .property { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; text-align: center; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>😔 Lo sentimos</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${reservation.guestName}</strong>,</p>
              <p>Lamentablemente, el anfitrión no puede confirmar tu reserva en:</p>
              
              <div class="property">
                <h2 style="margin-top: 0;">🏠 ${reservation.property.title}</h2>
                <p style="color: #666; margin: 5px 0;">${reservation.property.city}</p>
              </div>
              
              ${reason ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Motivo:</strong><br>
                  ${reason}
                </div>
              ` : ''}
              
              <p>Te invitamos a buscar otras propiedades disponibles en nuestro catálogo.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/buscar" class="button">
                  Ver Otras Propiedades
                </a>
              </div>
              
              <div class="footer">
                <p>🏠 AlquiLibres - Alquilá sin intermediarios</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log('✅ Email de rechazo enviado al huésped:', guestEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de rechazo:', error);
    throw error;
  }
};
