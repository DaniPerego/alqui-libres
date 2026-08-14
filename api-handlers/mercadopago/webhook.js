// api/mercadopago/webhook.js
//
// SDD mercadopago-integration — POST /api/mercadopago/webhook (public IPN).
// MercadoPago sends one notification per payment; we fetch the payment, map
// its status onto our enums and reconcile the Subscription + Payment rows
// inside an idempotent transaction. Always answers 200 to stop retries.
//
// Security: when MP_CLIENT_SECRET is set, the HMAC-SHA256 signature is
// verified (x-signature + x-request-id headers) and invalid payloads get 401.
// Without the secret the handler warns and skips verification.
import { prisma } from '../lib/prisma.js'
import { asyncRoute, readJsonBody, sendJson } from '../lib/http.js'
import {
  getMercadoPagoPayment,
  mapMercadoPagoStatus,
  verifyMercadoPagoSignature,
} from '../lib/mercadopago.js'

export const config = { runtime: 'nodejs' }

const EXPIRY_DAYS = 30

// Resolves the notification topic and resource id from query params or body
// (MercadoPago sends both `?topic=payment&id=...` and `?type=payment&data.id=...`).
function parseNotification(req, body) {
  const topic = req.query?.topic || req.query?.type || body?.type || body?.topic
  const resourceId = req.query?.id || req.query?.['data.id'] || body?.data?.id || body?.id
  return { topic, resourceId }
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { received: false, error: 'Method not allowed' })
  }

  const body = await readJsonBody(req)
  const { topic, resourceId } = parseNotification(req, body)

  // Ignore non-payment notifications (merchant_orders, preapproval, ...).
  if (!topic || !resourceId || topic !== 'payment') {
    return sendJson(res, 200, { received: true, ignored: true })
  }

  const paymentId = String(resourceId)

  const signature = await verifyMercadoPagoSignature(req.headers, paymentId)
  if (signature.configured && !signature.valid) {
    console.error('[mercadopago webhook] invalid signature for payment', paymentId)
    return sendJson(res, 401, { error: 'Invalid signature' })
  }
  if (!signature.configured) {
    console.warn('[mercadopago webhook] MP_CLIENT_SECRET not configured, skipping signature verification')
  }

  let payment
  try {
    payment = await getMercadoPagoPayment(paymentId)
  } catch (err) {
    console.error('[mercadopago webhook] failed to fetch payment', paymentId, err)
    return sendJson(res, 500, { error: 'Failed to fetch payment' })
  }

  const subscriptionId = payment?.external_reference
    ? String(payment.external_reference)
    : ''
  if (!subscriptionId) {
    console.warn('[mercadopago webhook] payment without external_reference', paymentId)
    return sendJson(res, 200, { received: true, ignored: true })
  }

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
  if (!subscription) {
    console.warn('[mercadopago webhook] subscription not found for', subscriptionId)
    return sendJson(res, 200, { received: true, ignored: true })
  }

  const mapped = mapMercadoPagoStatus(payment?.status)
  const mpPaymentId = String(payment.id)

  // Idempotency: an approved webhook already applied to this subscription
  // must not touch the rows again (MercadoPago retries until 200).
  if (mapped.subscription === 'active' && subscription.status === 'active' && subscription.paymentId === mpPaymentId) {
    return sendJson(res, 200, { received: true })
  }

  await prisma.$transaction(async (tx) => {
    const subData = {
      status: mapped.subscription,
      paymentMethod: 'mercadopago',
      paymentId: mpPaymentId,
    }
    if (mapped.subscription === 'active') {
      const now = new Date()
      subData.lastPaymentDate = now
      subData.expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      subData.autoRenew = true
    }
    await tx.subscription.update({ where: { id: subscription.id }, data: subData })

    const paymentData = {
      paymentMethod: 'mercadopago',
      paymentId: mpPaymentId,
      status: mapped.payment,
      statusDetail: payment?.status_detail ?? payment?.statusDetail ?? null,
    }
    if (mapped.payment === 'approved') paymentData.paidAt = new Date()

    // Reuse the payment row created by the preference handler when possible:
    // first by MercadoPago payment id, then the latest pending row for the
    // subscription. Create a row only if neither exists.
    const existing =
      (await tx.payment.findFirst({ where: { paymentId: mpPaymentId } })) ||
      (await tx.payment.findFirst({
        where: { subscriptionId: subscription.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }))

    if (existing) {
      await tx.payment.update({ where: { id: existing.id }, data: paymentData })
    } else {
      await tx.payment.create({
        data: {
          userId: subscription.userId,
          userEmail: subscription.userEmail,
          subscriptionId: subscription.id,
          planId: subscription.planId,
          planName: subscription.planName,
          amount: subscription.planPrice,
          currency: 'ARS',
          ...paymentData,
        },
      })
    }
  })

  return sendJson(res, 200, { received: true })
})
