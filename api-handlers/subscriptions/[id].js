// api/subscriptions/[id].js
//
// SDD payment-api — PATCH /api/subscriptions/:id (authenticated).
// Self-scoped: only the subscription owner can transition their row; any
// other caller gets an opaque 404 (no enumeration). This batch implements
// the cancel transition the payment store needs (active|pending -> cancelled,
// autoRenew false, cancelledAt now). Plan changes and reactivation are in the
// spec but intentionally left for a later batch.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

// Transitions implemented in this batch. Only cancel is supported so far.
const TRANSITIONS = { cancelled: true }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing subscription id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const subscription = await prisma.subscription.findUnique({ where: { id } })
  if (!subscription || subscription.userId !== req.auth.userId) {
    throw new HttpError('NOT_FOUND', 'Subscription not found', 404)
  }

  const body = await readJsonBody(req)
  const target = body?.status
  if (!target || typeof target !== 'string') {
    throw new HttpError('VALIDATION', 'Missing required field: status', 400)
  }
  if (!TRANSITIONS[target]) {
    throw new HttpError('VALIDATION', `Invalid status transition: ${target}`, 400)
  }
  if (subscription.status === 'cancelled') {
    throw new HttpError('CONFLICT', 'Subscription is already cancelled', 409)
  }
  if (subscription.status !== 'active' && subscription.status !== 'pending') {
    throw new HttpError('CONFLICT', `Cannot cancel a ${subscription.status} subscription`, 409)
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: 'cancelled', autoRenew: false, cancelledAt: new Date() },
  })
  return res.status(200).json(updated)
})