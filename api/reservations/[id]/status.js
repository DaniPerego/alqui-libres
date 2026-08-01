// api/reservations/[id]/status.js
//
// API-04 / D6 — reservation status transitions via PATCH /status.
//   Map: pending -> confirmed/rejected/cancelled, confirmed -> cancelled.
//   Owner confirms/rejects/cancels; guest cancels. Invalid transition -> 409;
//   valid transition with the wrong role -> 403. confirm/reject insert a
//   notification row for the guest; cancel is silent (no row).
import { prisma } from '../../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../../lib/http.js'
import { requireAuth } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled']

// Allowed transitions (D6). Keys: current status -> target status -> roles
// allowed to perform that transition.
export const RESERVATION_TRANSITIONS = {
  pending: {
    confirmed: { roles: ['owner'] },
    rejected: { roles: ['owner'] },
    cancelled: { roles: ['owner', 'guest'] },
  },
  confirmed: {
    cancelled: { roles: ['owner', 'guest'] },
  },
}

// Pure transition resolution; the handler maps INVALID -> 409 and
// FORBIDDEN -> 403.
export function resolveTransition(currentStatus, targetStatus, role) {
  const allowed = RESERVATION_TRANSITIONS[currentStatus]?.[targetStatus]
  if (!allowed) return { ok: false, code: 'INVALID' }
  if (!allowed.roles.includes(role)) return { ok: false, code: 'FORBIDDEN' }
  return { ok: true }
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing reservation id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) throw new HttpError('NOT_FOUND', 'Reservation not found', 404)
  const isParticipant = reservation.ownerId === req.auth.userId || reservation.guestId === req.auth.userId
  if (!isParticipant) {
    throw new HttpError('NOT_FOUND', 'Reservation not found', 404)
  }

  const body = await readJsonBody(req)
  const target = body.status
  if (!target) {
    throw new HttpError('VALIDATION', 'Missing required field: status', 400)
  }
  if (!STATUSES.includes(target)) {
    throw new HttpError('VALIDATION', `Invalid status: ${target}`, 400)
  }

  const result = resolveTransition(reservation.status, target, req.auth.role)
  if (result.code === 'INVALID') {
    throw new HttpError('CONFLICT', `Cannot transition reservation from ${reservation.status} to ${target}`, 409)
  }
  if (result.code === 'FORBIDDEN') {
    throw new HttpError('FORBIDDEN', 'Your role cannot perform this transition', 403)
  }

  const data = { status: target }
  if (target === 'confirmed') data.confirmedAt = new Date()
  if (target === 'rejected') {
    data.rejectedAt = new Date()
    data.rejectionReason = body.reason ?? null
  }
  if (target === 'cancelled') {
    data.cancelledAt = new Date()
    data.cancelledBy = req.auth.role
  }

  const updated = await prisma.reservation.update({ where: { id }, data })

  // API-04: confirm/reject notify the guest; cancel creates NO row.
  if (target === 'confirmed' || target === 'rejected') {
    await prisma.notification.create({
      data: {
        userId: reservation.guestId,
        type: 'reservation',
        title: target === 'confirmed' ? 'Reserva confirmada' : 'Reserva rechazada',
        body: target === 'confirmed'
          ? 'Tu reserva fue confirmada por el propietario'
          : 'Tu reserva fue rechazada por el propietario',
        data: { propertyId: reservation.propertyId, reservationId: reservation.id, actionUrl: '/guest/reservations' },
        priority: 'normal',
      },
    })
  }

  return res.status(200).json(updated)
})
