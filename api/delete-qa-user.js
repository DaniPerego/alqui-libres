// api/delete-qa-user.js
//
// TEMPORARY maintenance endpoint (same pattern as the previous seed-once).
// Deletes one user and every dependent row that references it, because all
// relations in schema.prisma are required with the Prisma default
// onDelete: Restrict — a bare user delete would throw.
//
// Auth: admin JWT only (same verification as the rest of the API), plus an
// explicit `confirm: "DELETE"` in the body so a stray call cannot delete
// anything. DELETE THIS FILE after the cleanup run.
import { prisma } from '../api-handlers/lib/prisma.js'
import { asyncRoute, readJsonBody, sendJson, HttpError } from '../api-handlers/lib/http.js'
import { requireAuth, requireRole } from '../api-handlers/lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'POST') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }

  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  const body = await readJsonBody(req)
  const { email, confirm } = body || {}
  if (!email) {
    throw new HttpError('VALIDATION', 'email is required', 400)
  }
  if (confirm !== 'DELETE') {
    throw new HttpError('VALIDATION', 'confirm must be "DELETE"', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendJson(res, 200, { deleted: false, message: 'User not found', email })
  }

  // Interactive transaction, strictly sequential: Prisma does not run
  // parallel operations on one tx handle safely.
  const counts = await prisma.$transaction(async (tx) => {
    const out = {}
    const run = async (label, fn) => {
      out[label] = (await fn()).count
    }
    await run('notifications', () => tx.notification.deleteMany({ where: { userId: user.id } }))
    await run('payments', () => tx.payment.deleteMany({ where: { userId: user.id } }))
    await run('subscriptions', () => tx.subscription.deleteMany({ where: { userId: user.id } }))
    await run('reviews', () => tx.review.deleteMany({ where: { OR: [{ ownerId: user.id }, { guestId: user.id }] } }))
    await run('messages', () => tx.message.deleteMany({ where: { OR: [{ ownerId: user.id }, { guestId: user.id }] } }))
    await run('reservations', () => tx.reservation.deleteMany({ where: { OR: [{ ownerId: user.id }, { guestId: user.id }] } }))
    await run('properties', () => tx.property.deleteMany({ where: { ownerId: user.id } }))
    await tx.user.delete({ where: { id: user.id } })
    out.user = 1
    return out
  })

  return sendJson(res, 200, {
    deleted: true,
    email: user.email,
    userId: user.id,
    counts: Object.fromEntries(counts.map((c) => [c.label, c.count])),
  })
})
