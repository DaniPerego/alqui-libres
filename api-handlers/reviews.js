// api/reviews.js
//
// API-01 — reviews.
//   GET ?propertyId=      public: visible reviews of one property (AUTH-04).
//   GET ?owner=me         owner: all reviews of the caller's properties.
//   POST                  guest: rating 1..5; verified=false until the
//                         reservation completes (out of scope, WU3).
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method === 'GET') {
    const { page, limit } = parsePagination(req.query)
    const where = {}
    if (req.query.propertyId) {
      where.propertyId = req.query.propertyId
      where.visible = true // public listing: visible only
    } else if (req.query.owner === 'me') {
      const authed = await requireAuth(req, res)
      if (!authed) return
      where.property = { ownerId: req.auth.userId }
    } else {
      throw new HttpError('VALIDATION', 'Missing filter: propertyId or owner=me', 400)
    }
    const total = await prisma.review.count({ where })
    const rows = await prisma.review.findMany({
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
    const body = await readJsonBody(req)
    const { propertyId } = body
    const rating = Number(body.rating)
    if (!propertyId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new HttpError('VALIDATION', 'propertyId and integer rating 1..5 are required', 400)
    }
    const property = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!property || !property.isActive) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }
    if (property.ownerId === req.auth.userId) {
      throw new HttpError('VALIDATION', 'Cannot review your own property', 400)
    }
    const row = await prisma.review.create({
      data: {
        propertyId,
        ownerId: property.ownerId,
        guestId: req.auth.userId,
        guestName: req.auth.user.displayName || req.auth.user.email,
        rating,
        comment: body.comment !== undefined ? String(body.comment) : null,
        ratings: body.ratings !== undefined ? body.ratings : undefined,
        verified: false, // flipped once the reservation completes (WU3)
        visible: true,
      },
    })
    return res.status(201).json(row)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
