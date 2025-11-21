const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Servicios de notificaciones
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ============================================
// FUNCIÓN HTTP: Crear Nueva Reserva
// ============================================
exports.createReservation = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
      const reservationData = req.body;

      // Validaciones básicas
      if (!reservationData.propertyId || !reservationData.guestId || 
          !reservationData.checkIn || !reservationData.checkOut) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos',
          required: ['propertyId', 'guestId', 'checkIn', 'checkOut']
        });
      }

      // Verificar que las fechas sean válidas
      const checkIn = new Date(reservationData.checkIn);
      const checkOut = new Date(reservationData.checkOut);
      
      if (checkOut <= checkIn) {
        return res.status(400).json({ 
          error: 'La fecha de salida debe ser posterior a la fecha de entrada'
        });
      }

      // Verificar disponibilidad (opcional)
      const existingReservations = await db.collection('reservations')
        .where('propertyId', '==', reservationData.propertyId)
        .where('status', 'in', ['pending', 'confirmed'])
        .get();

      for (const doc of existingReservations.docs) {
        const existing = doc.data();
        const existingCheckIn = new Date(existing.checkIn);
        const existingCheckOut = new Date(existing.checkOut);

        // Verificar si hay solapamiento de fechas
        if (checkIn < existingCheckOut && checkOut > existingCheckIn) {
          return res.status(409).json({ 
            error: 'La propiedad no está disponible en las fechas seleccionadas'
          });
        }
      }

      // Crear la reserva con estado 'pending'
      const reservation = {
        ...reservationData,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('reservations').add(reservation);
      
      // Obtener la reserva con el ID generado
      const createdReservation = {
        id: docRef.id,
        ...reservation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Reserva creada:', docRef.id);

      // Responder inmediatamente al cliente
      res.status(201).json({
        success: true,
        reservation: createdReservation
      });

      // Enviar notificaciones de forma asíncrona (no bloquea la respuesta)
      sendNewReservationNotifications(createdReservation).catch(error => {
        console.error('Error enviando notificaciones:', error);
      });

    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      res.status(500).json({ 
        error: 'Error al crear la reserva',
        details: error.message 
      });
    }
  });
});

// ============================================
// FUNCIÓN HTTP: Confirmar Reserva
// ============================================
exports.confirmReservation = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
      const { reservationId, ownerId } = req.body;

      if (!reservationId) {
        return res.status(400).json({ error: 'reservationId es requerido' });
      }

      // Obtener la reserva
      const reservationRef = db.collection('reservations').doc(reservationId);
      const doc = await reservationRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const reservation = { id: doc.id, ...doc.data() };

      // Verificar que el propietario sea el dueño de la propiedad
      if (ownerId && reservation.ownerId !== ownerId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Actualizar estado
      await reservationRef.update({
        status: 'confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedReservation = {
        ...reservation,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Reserva confirmada:', reservationId);

      res.status(200).json({
        success: true,
        reservation: updatedReservation
      });

      // Enviar notificaciones al huésped
      sendConfirmationNotifications(updatedReservation).catch(error => {
        console.error('Error enviando notificaciones de confirmación:', error);
      });

    } catch (error) {
      console.error('❌ Error confirmando reserva:', error);
      res.status(500).json({ 
        error: 'Error al confirmar la reserva',
        details: error.message 
      });
    }
  });
});

// ============================================
// FUNCIÓN HTTP: Rechazar Reserva
// ============================================
exports.rejectReservation = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
      const { reservationId, ownerId, reason } = req.body;

      if (!reservationId) {
        return res.status(400).json({ error: 'reservationId es requerido' });
      }

      // Obtener la reserva
      const reservationRef = db.collection('reservations').doc(reservationId);
      const doc = await reservationRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const reservation = { id: doc.id, ...doc.data() };

      // Verificar que el propietario sea el dueño de la propiedad
      if (ownerId && reservation.ownerId !== ownerId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Actualizar estado
      await reservationRef.update({
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: reason || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedReservation = {
        ...reservation,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || '',
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Reserva rechazada:', reservationId);

      res.status(200).json({
        success: true,
        reservation: updatedReservation
      });

      // Enviar notificaciones al huésped
      sendRejectionNotifications(updatedReservation, reason).catch(error => {
        console.error('Error enviando notificaciones de rechazo:', error);
      });

    } catch (error) {
      console.error('❌ Error rechazando reserva:', error);
      res.status(500).json({ 
        error: 'Error al rechazar la reserva',
        details: error.message 
      });
    }
  });
});

// ============================================
// FUNCIÓN HTTP: Cancelar Reserva
// ============================================
exports.cancelReservation = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
      const { reservationId, userId, userType } = req.body;

      if (!reservationId || !userId || !userType) {
        return res.status(400).json({ 
          error: 'reservationId, userId y userType son requeridos' 
        });
      }

      // Obtener la reserva
      const reservationRef = db.collection('reservations').doc(reservationId);
      const doc = await reservationRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const reservation = { id: doc.id, ...doc.data() };

      // Verificar autorización
      const isOwner = userType === 'owner' && reservation.ownerId === userId;
      const isGuest = userType === 'guest' && reservation.guestId === userId;

      if (!isOwner && !isGuest) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Actualizar estado
      await reservationRef.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: userType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Reserva cancelada:', reservationId, 'por', userType);

      res.status(200).json({
        success: true,
        message: 'Reserva cancelada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      res.status(500).json({ 
        error: 'Error al cancelar la reserva',
        details: error.message 
      });
    }
  });
});

