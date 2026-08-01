// api/notifications/[id].js
//
// API-04 — PATCH mark read (self only; other users' rows -> 404).
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing notification id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const notif = await prisma.notification.findUnique({ where: { id } })
  if (!notif || notif.userId !== req.auth.userId) {
    throw new HttpError('NOT_FOUND', 'Notification not found', 404)
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  })
  return res.status(200).json(updated)
})
