// api/subscriptions/[id].js
//
// SDD payment-api — PATCH /api/subscriptions/:id (authenticated).
// Self-scoped: only the subscription owner can transition their row; any
// other caller gets an opaque 404 (no enumeration).
//
// Supported transitions:
//   cancelled   — active|pending -> cancelled (autoRenew false, cancelledAt now).
//   plan_change — active|pending -> pending on a NEW plan; the row is reset so
//                 a fresh MercadoPago preference (created later by the checkout
//                 flow) reactivates it. This transition only resets state and
//                 records a new pending Payment — it does NOT create the
//                 preference. The frontend calls POST /api/mercadopago/preference
//                 on checkout, which reuses this pending row via
//                 external_reference = subscription.id.
//   reactivate  — cancelled -> pending on the SAME plan; clears preferenceId
//                 and creates a new pending Payment. The frontend then routes
//                 to checkout to complete the MercadoPago payment.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

// Transitions implemented in this batch: cancel + plan change + reactivate.
const TRANSITIONS = { cancelled: true, plan_change: true, reactivate: true }

// Both transitions only run on a live subscription; cancelled/expired rows are
// immutable (409) — except reactivate, which only runs on cancelled rows.
function assertChangeable(subscription, target) {
  if (target === 'reactivate') {
    // Reactivate is only allowed on cancelled subscriptions.
    if (subscription.status !== 'cancelled') {
      throw new HttpError('CONFLICT', `Cannot reactivate a ${subscription.status} subscription`, 409)
    }
    return
  }
  if (subscription.status === 'cancelled') {
    throw new HttpError('CONFLICT', 'Subscription is already cancelled', 409)
  }
  if (subscription.status !== 'active' && subscription.status !== 'pending') {
    throw new HttpError('CONFLICT', `Cannot change a ${subscription.status} subscription`, 409)
  }
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'PATCH') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing subscription id', 400)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const subscription = await prisma.subscription.findUnique({ where: { id } })
  if (!subscription || subscription.userId !== req.auth.userId) {
    throw new HttpError('NOT_FOUND', 'Subscription not found', 404)
  }

  const body = await readJsonBody(req)
  const target = body?.status
  if (!target || typeof target !== 'string') {
    throw new HttpError('VALIDATION', 'Missing required field: status', 400)
  }
  if (!TRANSITIONS[target]) {
    throw new HttpError('VALIDATION', `Invalid status transition: ${target}`, 400)
  }
  assertChangeable(subscription, target)

  if (target === 'reactivate') {
    // Reactivate a cancelled subscription: reset to pending on the SAME plan,
    // clear the old preference id, and create a new pending Payment row.
    // The frontend then routes to checkout to complete the MercadoPago payment.
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: {
          status: 'pending',
          preferenceId: null,
          cancelledAt: null,
        },
      })
      await tx.payment.create({
        data: {
          userId: subscription.userId,
          userEmail: subscription.userEmail,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          planName: subscription.planName,
          amount: subscription.planPrice,
          currency: 'ARS',
          paymentMethod: 'mercadopago',
          status: 'pending',
          externalReference: subscription.id,
        },
      })
      return sub
    })
    return res.status(200).json(updated)
  }

  if (target === 'plan_change') {
    const planId = body?.planId
    if (!planId || typeof planId !== 'string') {
      throw new HttpError('VALIDATION', 'Missing required field: planId', 400)
    }
    if (planId === subscription.planId) {
      throw new HttpError('CONFLICT', 'Subscription is already on this plan', 409)
    }
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      throw new HttpError('NOT_FOUND', 'Subscription plan not found', 404)
    }

    // Reset the subscription to pending on the new plan and clear the old
    // preference id (the previous preference must not be reused). A fresh
    // Payment row records this attempt. The MercadoPago preference itself is
    // created later by POST /api/mercadopago/preference, which reuses this
    // pending row (external_reference = subscription.id), so no preference is
    // created here.
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: {
          planId,
          planName: plan.name,
          planPrice: Number(plan.price),
          status: 'pending',
          preferenceId: null,
        },
      })
      await tx.payment.create({
        data: {
          userId: subscription.userId,
          userEmail: subscription.userEmail,
          subscriptionId: subscription.id,
          planId,
          planName: plan.name,
          amount: Number(plan.price),
          currency: plan.currency || 'ARS',
          paymentMethod: 'mercadopago',
          status: 'pending',
          externalReference: subscription.id,
        },
      })
      return sub
    })
    return res.status(200).json(updated)
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: 'cancelled', autoRenew: false, cancelledAt: new Date() },
  })
  return res.status(200).json(updated)
})