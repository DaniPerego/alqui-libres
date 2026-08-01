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
  return { delegates, createClient: vi.fn(), createUser: vi.fn(), $queryRaw: vi.fn() }
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
      }
    },
  }
})

import subscriptionsHandler from '../../api/subscriptions.js'
import subscriptionsMineHandler from '../../api/subscriptions/mine.js'
import paymentsHandler from '../../api/payments.js'
import notificationsHandler from '../../api/notifications.js'
import notificationIdHandler from '../../api/notifications/[id].js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  getUserResult = { data: { user: { id: uid, email } }, error: null }
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  return { uid, role }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
  mocks.createClient.mockReturnValue({
    auth: {
      getUser: vi.fn(async () => getUserResult),
      admin: { createUser: mocks.createUser },
    },
  })
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
