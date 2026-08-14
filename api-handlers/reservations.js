// api/reservations.js
//
// API-01/02/04 — Reservation collection endpoint.
//   GET  authenticated: owner/guest see own reservations (owner, guest, or
//        both); admin sees all. Optional status filter + pagination.
//   POST guest: creates a reservation; guestId forced from the JWT subject;
//        overlap check -> 409; a notification row is inserted for the owner
//        (API-04: create notifies the owner).
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth, requireRole } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled']
const OVERLAP_STATUSES = ['pending', 'confirmed']
const DAY_MS = 86_400_000

function toDate(value, label) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError('VALIDATION', `Invalid ${label}`, 400)
  }
  return date
}

export default asyncRoute(async (req, res) => {
  if (req.method === 'GET') {
    const authed = await requireAuth(req, res)
    if (!authed) return
    const { page, limit } = parsePagination(req.query)
    const where = {}
    if (req.auth.role === 'admin' && !req.query.mine) {
      // admin sees all reservations
    } else if (req.query.mine === 'owner') {
      where.ownerId = req.auth.userId
    } else if (req.query.mine === 'guest') {
      where.guestId = req.auth.userId
    } else {
      where.OR = [{ ownerId: req.auth.userId }, { guestId: req.auth.userId }]
    }
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        throw new HttpError('VALIDATION', 'Invalid status', 400)
      }
      where.status = req.query.status
    }
    const total = await prisma.reservation.count({ where })
    const rows = await prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
  }

  if (req.method === 'POST') {
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('guest')(req, res)
    if (!roleOk) return
    const body = await readJsonBody(req)

    if (!body.propertyId) {
      throw new HttpError('VALIDATION', 'Missing required field: propertyId', 400)
    }
    const checkIn = toDate(body.checkIn, 'checkIn')
    const checkOut = toDate(body.checkOut, 'checkOut')
    if (checkOut <= checkIn) {
      throw new HttpError('VALIDATION', 'checkOut must be after checkIn', 400)
    }
    const guests = Number.parseInt(body.guests, 10)
    if (!Number.isInteger(guests) || guests < 1) {
      throw new HttpError('VALIDATION', 'guests must be a positive integer', 400)
    }

    const property = await prisma.property.findUnique({ where: { id: body.propertyId } })
    if (!property || !property.isActive) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }

    // Overlap check (API-04): same property, active reservation, intersecting
    // date ranges -> 409 CONFLICT.
    const overlapping = await prisma.reservation.findFirst({
      where: {
        propertyId: property.id,
        status: { in: OVERLAP_STATUSES },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    })
    if (overlapping) {
      throw new HttpError('CONFLICT', 'Property is already reserved for those dates', 409)
    }

    const nights = Math.max(1, Math.round((checkOut - checkIn) / DAY_MS))
    const basePrice = property.pricingBasePrice
    const cleaningFee = property.pricingCleaningFee ?? 0
    const reservation = await prisma.reservation.create({
      data: {
        propertyId: property.id,
        ownerId: property.ownerId,
        guestId: req.auth.userId, // forced from token subject
        property: { id: property.id, title: property.title, city: property.locationCity, image: property.mainImage ?? null },
        guestName: body.guestName || req.auth.user.displayName,
        guestEmail: body.guestEmail || req.auth.user.email,
        guestPhone: body.guestPhone || null,
        ownerName: property.ownerName,
        ownerEmail: property.ownerEmail,
        ownerPhone: property.ownerPhone || null,
        checkIn,
        checkOut,
        nights,
        guests,
        basePrice,
        cleaningFee,
        total: nights * basePrice + cleaningFee,
        message: body.message || null,
        status: 'pending',
      },
    })
    // API-04: creating a reservation inserts a notification row for the owner.
    await prisma.notification.create({
      data: {
        userId: reservation.ownerId,
        type: 'reservation',
        title: 'Nueva reserva',
        body: `${reservation.guestName} quiere reservar "${property.title}"`,
        data: { propertyId: property.id, reservationId: reservation.id, actionUrl: '/owner/reservations' },
        priority: 'normal',
      },
    })
    return res.status(201).json(reservation)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
