// tests/integration/plans-settings.test.js
//
// Integration tests for plans and platform-settings handlers with mocked
// Prisma (API-01, D3):
//   plans: public active-only, admin sees all, admin PATCH upsert,
//          DELETE 409 when subscribed;
//   platform-settings: admin-only GET/PATCH single row 'general'.
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

import plansHandler from '../../api/plans.js'
import planIdHandler from '../../api/plans/[id].js'
import settingsHandler from '../../api/platform-settings.js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'admin-1', role = 'admin', email = 'admin@test.com', displayName = 'Admin Test' } = {}) {
  getUserResult = { data: { user: { id: uid, email } }, error: null }
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  return { uid, role }
}

function anon() {
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
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
  mocks.delegates.subscriptionPlan.findMany.mockResolvedValue([])
  mocks.delegates.subscription.count.mockResolvedValue(0)
  mocks.delegates.platformSettings.findUnique.mockResolvedValue(null)
})

describe('GET /api/plans', () => {
  it('anon -> 200 solo activos (AUTH-04 public)', async () => {
    anon()
    mocks.delegates.subscriptionPlan.findMany.mockResolvedValue([{ id: 'basic', isActive: true }])
    const res = mockRes()
    await plansHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscriptionPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true },
    }))
  })

  it('admin -> 200 ve todos (incluye inactivos)', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.findMany.mockResolvedValue([{ id: 'basic' }, { id: 'pro' }])
    const res = mockRes()
    await plansHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscriptionPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
    }))
  })
})

describe('PATCH/DELETE /api/plans/[id]', () => {
  it('no-admin -> 403', async () => {
    authAs({ role: 'guest' })
    const res = mockRes()
    await planIdHandler({ query: { id: 'basic' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { price: 10 } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('admin PATCH upsert por id fijo (D9)', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.upsert.mockImplementation(async ({ create }) => ({ ...create }))
    const res = mockRes()
    await planIdHandler({ query: { id: 'basic' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { name: 'Básico', price: 10, maxProperties: 1 } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscriptionPlan.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'basic' },
      update: { name: 'Básico', price: 10, maxProperties: 1 },
      create: expect.objectContaining({ id: 'basic', name: 'Básico', price: 10 }),
    }))
  })

  it('DELETE con suscripciones -> 409', async () => {
    authAs()
    mocks.delegates.subscription.count.mockResolvedValue(3)
    const res = mockRes()
    await planIdHandler({ query: { id: 'basic' }, method: 'DELETE', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.delegates.subscriptionPlan.delete).not.toHaveBeenCalled()
  })

  it('DELETE sin suscripciones -> 200', async () => {
    authAs()
    mocks.delegates.subscriptionPlan.delete.mockResolvedValue({ id: 'basic' })
    const res = mockRes()
    await planIdHandler({ query: { id: 'basic' }, method: 'DELETE', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.subscriptionPlan.delete).toHaveBeenCalledWith({ where: { id: 'basic' } })
  })
})

describe('GET/PATCH /api/platform-settings (D3 single row)', () => {
  it('anon -> 401; no-admin -> 403', async () => {
    const res = mockRes()
    await settingsHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)

    authAs({ role: 'guest' })
    const res2 = mockRes()
    await settingsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res2)
    expect(res2.status).toHaveBeenCalledWith(403)
  })

  it('GET fila general (404 si no existe)', async () => {
    authAs()
    mocks.delegates.platformSettings.findUnique.mockResolvedValue({ id: 'general', platformName: 'AlquiLibres' })
    const res = mockRes()
    await settingsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.platformSettings.findUnique).toHaveBeenCalledWith({ where: { id: 'general' } })

    mocks.delegates.platformSettings.findUnique.mockResolvedValue(null)
    const res2 = mockRes()
    await settingsHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res2)
    expect(res2.status).toHaveBeenCalledWith(404)
  })

  it('PATCH actualiza con updatedBy del admin', async () => {
    authAs()
    mocks.delegates.platformSettings.update.mockImplementation(async ({ data }) => ({ id: 'general', ...data }))
    const res = mockRes()
    await settingsHandler({ query: {}, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { commissionRate: 10, moderateProperties: true } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.platformSettings.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'general' },
      data: expect.objectContaining({ commissionRate: 10, moderateProperties: true, updatedBy: 'admin-1' }),
    }))
  })

  it('commissionRate fuera de rango -> 400', async () => {
    authAs()
    const res = mockRes()
    await settingsHandler({ query: {}, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { commissionRate: 150 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
