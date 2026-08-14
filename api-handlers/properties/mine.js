// api/properties/mine.js
//
// API-02 — owner listing: own properties with any status (the public list
// only exposes active properties). Optional status filter + pagination.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, parsePagination, buildMeta } from '../lib/http.js'
import { requireAuth, requireRole } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const STATUSES = ['pending', 'active', 'inactive', 'rejected']

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('owner')(req, res)
  if (!roleOk) return

  const { page, limit } = parsePagination(req.query)
  const where = { ownerId: req.auth.userId }
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) {
      throw new HttpError('VALIDATION', 'Invalid status', 400)
    }
    where.status = req.query.status
  }
  const total = await prisma.property.count({ where })
  const rows = await prisma.property.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
})
