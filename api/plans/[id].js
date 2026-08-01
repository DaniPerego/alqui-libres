// api/plans/[id].js
//
// API-01 — admin plan management.
//   PATCH  upsert by fixed id (D9): updates the plan or creates it when the
//          id does not exist yet.
//   DELETE blocked with 409 when the plan still has subscriptions.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth, requireRole } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const EDITABLE = ['name', 'price', 'currency', 'interval', 'features', 'maxProperties', 'isActive', 'recommended', 'order']

export default asyncRoute(async (req, res) => {
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing plan id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  if (req.method === 'PATCH') {
    const body = await readJsonBody(req)
    const data = {}
    for (const key of EDITABLE) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.price !== undefined) {
      const price = Number(data.price)
      if (!Number.isFinite(price) || price < 0) {
        throw new HttpError('VALIDATION', 'price must be a non-negative number', 400)
      }
      data.price = price
    }
    if (data.maxProperties !== undefined) {
      const max = Number.parseInt(data.maxProperties, 10)
      if (!Number.isInteger(max) || max < -1) {
        throw new HttpError('VALIDATION', 'maxProperties must be an integer >= -1', 400)
      }
      data.maxProperties = max
    }
    const plan = await prisma.subscriptionPlan.upsert({ where: { id }, update: data, create: { id, ...data } })
    return res.status(200).json(plan)
  }

  if (req.method === 'DELETE') {
    const subscriptions = await prisma.subscription.count({ where: { planId: id } })
    if (subscriptions > 0) {
      throw new HttpError('CONFLICT', 'Plan has subscriptions and cannot be deleted', 409)
    }
    try {
      await prisma.subscriptionPlan.delete({ where: { id } })
    } catch {
      throw new HttpError('NOT_FOUND', 'Plan not found', 404)
    }
    return res.status(200).json({ deleted: true, id })
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
