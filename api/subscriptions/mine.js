// api/subscriptions/mine.js
//
// API-01 — GET the caller's current subscription (latest active/pending
// row; null when none). Subscription creation goes through the payment
// flow, which is out of scope for WU2.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return
  const current = await prisma.subscription.findFirst({
    where: { userId: req.auth.userId, status: { in: ['active', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  })
  return res.status(200).json({ data: current })
})
