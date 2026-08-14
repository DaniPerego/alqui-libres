// api/payments.js
//
// API-01 — GET payments.
//   user:  own payments only.
//   admin: all payments; ?mine=true scopes back to the admin's own.
//   Optional ?status filter + pagination. Rows are created by the payment
//   provider webhook (out of scope for WU2), so no POST here.
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const { page, limit } = parsePagination(req.query)
  const where = {}
  if (req.auth.role !== 'admin' || req.query.mine === 'true') {
    where.userId = req.auth.userId
  }
  if (req.query.status) where.status = req.query.status
  const total = await prisma.payment.count({ where })
  const rows = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
})
