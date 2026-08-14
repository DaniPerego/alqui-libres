// api/notifications.js
//
// API-04 — notification inbox, self only (rows are created as side effects
// of reservation create/confirm/reject, never via this endpoint).
//   GET ?read=true|false&type=&page=  user.
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
  const where = { userId: req.auth.userId }
  if (req.query.read === 'true') where.read = true
  else if (req.query.read === 'false') where.read = false
  if (req.query.type) where.type = req.query.type
  const total = await prisma.notification.count({ where })
  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
})
