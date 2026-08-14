// api/lib/mercadopago.js
//
// MercadoPago SDK wiring shared by the preference and webhook handlers
// (SDD mercadopago-integration). The access token is read ONLY from the
// server environment (MP_ACCESS_TOKEN); VITE_ variables are bundled into the
// public client and must NEVER appear here, otherwise the token would leak
// into the browser bundle.
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

let mpClient = null

// Returns a cached MercadoPagoConfig bound to the given token (or the server
// env token). Caching avoids rebuilding the client on warm instances.
export function getMercadoPagoClient(accessToken) {
  const token = accessToken || process.env.MP_ACCESS_TOKEN
  if (!token) {
    const err = new Error('MP_ACCESS_TOKEN is not configured on the server')
    err.code = 'MP_CONFIG_MISSING'
    throw err
  }
  if (!mpClient || mpClient.accessToken !== token) {
    mpClient = new MercadoPagoConfig({ accessToken: token, options: { timeout: 5000 } })
  }
  return mpClient
}

// Public base URL used for back_urls and the webhook notification_url. Falls
// back to the local Vite dev server when neither env var is present.
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5173'
}

// Creates a one-time payment preference. Each subscription cycle gets a fresh
// preference; the Subscription row id is used as external_reference so the
// webhook resolves the subscription directly.
export async function createMercadoPagoPreference({ plan, subscriptionId, userId, backUrls, notificationUrl }) {
  const client = getMercadoPagoClient()
  const preference = new Preference(client)
  const response = await preference.create({
    body: {
      items: [
        {
          title: `Plan ${plan.name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: plan.currency || 'ARS',
        },
      ],
      back_urls: backUrls,
      notification_url: notificationUrl,
      external_reference: subscriptionId,
      statement_descriptor: 'ALQUILIBRES',
      metadata: { subscriptionId, planId: plan.id, userId },
    },
  })
  return response
}

// Fetches a payment from MercadoPago by its id (IPN resource id).
export async function getMercadoPagoPayment(id) {
  const client = getMercadoPagoClient()
  const payment = new Payment(client)
  return payment.get({ id: Number(id) })
}

// Maps a MercadoPago payment status to our PaymentStatus and
// SubscriptionStatus enums (schema). Failed states keep the subscription in
// 'pending' so the user can retry the checkout; approved activates it.
export function mapMercadoPagoStatus(status) {
  switch (status) {
    case 'approved':
      return { payment: 'approved', subscription: 'active' }
    case 'rejected':
    case 'charged_back':
      return { payment: 'rejected', subscription: 'pending' }
    case 'cancelled':
      return { payment: 'cancelled', subscription: 'pending' }
    case 'refunded':
      return { payment: 'refunded', subscription: 'pending' }
    default:
      return { payment: 'pending', subscription: 'pending' }
  }
}

// Verifies the HMAC-SHA256 webhook signature when MP_CLIENT_SECRET is
// configured (header format: x-signature "ts=...&v1=..." from MercadoPago).
// Returns { configured:false } when no secret is set (verification skipped,
// caller warns) or { configured:true, valid } otherwise.
export async function verifyMercadoPagoSignature(headers, paymentId) {
  const clientSecret = process.env.MP_CLIENT_SECRET
  if (!clientSecret) return { configured: false, valid: false }

  const pick = (key) => {
    const value = headers?.[key] ?? headers?.[key.toLowerCase()]
    return Array.isArray(value) ? value[0] : value
  }
  const xSignature = pick('x-signature') || ''
  const xRequestId = pick('x-request-id') || ''

  const tsMatch = xSignature.match(/ts=(\d+)/)
  const v1Match = xSignature.match(/v1=([a-f0-9]+)/)
  if (!tsMatch || !v1Match || !xRequestId || !paymentId) {
    return { configured: true, valid: false }
  }

  const ts = tsMatch[1]
  const receivedSignature = v1Match[1]
  const signingMessage = `id:${paymentId};request-id:${xRequestId};ts:${ts};`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signingMessage))
  const hashArray = Array.from(new Uint8Array(signatureBytes))
  const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return { configured: true, valid: expectedSignature === receivedSignature }
}
