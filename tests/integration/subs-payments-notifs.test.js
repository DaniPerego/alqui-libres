// tests/integration/subs-payments-notifs.test.js
//
// Integration tests for subscriptions, payments and notifications handlers
// with mocked Prisma (API-01, API-04):
//   subscriptions: /mine current row (user), list (admin only);
//   payments: self (user), all (admin), ?mine=true (admin self);
//   notifications: list self only, PATCH mark read self only.
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
  // $transaction(fn) runs fn against the mocked delegates so handlers that
  // operate inside a Prisma transaction hit the same vi.fn delegates.
  const $transaction = vi.fn(async (fn) => (
    typeof fn === 'function' ? fn(delegates) : undefined
  ))
  return { delegates, createUser: vi.fn(), $queryRaw: vi.fn(), $transaction }
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

import subscriptionsHandler from '../../api-handlers/subscriptions.js'
import subscriptionsMineHandler from '../../api-handlers/subscriptions/mine.js'
import subscriptionsIdHandler from '../../api-handlers/subscriptions/[id].js'
import paymentsHandler from '../../api-handlers/payments.js'
import paymentsStatusHandler from '../../api-handlers/payments/status.js'
import notificationsHandler from '../../api-handlers/notifications.js'
import notificationIdHandler from '../../api-handlers/notifications/[id].js'

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  return { uid, role }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.subscription.findMany.mockResolvedValue([])
  mocks.delegates.subscription.count.mockResolvedValue(0)
  mocks.delegates.payment.findMany.mockResolvedValue([])
  mocks.delegates.payment.count.mockResolvedValue(0)
  mocks.delegates.notification.findMany.mockResolvedValue([])
  mocks.delegates.notification.count.mockResolvedValue(0)
})

describe('GET /api/subscriptions/mine', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await subscriptionsMineHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('user -> 200 con la suscripcion actual (active/pending, mas reciente)', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findFirst.mockResolvedValue({ id: 's1', status: 'active' })
    const res = mockRes()
    await subscriptionsMineHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'owner-1', status: { in: ['active', 'pending'] } },
    }))
    expect(res.json).toHaveBeenCalledWith({ data: { id: 's1', status: 'active' } })
  })

  it('sin suscripcion -> 200 con data null', async () => {
    authAs()
    mocks.delegates.subscription.findFirst.mockResolvedValue(null)
    const res = mockRes()
    await subscriptionsMineHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ data: null })
  })
})

describe('GET /api/subscriptions (admin)', () => {
  it('no-admin -> 403', async () => {
    authAs()
    const res = mockRes()
    await subscriptionsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('admin -> 200 todas con filtro status + paginacion', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.subscription.findMany.mockResolvedValue([{ id: 's1' }])
    mocks.delegates.subscription.count.mockResolvedValue(1)
    const res = mockRes()
    await subscriptionsHandler({ query: { status: 'active' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'active' },
    }))
  })
})

describe('GET /api/payments', () => {
  it('user -> 200 solo sus pagos', async () => {
    authAs({ uid: 'owner-1' })
    const res = mockRes()
    await paymentsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'owner-1' },
    }))
  })

  it('admin -> 200 todos; admin ?mine=true -> self', async () => {
    authAs({ uid: 'admin-1', role: 'admin' })
    const res = mockRes()
    await paymentsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
    }))

    const res2 = mockRes()
    await paymentsHandler({ query: { mine: 'true' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res2)
    expect(mocks.delegates.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'admin-1' },
    }))
  })

  it('filtro status', async () => {
    authAs()
    const res = mockRes()
    await paymentsHandler({ query: { status: 'approved' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(mocks.delegates.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'uid-1', status: 'approved' },
    }))
  })
})

describe('GET /api/payments/status', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await paymentsStatusHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('user -> 200 con subscription/payment/status derivado', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findFirst.mockResolvedValue({ id: 's1', status: 'active' })
    mocks.delegates.payment.findFirst.mockResolvedValue({ id: 'p1', status: 'approved' })
    const res = mockRes()
    await paymentsStatusHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'owner-1', status: { in: ['active', 'pending'] } },
    }))
    expect(res.json).toHaveBeenCalledWith({
      data: {
        subscription: { id: 's1', status: 'active' },
        payment: { id: 'p1', status: 'approved' },
        status: 'active',
      },
    })
  })

  it('subscription pending -> status pending', async () => {
    authAs()
    mocks.delegates.subscription.findFirst.mockResolvedValue({ id: 's2', status: 'pending' })
    mocks.delegates.payment.findFirst.mockResolvedValue(null)
    const res = mockRes()
    await paymentsStatusHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      data: { subscription: { id: 's2', status: 'pending' }, payment: null, status: 'pending' },
    })
  })

  it('sin subscription -> 200 con status none', async () => {
    authAs()
    mocks.delegates.subscription.findFirst.mockResolvedValue(null)
    mocks.delegates.payment.findFirst.mockResolvedValue(null)
    const res = mockRes()
    await paymentsStatusHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      data: { subscription: null, payment: null, status: 'none' },
    })
  })
})

