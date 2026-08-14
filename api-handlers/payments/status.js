// api/payments/status.js
//
// SDD mercadopago-integration — GET /api/payments/status (authenticated).
// Returns the caller's current subscription (latest active/pending row) plus
// the latest payment row, so the payment-result view can poll for the
// checkout outcome without entering MercadoPago again. The derived `status`
// field is a convenience for the frontend:
//   'active'  -> the subscription is active (payment approved via webhook);
//   'pending' -> a checkout is still in flight;
//   'none'    -> the user has no active/pending subscription.
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

  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.auth.userId, status: { in: ['active', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  })
  const payment = await prisma.payment.findFirst({
    where: { userId: req.auth.userId },
    orderBy: { createdAt: 'desc' },
  })

  const status = subscription?.status === 'active' ? 'active' : subscription ? 'pending' : 'none'

  return res.status(200).json({ data: { subscription, payment, status } })
})
