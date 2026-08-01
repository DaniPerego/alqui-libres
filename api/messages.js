// api/messages.js
//
// API-01, AUTH-04 — contact-owner inbox.
//   GET  user: messages where the caller is a participant (ownerId or
//        guestId = token sub); optional ?read=true|false + pagination.
//   POST guest: contact owner (AUTH-04); creates an unread row for the
//        owner. Notifications for messages ride on the unread flag (API-04
//        only mandates rows for reservation create/confirm/reject).
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

function parseOptionalDate(value, field) {
  if (value === undefined || value === null) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new HttpError('VALIDATION', `Invalid date: ${field}`, 400)
  }
  return d
}

export default asyncRoute(async (req, res) => {
  const authed = await requireAuth(req, res)
  if (!authed) return

  if (req.method === 'GET') {
    const { page, limit } = parsePagination(req.query)
    const where = {
      OR: [{ ownerId: req.auth.userId }, { guestId: req.auth.userId }],
    }
    if (req.query.read === 'true') where.read = true
    else if (req.query.read === 'false') where.read = false
    if (req.query.propertyId) where.propertyId = req.query.propertyId
    const total = await prisma.message.count({ where })
    const rows = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req)
    const propertyId = body.propertyId
    const message = body.message
    if (!propertyId || !message || !String(message).trim()) {
      throw new HttpError('VALIDATION', 'Missing required fields: propertyId, message', 400)
    }
    const property = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!property || !property.isActive) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }
    if (property.ownerId === req.auth.userId) {
      throw new HttpError('VALIDATION', 'Cannot message your own property', 400)
    }
    const row = await prisma.message.create({
      data: {
        ownerId: property.ownerId,
        guestId: req.auth.userId,
        propertyId,
        propertyTitle: property.title,
        guestName: req.auth.user.displayName || req.auth.user.email,
        guestEmail: req.auth.user.email,
        message,
        checkIn: parseOptionalDate(body.checkIn, 'checkIn'),
        checkOut: parseOptionalDate(body.checkOut, 'checkOut'),
        guests: body.guests !== undefined ? Number(body.guests) : null,
        status: 'unread',
        read: false,
      },
    })
    return res.status(201).json(row)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
