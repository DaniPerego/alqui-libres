// tests/integration/mercadopago-webhook.test.js
//
// Integration tests for POST /api/mercadopago/webhook (public IPN) with
// mocked Prisma and a mocked `mercadopago` SDK (SDD mercadopago-integration):
//   - non-payment topics -> 200 ignored,
//   - unknown external_reference -> 200 ignored,
//   - approved payment -> subscription active + payment approved,
//   - idempotency (repeated approved webhook does not touch rows),
//   - HMAC signature verification (invalid -> 401, valid -> processed).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'

const mocks = vi.hoisted(() => {
  const delegates = {}
  const models = ['user', 'property', 'reservation', 'message', 'review',
    'subscription', 'subscriptionPlan', 'platformSettings', 'payment', 'notification']
  for (const name of models) {
    delegates[name] = {
      findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn(),
      updateMany: vi.fn(), deleteMany: vi.fn(),
    }
  }
  const mp = {
    MercadoPagoConfig: class {},
    Preference: function MockPreference() { this.create = mp.preferenceCreate },
    preferenceCreate: vi.fn(),
    Payment: function MockPayment() { this.get = mp.paymentGet },
    paymentGet: vi.fn(),
  }
  return {
    delegates,
    mp,
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (callback) => callback(delegates)),
  }
})

vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client')
  return {
    ...actual,
    PrismaClient: class {
      constructor() {
        Object.assign(this, mocks.delegates)
        this.$queryRaw = mocks.$queryRaw
        this.$transaction = mocks.$transaction
      }
    },
  }
})
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: mocks.mp.MercadoPagoConfig,
  Preference: mocks.mp.Preference,
  Payment: mocks.mp.Payment,
}))

import webhookHandler from '../../api-handlers/mercadopago/webhook.js'

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

const SUB = {
  id: 'sub-1',
  userId: 'u-1',
  userEmail: 'user@test.com',
  planId: 'pro',
  planName: 'Plan Pro',
  planPrice: 24999,
  status: 'pending',
}

// Builds a valid x-signature header value for the given payment id, matching
// the handler's HMAC-SHA256 verification (id/request-id/ts; message format).
function validSignature({ paymentId, requestId = 'req-1', ts = '1700000000', secret = 'test-secret' }) {
  const message = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const hash = createHmac('sha256', secret).update(message).digest('hex')
  return { xSignature: `ts=${ts},v1=${hash}`, xRequestId: requestId }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MP_ACCESS_TOKEN = 'TEST-ACCESS-TOKEN'
  delete process.env.MP_CLIENT_SECRET
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.subscription.findUnique.mockResolvedValue(null)
  mocks.delegates.subscription.update.mockImplementation(async (args) => ({ id: 'sub-1', ...args.data }))
  mocks.delegates.payment.findFirst.mockResolvedValue(null)
  mocks.delegates.payment.create.mockImplementation(async (args) => ({ id: 'pay-created', ...args.data }))
  mocks.delegates.payment.update.mockImplementation(async (args) => ({ id: 'pay-existing', ...args.data }))
})

