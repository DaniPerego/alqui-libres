// api/reservations/[id].js
//
// API-02 — reservation detail. Only participants (owner or guest) or an
// admin may read a reservation; everyone else gets 404 so other people's
// reservations are not discoverable.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
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
  const isAdmin = req.auth.role === 'admin'
  if (!isParticipant && !isAdmin) {
    throw new HttpError('NOT_FOUND', 'Reservation not found', 404)
  }
  return res.status(200).json(reservation)
})
