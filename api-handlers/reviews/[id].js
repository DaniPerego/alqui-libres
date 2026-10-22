// api/reviews/[id].js
//
// API-01 — PATCH owner/admin: respond to a review of the owner's property.
// Only the owner of the reviewed property or an admin may set the response.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const MAX_RESPONSE_LENGTH = 2000

function validateResponse(response) {
  if (typeof response !== 'string' || response.trim().length === 0) {
    throw new HttpError('VALIDATION', 'Response must be a non-empty string', 400)
  }
  if (response.length > MAX_RESPONSE_LENGTH) {
    throw new HttpError('VALIDATION', `Response must not exceed ${MAX_RESPONSE_LENGTH} characters`, 400)
  }
  return response.trim()
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing review id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const review = await prisma.review.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true } } },
  })
  if (!review) {
    throw new HttpError('NOT_FOUND', 'Review not found', 404)
  }
  const isAdmin = req.auth.role === 'admin'
  const isOwner = review.property?.ownerId === req.auth.userId
  if (!isAdmin && !isOwner) {
    throw new HttpError('FORBIDDEN', 'Not authorized to respond to this review', 403)
  }

  const body = await readJsonBody(req)
  const response = validateResponse(body.response)
  const now = new Date()
  const updated = await prisma.review.update({
    where: { id },
    data: {
      ownerResponse: response,
      ownerRespondedAt: now,
      updatedAt: now,
    },
  })
  return res.status(200).json(updated)
})