// ============================================
// FUNCIÓN HTTP: Obtener Reservas del Propietario
// ============================================
exports.getOwnerReservations = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
      const ownerId = req.query.ownerId;
      const status = req.query.status; // optional: 'pending', 'confirmed', 'rejected', 'cancelled'

      if (!ownerId) {
        return res.status(400).json({ error: 'ownerId es requerido' });
      }

      let query = db.collection('reservations').where('ownerId', '==', ownerId);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();

      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.status(200).json({
        success: true,
        count: reservations.length,
        reservations
      });

    } catch (error) {
      console.error('❌ Error obteniendo reservas:', error);
      res.status(500).json({ 
        error: 'Error al obtener las reservas',
        details: error.message 
      });
    }
  });
});

// ============================================
// FUNCIONES AUXILIARES DE NOTIFICACIONES
// ============================================

/**
 * Envía notificaciones al propietario cuando se crea una nueva reserva
 */
async function sendNewReservationNotifications(reservation) {
  try {
    console.log('📧 Enviando notificaciones de nueva reserva...');

    const promises = [];

    // Enviar email si está configurado SendGrid
    if (process.env.SENDGRID_API_KEY && reservation.ownerEmail) {
      promises.push(
        emailService.sendNewReservationEmail(reservation.ownerEmail, reservation)
          .catch(err => console.error('Error en email:', err))
      );
    }

    // Enviar WhatsApp si está configurado Twilio
    if (process.env.TWILIO_ACCOUNT_SID && reservation.ownerPhone) {
      promises.push(
        whatsappService.sendNewReservationWhatsApp(reservation.ownerPhone, reservation)
          .catch(err => console.error('Error en WhatsApp:', err))
      );
    }

    await Promise.allSettled(promises);
    console.log('✅ Notificaciones enviadas');
  } catch (error) {
    console.error('❌ Error en notificaciones:', error);
  }
}

/**
 * Envía notificaciones al huésped cuando se confirma la reserva
 */
async function sendConfirmationNotifications(reservation) {
  try {
    console.log('📧 Enviando notificaciones de confirmación...');

    const promises = [];

    // Enviar email
    if (process.env.SENDGRID_API_KEY && reservation.guestEmail) {
      promises.push(
        emailService.sendReservationConfirmedEmail(reservation.guestEmail, reservation)
          .catch(err => console.error('Error en email de confirmación:', err))
      );
    }

    // Enviar WhatsApp
    if (process.env.TWILIO_ACCOUNT_SID && reservation.guestPhone) {
      promises.push(
        whatsappService.sendReservationConfirmedWhatsApp(reservation.guestPhone, reservation)
          .catch(err => console.error('Error en WhatsApp de confirmación:', err))
      );
    }

    await Promise.allSettled(promises);
    console.log('✅ Notificaciones de confirmación enviadas');
  } catch (error) {
    console.error('❌ Error en notificaciones de confirmación:', error);
  }
}

/**
 * Envía notificaciones al huésped cuando se rechaza la reserva
 */
async function sendRejectionNotifications(reservation, reason) {
  try {
    console.log('📧 Enviando notificaciones de rechazo...');

    const promises = [];

    // Enviar email
    if (process.env.SENDGRID_API_KEY && reservation.guestEmail) {
      promises.push(
        emailService.sendReservationRejectedEmail(reservation.guestEmail, reservation, reason)
          .catch(err => console.error('Error en email de rechazo:', err))
      );
    }

    // Enviar WhatsApp
    if (process.env.TWILIO_ACCOUNT_SID && reservation.guestPhone) {
      promises.push(
        whatsappService.sendReservationRejectedWhatsApp(reservation.guestPhone, reservation, reason)
          .catch(err => console.error('Error en WhatsApp de rechazo:', err))
      );
    }

    await Promise.allSettled(promises);
    console.log('✅ Notificaciones de rechazo enviadas');
  } catch (error) {
    console.error('❌ Error en notificaciones de rechazo:', error);
  }
}

// ============================================
// FUNCIÓN TRIGGER: Cuando se crea una reserva en Firestore
// (Alternativa a la HTTP function)
// ============================================
exports.onReservationCreated = functions.firestore
  .document('reservations/{reservationId}')
  .onCreate(async (snap, context) => {
    const reservation = { id: snap.id, ...snap.data() };
    
    console.log('🔔 Nueva reserva creada:', reservation.id);
    
    // Enviar notificaciones
    await sendNewReservationNotifications(reservation);
  });

// ============================================
// FUNCIÓN TRIGGER: Cuando se actualiza una reserva
// ============================================
exports.onReservationUpdated = functions.firestore
  .document('reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = { id: change.after.id, ...change.after.data() };
    
    // Si cambió a 'confirmed'
    if (before.status !== 'confirmed' && after.status === 'confirmed') {
      console.log('🔔 Reserva confirmada:', after.id);
      await sendConfirmationNotifications(after);
    }
    
    // Si cambió a 'rejected'
    if (before.status !== 'rejected' && after.status === 'rejected') {
      console.log('🔔 Reserva rechazada:', after.id);
      await sendRejectionNotifications(after, after.rejectionReason);
    }
  });