describe('POST /api/mercadopago/webhook', () => {
  it('topic que no es payment -> 200 ignored', async () => {
    const res = mockRes()
    await webhookHandler(
      { query: { type: 'merchant_order', 'data.id': '123' }, method: 'POST', headers: {}, body: {} },
      res,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true, ignored: true })
    expect(mocks.mp.paymentGet).not.toHaveBeenCalled()
  })

  it('sin topic o sin id -> 200 ignored', async () => {
    const res = mockRes()
    await webhookHandler({ query: {}, method: 'POST', headers: {}, body: {} }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true, ignored: true })
    expect(mocks.mp.paymentGet).not.toHaveBeenCalled()
  })

  it('external_reference desconocida -> 200 ignored sin tocar rows', async () => {
    mocks.mp.paymentGet.mockResolvedValue({ id: 123, status: 'approved', external_reference: 'unknown-sub' })
    const res = mockRes()
    await webhookHandler(
      { query: { topic: 'payment', id: '123' }, method: 'POST', headers: {}, body: {} },
      res,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true, ignored: true })
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
    expect(mocks.delegates.payment.create).not.toHaveBeenCalled()
  })

  it('approved -> subscription active + payment approved (crea Payment)', async () => {
    mocks.mp.paymentGet.mockResolvedValue({
      id: 123,
      status: 'approved',
      status_detail: 'accredited',
      external_reference: 'sub-1',
    })
    mocks.delegates.subscription.findUnique.mockResolvedValue(SUB)
    const res = mockRes()
    await webhookHandler(
      { query: { topic: 'payment', id: '123' }, method: 'POST', headers: {}, body: {} },
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })

    expect(mocks.delegates.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sub-1' },
      data: expect.objectContaining({
        status: 'active',
        paymentMethod: 'mercadopago',
        paymentId: '123',
        autoRenew: true,
        lastPaymentDate: expect.any(Date),
        expiresAt: expect.any(Date),
      }),
    }))

    // No pending/paymentId row found -> Payment created.
    expect(mocks.delegates.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'u-1',
        subscriptionId: 'sub-1',
        planId: 'pro',
        planName: 'Plan Pro',
        amount: 24999,
        currency: 'ARS',
        status: 'approved',
        paymentId: '123',
        paidAt: expect.any(Date),
      }),
    }))
  })

  it('idempotencia: webhook repetido del mismo pago no duplica', async () => {
    mocks.mp.paymentGet.mockResolvedValue({ id: 123, status: 'approved', external_reference: 'sub-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ ...SUB, status: 'active', paymentId: '123' })
    const res = mockRes()
    await webhookHandler(
      { query: { topic: 'payment', id: '123' }, method: 'POST', headers: {}, body: {} },
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
    expect(mocks.delegates.payment.create).not.toHaveBeenCalled()
    expect(mocks.delegates.payment.update).not.toHaveBeenCalled()
  })

  it('rejected -> subscription pending + payment rejected', async () => {
    mocks.mp.paymentGet.mockResolvedValue({
      id: 456,
      status: 'rejected',
      status_detail: 'cc_rejected_other_reason',
      external_reference: 'sub-1',
    })
    mocks.delegates.subscription.findUnique.mockResolvedValue(SUB)
    mocks.delegates.payment.findFirst.mockResolvedValue({ id: 'pay-existing', status: 'pending' })
    const res = mockRes()
    await webhookHandler(
      { query: { topic: 'payment', id: '456' }, method: 'POST', headers: {}, body: {} },
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'pending', paymentId: '456' }),
    }))
    expect(mocks.delegates.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'rejected', paymentId: '456' }),
    }))
    expect(mocks.delegates.payment.create).not.toHaveBeenCalled()
  })

  it('firma invalida con MP_CLIENT_SECRET -> 401', async () => {
    process.env.MP_CLIENT_SECRET = 'test-secret'
    const res = mockRes()
    await webhookHandler(
      {
        query: { topic: 'payment', id: '123' },
        method: 'POST',
        headers: { 'x-signature': 'ts=1700000000,v1=deadbeef', 'x-request-id': 'req-1' },
        body: {},
      },
      res,
    )
    expect(res.status).toHaveBeenCalledWith(401)
    expect(mocks.mp.paymentGet).not.toHaveBeenCalled()
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('firma valida con MP_CLIENT_SECRET -> procesa (ignored para ref desconocida)', async () => {
    process.env.MP_CLIENT_SECRET = 'test-secret'
    const sig = validSignature({ paymentId: '123' })
    mocks.mp.paymentGet.mockResolvedValue({ id: 123, status: 'approved', external_reference: 'unknown-sub' })
    const res = mockRes()
    await webhookHandler(
      {
        query: { topic: 'payment', id: '123' },
        method: 'POST',
        headers: { 'x-signature': sig.xSignature, 'x-request-id': sig.xRequestId },
        body: {},
      },
      res,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true, ignored: true })
    // Signature passed and the payment was fetched.
    expect(mocks.mp.paymentGet).toHaveBeenCalledWith({ id: 123 })
  })
})

