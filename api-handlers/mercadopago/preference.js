// api/mercadopago/preference.js
//
// SDD mercadopago-integration — POST /api/mercadopago/preference.
// Authenticated. Creates a pending Subscription + Payment row and a fresh
// MercadoPago preference for the requested plan, then returns the checkout
// URLs. The access token is read server-side only (process.env.MP_ACCESS_TOKEN).
//
// Decisions:
//   - external_reference = Subscription.id (unique, resolves straight to the
//     row in the webhook).
//   - An existing ACTIVE subscription for the same plan -> 409 CONFLICT (the
//     user must cancel before re-subscribing).
//   - An existing PENDING subscription is REUSED (no duplicate rows); every
//     attempt still creates a new Payment row so per-attempt history survives.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, sendJson } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'
import { createMercadoPagoPreference, getBaseUrl } from '../lib/mercadopago.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'POST') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const authed = await requireAuth(req, res)
  if (!authed) return

  const body = await readJsonBody(req)
  const planId = body?.planId
  if (!planId || typeof planId !== 'string') {
    throw new HttpError('VALIDATION', 'Missing required field: planId', 400)
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) {
    throw new HttpError('NOT_FOUND', 'Subscription plan not found', 404)
  }

  const now = new Date()
  const { subscription, payment } = await prisma.$transaction(async (tx) => {
    const active = await tx.subscription.findFirst({
      where: { userId: req.auth.userId, planId, status: 'active' },
    })
    if (active) {
      throw new HttpError('CONFLICT', 'An active subscription already exists for this plan', 409)
    }

    // Reuse the most recent pending attempt for this plan, if any.
    let sub = await tx.subscription.findFirst({
      where: { userId: req.auth.userId, planId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })
    if (!sub) {
      sub = await tx.subscription.create({
        data: {
          id: crypto.randomUUID(),
          userId: req.auth.userId,
          userEmail: req.auth.user.email,
          planId: plan.id,
          planName: plan.name,
          planPrice: Number(plan.price),
          status: 'pending',
          startedAt: now,
          autoRenew: true,
          paymentMethod: 'mercadopago',
        },
      })
    }

    const pay = await tx.payment.create({
      data: {
        userId: req.auth.userId,
        userEmail: req.auth.user.email,
        subscriptionId: sub.id,
        planId: plan.id,
        planName: plan.name,
        amount: Number(plan.price),
        currency: plan.currency || 'ARS',
        paymentMethod: 'mercadopago',
        status: 'pending',
        externalReference: sub.id,
      },
    })

    return { subscription: sub, payment: pay }
  })

  const baseUrl = getBaseUrl()
  let preference
  try {
    preference = await createMercadoPagoPreference({
      plan,
      subscriptionId: subscription.id,
      userId: req.auth.userId,
      backUrls: {
        success: `${baseUrl}/panel/payment-result?status=success`,
        failure: `${baseUrl}/panel/payment-result?status=failure`,
        pending: `${baseUrl}/panel/payment-result?status=pending`,
      },
      notificationUrl: `${baseUrl}/api/mercadopago/webhook`,
    })
  } catch (err) {
    // Server credentials missing -> clear 503 (the frontend already has a
    // demo-mode fallback for this case).
    if (err.code === 'MP_CONFIG_MISSING') {
      throw new HttpError('INTERNAL', 'MercadoPago server credentials are not configured', 503)
    }
    throw err
  }

  const preferenceId = String(preference.id)

  // Persist the preference id on both rows. Kept outside the create
  // transaction because it depends on the MP network call.
  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: subscription.id }, data: { preferenceId } })
    await tx.payment.update({ where: { id: payment.id }, data: { preferenceId } })
  })

  return sendJson(res, 200, {
    id: preferenceId,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    external_reference: subscription.id,
  })
})
