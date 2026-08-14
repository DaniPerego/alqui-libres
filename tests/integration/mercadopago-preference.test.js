// tests/integration/mercadopago-preference.test.js
//
// Integration tests for POST /api/mercadopago/preference with mocked Prisma
// and a mocked `mercadopago` SDK (SDD mercadopago-integration):
//   401 anon, 400 missing planId, 404 unknown/inactive plan, 409 on an
//   existing active subscription, 503 when MP_ACCESS_TOKEN is not set, and
//   200 creating pending Subscription + Payment rows and returning the
//   preference checkout URLs.
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
    createClient: vi.fn(),
    createUser: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (callback) => callback(delegates)),
  }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
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

import preferenceHandler from '../../api-handlers/mercadopago/preference.js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  getUserResult = { data: { user: { id: uid, email } }, error: null }
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  return { uid, role }
}

const PLAN = { id: 'pro', name: 'Plan Pro', price: 24999, currency: 'ARS', isActive: true, order: 2 }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  process.env.MP_ACCESS_TOKEN = 'TEST-ACCESS-TOKEN'
  delete process.env.MP_CLIENT_SECRET
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
  mocks.createClient.mockReturnValue({
    auth: {
      getUser: vi.fn(async () => getUserResult),
      admin: { createUser: mocks.createUser },
    },
  })
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.subscription.findFirst.mockResolvedValue(null)
  mocks.delegates.subscription.create.mockImplementation(async (args) => ({ id: 'sub-created', ...args.data }))
  mocks.delegates.payment.create.mockImplementation(async (args) => ({ id: 'pay-created', ...args.data }))
  mocks.delegates.subscription.update.mockImplementation(async (args) => ({ id: 'sub-created', ...args.data }))
  mocks.delegates.payment.update.mockImplementation(async (args) => ({ id: 'pay-created', ...args.data }))
  mocks.mp.preferenceCreate.mockResolvedValue({
    id: 'pref-1',
    init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-1',
    sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-1',
  })
})

const AUTH_HEADERS = { authorization: 'Bearer tok' }

describe('POST /api/mercadopago/preference', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(mocks.mp.preferenceCreate).not.toHaveBeenCalled()
  })

  it('sin planId -> 400 VALIDATION', async () => {
    authAs()
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: {}, headers: AUTH_HEADERS }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'VALIDATION' }) })
  })

  it('plan inexistente -> 404', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'nope' }, headers: AUTH_HEADERS }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.mp.preferenceCreate).not.toHaveBeenCalled()
  })

  it('plan inactivo -> 404', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue({ ...PLAN, isActive: false })
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' }, headers: AUTH_HEADERS }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('suscripcion activa existente -> 409 CONFLICT', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(PLAN)
    mocks.delegates.subscription.findFirst.mockResolvedValue({ id: 'sub-active', status: 'active' })
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' }, headers: AUTH_HEADERS }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.delegates.subscription.create).not.toHaveBeenCalled()
    expect(mocks.mp.preferenceCreate).not.toHaveBeenCalled()
  })

  it('falta MP_ACCESS_TOKEN -> 503', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(PLAN)
    delete process.env.MP_ACCESS_TOKEN
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' }, headers: AUTH_HEADERS }, res)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(mocks.mp.preferenceCreate).not.toHaveBeenCalled()
  })

  it('200 -> crea Subscription + Payment pending y devuelve init_point', async () => {
    authAs({ uid: 'owner-1', email: 'owner@test.com' })
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(PLAN)
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' }, headers: AUTH_HEADERS }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      id: 'pref-1',
      init_point: expect.stringContaining('pref_id=pref-1'),
      sandbox_init_point: expect.stringContaining('pref_id=pref-1'),
      external_reference: expect.any(String),
    })

    // Subscription pending with mercadopago as method.
    expect(mocks.delegates.subscription.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'owner-1',
        userEmail: 'owner@test.com',
        planId: 'pro',
        planName: 'Plan Pro',
        planPrice: 24999,
        status: 'pending',
        paymentMethod: 'mercadopago',
        autoRenew: true,
      }),
    }))

    // Payment pending with plan amount and subscription id as external ref.
    expect(mocks.delegates.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'owner-1',
        subscriptionId: expect.any(String),
        planId: 'pro',
        planName: 'Plan Pro',
        amount: 24999,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        status: 'pending',
        externalReference: expect.any(String),
      }),
    }))

    // Preference created with subscription id as external reference.
    expect(mocks.mp.preferenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        external_reference: expect.any(String),
        statement_descriptor: 'ALQUILIBRES',
        notification_url: expect.stringContaining('/api/mercadopago/webhook'),
        back_urls: expect.objectContaining({
          success: expect.stringContaining('/panel/payment-result?status=success'),
          failure: expect.stringContaining('/panel/payment-result?status=failure'),
          pending: expect.stringContaining('/panel/payment-result?status=pending'),
        }),
        items: [
          { title: 'Plan Plan Pro', quantity: 1, unit_price: 24999, currency_id: 'ARS' },
        ],
      }),
    }))

    // Preference id persisted on both rows.
    expect(mocks.delegates.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { preferenceId: 'pref-1' },
    }))
    expect(mocks.delegates.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { preferenceId: 'pref-1' },
    }))
  })

  it('reusa una suscripcion pending existente en vez de duplicar', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(PLAN)
    mocks.delegates.subscription.findFirst.mockImplementation(async ({ where }) => {
      if (where.status === 'active') return null
      return { id: 'sub-pending', status: 'pending' }
    })
    const res = mockRes()
    await preferenceHandler({ query: {}, method: 'POST', body: { planId: 'pro' }, headers: AUTH_HEADERS }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.create).not.toHaveBeenCalled()
    expect(mocks.delegates.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionId: 'sub-pending' }),
    }))
  })
})

