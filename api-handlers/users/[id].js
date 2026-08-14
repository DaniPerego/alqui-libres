// api/users/[id].js
//
// API-02 — admin user management. PATCH allows role, isActive, displayName
// and subscription (JSON) changes; role changes take effect on the next
// request (D7).
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth, requireRole } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const ROLES = ['guest', 'owner', 'admin']

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing user id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw new HttpError('NOT_FOUND', 'User not found', 404)

  const body = await readJsonBody(req)
  const data = {}
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      throw new HttpError('VALIDATION', 'Invalid role', 400)
    }
    data.role = body.role
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
  if (body.displayName !== undefined) data.displayName = String(body.displayName)
  if (body.subscription !== undefined) data.subscription = body.subscription

  const updated = await prisma.user.update({ where: { id }, data })
  return res.status(200).json(updated)
})
