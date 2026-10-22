// api/messages/[id].js
//
// API-01 — PATCH owner: mark a received message as read/replied and/or store
// the owner's text reply. Non-owners get 404 (the message must not be
// enumerable by other participants, guest or not).
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const STATUSES = new Set(['read', 'replied'])
const MAX_REPLY_LENGTH = 2000

function validateReply(reply) {
  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw new HttpError('VALIDATION', 'Reply must be a non-empty string', 400)
  }
  if (reply.length > MAX_REPLY_LENGTH) {
    throw new HttpError('VALIDATION', `Reply must not exceed ${MAX_REPLY_LENGTH} characters`, 400)
  }
  return reply.trim()
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing message id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const msg = await prisma.message.findUnique({ where: { id } })
  if (!msg || msg.ownerId !== req.auth.userId) {
    throw new HttpError('NOT_FOUND', 'Message not found', 404)
  }
  const body = await readJsonBody(req)
  const hasReply = body.reply !== undefined
  const reply = hasReply ? validateReply(body.reply) : undefined
  const status = body.status || 'read'
  if (!STATUSES.has(status)) {
    throw new HttpError('VALIDATION', 'Invalid status', 400)
  }
  const now = new Date()
  const data = { read: true, readAt: now, status: hasReply ? 'replied' : status }
  if (data.status === 'replied') data.repliedAt = now
  if (hasReply) data.reply = reply
  const updated = await prisma.message.update({ where: { id }, data })
  return res.status(200).json(updated)
})