describe('PATCH /api/subscriptions/[id]', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('sin id -> 400 VALIDATION', async () => {
    authAs()
    const res = mockRes()
    await subscriptionsIdHandler({ query: {}, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'cancelled' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('suscripcion ajena -> 404 (no enumera)', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's-other', userId: 'other-user' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's-other' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'cancelled' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('owner cancela su suscripcion activa -> 200 cancelled + autoRenew false', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'active', autoRenew: true })
    mocks.delegates.subscription.update.mockImplementation(async ({ data }) => ({ id: 's1', ...data }))
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'cancelled' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 's1' },
      data: expect.objectContaining({
        status: 'cancelled',
        autoRenew: false,
        cancelledAt: expect.any(Date),
      }),
    }))
  })

  it('ya cancelada -> 409', async () => {
    authAs()
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'uid-1', status: 'cancelled' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'cancelled' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('transicion no soportada -> 400', async () => {
    authAs()
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'uid-1', status: 'active' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'active' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'VALIDATION' }) })
  })

  it('falta status -> 400', async () => {
    authAs()
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'uid-1', status: 'active' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: {} }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('plan_change sin planId -> 400 VALIDATION', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'active', planId: 'pro' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'VALIDATION' }) })
  })

  it('plan_change mismo plan -> 409', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'active', planId: 'pro' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'pro' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'CONFLICT' }) })
  })

  it('plan_change plan inexistente -> 404', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'active', planId: 'pro' })
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'ghost' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('plan_change plan inactivo -> 404', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'active', planId: 'pro' })
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue({ id: 'old', name: 'Plan Retirado', price: 1, isActive: false })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'old' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('plan_change sub cancelada -> 409', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'owner-1', status: 'cancelled', planId: 'pro' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'basic' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('plan_change sub ajena -> 404 (no enumera)', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({ id: 's-other', userId: 'other-user', status: 'active', planId: 'pro' })
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's-other' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'basic' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.delegates.subscription.update).not.toHaveBeenCalled()
  })

  it('plan_change con plan valido -> 200 pending + plan nuevo + preferenceId null + payment pending', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.subscription.findUnique.mockResolvedValue({
      id: 's1', userId: 'owner-1', userEmail: 'user@test.com', status: 'active', planId: 'pro', planPrice: 19999,
    })
    mocks.delegates.subscriptionPlan.findUnique.mockResolvedValue({ id: 'basic', name: 'Plan Básico', price: 9999, currency: 'ARS', isActive: true })
    mocks.delegates.subscription.update.mockImplementation(async ({ data }) => ({ id: 's1', ...data }))
    mocks.delegates.payment.create.mockImplementation(async ({ data }) => ({ id: 'p-new', ...data }))
    const res = mockRes()
    await subscriptionsIdHandler({ query: { id: 's1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'plan_change', planId: 'basic' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    // La sub quedó pending sobre el plan nuevo, con preferenceId limpiado.
    expect(mocks.delegates.subscription.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        planId: 'basic',
        planName: 'Plan Básico',
        planPrice: 9999,
        status: 'pending',
        preferenceId: null,
      },
    })
    // Se creó un Payment pending nuevo para este intento.
    expect(mocks.delegates.payment.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        userEmail: 'user@test.com',
        subscriptionId: 's1',
        planId: 'basic',
        planName: 'Plan Básico',
        amount: 9999,
        currency: 'ARS',
        paymentMethod: 'mercadopago',
        status: 'pending',
        externalReference: 's1',
      },
    })
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 's1', planId: 'basic', planName: 'Plan Básico', planPrice: 9999, status: 'pending', preferenceId: null,
    }))
  })
})

describe('GET /api/notifications', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await notificationsHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('user -> 200 solo suyas (userId del token), filtro read', async () => {
    authAs({ uid: 'uid-1' })
    mocks.delegates.notification.findMany.mockResolvedValue([{ id: 'n1' }])
    mocks.delegates.notification.count.mockResolvedValue(1)
    const res = mockRes()
    await notificationsHandler({ query: { read: 'false' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'uid-1', read: false },
    }))
  })
})

describe('PATCH /api/notifications/[id]', () => {
  it('marca como leida (self) -> 200 read=true + readAt', async () => {
    authAs({ uid: 'uid-1' })
    mocks.delegates.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'uid-1' })
    mocks.delegates.notification.update.mockImplementation(async ({ data }) => ({ id: 'n1', ...data }))
    const res = mockRes()
    await notificationIdHandler({ query: { id: 'n1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.notification.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'n1' },
      data: expect.objectContaining({ read: true, readAt: expect.any(Date) }),
    }))
  })

  it('notificacion ajena -> 404', async () => {
    authAs({ uid: 'uid-1' })
    mocks.delegates.notification.findUnique.mockResolvedValue({ id: 'n2', userId: 'other-user' })
    const res = mockRes()
    await notificationIdHandler({ query: { id: 'n2' }, method: 'PATCH', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})
