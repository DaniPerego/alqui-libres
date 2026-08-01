// api/subscriptions.js
//
// API-01 — subscription administration. The caller's own current
// subscription lives in api/subscriptions/mine.js (design route table).
//   GET admin: all subscriptions with ?status filter + pagination.
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth, requireRole } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  const { page, limit } = parsePagination(req.query)
  const where = {}
  if (req.query.status) where.status = req.query.status
  const total = await prisma.subscription.count({ where })
  const rows = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
})
