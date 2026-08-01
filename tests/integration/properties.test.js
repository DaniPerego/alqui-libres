// tests/integration/properties.test.js
//
// Integration tests for the properties handlers with mocked Prisma
// (API-01, API-02, API-03, API-04, AUTH-02, AUTH-04):
//   anon GET active-only, q="100%" literal raw search, scope=all admin gate,
//   POST ownerId from token subject, owner isolation 403, DELETE 409.
//
// The @prisma/client mock keeps the real `Prisma` namespace (search.js uses
// Prisma.sql) while replacing PrismaClient with a delegate-driven stub.
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

import propertiesHandler from '../../api/properties.js'
import propertyDetailHandler from '../../api/properties/[id].js'
import propertyMineHandler from '../../api/properties/mine.js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'owner-1', role = 'owner', email = 'owner@test.com', displayName = 'Owner Test' } = {}) {
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
  // Defaults so untouched delegate paths don't crash.
  mocks.delegates.property.findMany.mockResolvedValue([])
  mocks.delegates.property.count.mockResolvedValue(0)
  mocks.delegates.property.findUnique.mockResolvedValue(null)
})

describe('GET /api/properties (public list)', () => {
  it('anon -> 200 con solo activas (AUTH-04)', async () => {
    mocks.delegates.property.findMany.mockResolvedValue([{ id: 'p1', isActive: true }])
    mocks.delegates.property.count.mockResolvedValue(1)
    const res = mockRes()
    await propertiesHandler({ query: { page: '1', limit: '20' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.data).toHaveLength(1)
    expect(body.meta.total).toBe(1)
    expect(mocks.delegates.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('filtros city/propertyType/rentalType/guests -> where estructurado', async () => {
    mocks.delegates.property.findMany.mockResolvedValue([])
    mocks.delegates.property.count.mockResolvedValue(0)
    const res = mockRes()
    await propertiesHandler(
      { query: { city: 'Mar del Plata', propertyType: 'casa', rentalType: 'temporario', guests: '3' }, method: 'GET' },
      res
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isActive: true,
        locationCity: 'Mar del Plata',
        propertyType: 'casa',
        rentalType: 'temporario',
        capacityGuests: { gte: 3 },
      },
    }))
  })

  it('guests invalido -> 400 VALIDATION', async () => {
    const res = mockRes()
    await propertiesHandler({ query: { guests: 'abc' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'VALIDATION', message: expect.any(String) } })
  })

  it('?q=100% usa búsqueda raw escapada (API-03 wildcards)', async () => {
    mocks.$queryRaw
      .mockResolvedValueOnce([{ id: 'p1', title: '100% natural' }])
      .mockResolvedValueOnce([{ count: 1 }])
    const res = mockRes()
    await propertiesHandler({ query: { q: '100%', page: '1', limit: '20' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.$queryRaw).toHaveBeenCalledTimes(2)
    const [searchSql, countSql] = mocks.$queryRaw.mock.calls.map((c) => c[0])
    expect(searchSql.text).toContain('ESCAPE')
    expect(searchSql.text).toContain('LIMIT')
    expect(searchSql.values[0]).toBe('%100\\%%')
    expect(countSql.text).toContain('COUNT(*)')
  })

  it('?q combina filtros estructurados (city + rentalType)', async () => {
    mocks.$queryRaw
      .mockResolvedValueOnce([{ id: 'p1' }])
      .mockResolvedValueOnce([{ count: 1 }])
    const res = mockRes()
    await propertiesHandler({ query: { q: 'mar', city: 'Mar del Plata', rentalType: 'anual' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const [searchSql] = mocks.$queryRaw.mock.calls.map((c) => c[0])
    expect(searchSql.values).toContain('Mar del Plata')
    expect(searchSql.values).toContain('anual')
  })

  it('?scope=all exige admin (API-02)', async () => {
    const res = mockRes()
    await propertiesHandler({ query: { scope: 'all' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)

    authAs()
    const res2 = mockRes()
    await propertiesHandler({ query: { scope: 'all' }, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res2)
    expect(res2.status).toHaveBeenCalledWith(403)

    authAs({ role: 'admin' })
    mocks.delegates.property.findMany.mockResolvedValue([{ id: 'p1', status: 'pending' }])
    mocks.delegates.property.count.mockResolvedValue(1)
    const res3 = mockRes()
    await propertiesHandler({ query: { scope: 'all', status: 'pending' }, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res3)
    expect(res3.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'pending' },
    }))
  })
})

describe('POST /api/properties', () => {
  const validBody = {
    title: 'Casa en Mar del Plata',
    description: 'Descripción',
    propertyType: 'casa',
    locationCity: 'Mar del Plata',
    locationState: 'Buenos Aires',
    capacityGuests: 4,
    capacityBedrooms: 2,
    capacityBeds: 2,
    capacityBathrooms: 1,
    pricingBasePrice: 100,
  }

  it('anon -> 401 (AUTH-01)', async () => {
    const res = mockRes()
    await propertiesHandler({ query: {}, method: 'POST', headers: {}, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('guest -> 403', async () => {
    authAs({ role: 'guest' })
    const res = mockRes()
    await propertiesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('owner -> 201 con ownerId del token subject (AUTH-02)', async () => {
    authAs()
    mocks.delegates.platformSettings.findUnique.mockResolvedValue({ moderateProperties: false })
    mocks.delegates.property.create.mockImplementation(async ({ data }) => ({ id: 'new-1', ...data }))
    const res = mockRes()
    await propertiesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.property.create.mock.calls[0][0]
    expect(createArgs.data.ownerId).toBe('owner-1')
    expect(createArgs.data.ownerName).toBe('Owner Test')
    expect(createArgs.data.status).toBe('active')
    expect(createArgs.data.isActive).toBe(true)
  })

  it('moderateProperties=true -> status pending e isActive false', async () => {
    authAs()
    mocks.delegates.platformSettings.findUnique.mockResolvedValue({ moderateProperties: true })
    mocks.delegates.property.create.mockImplementation(async ({ data }) => ({ id: 'new-1', ...data }))
    const res = mockRes()
    await propertiesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.property.create.mock.calls[0][0]
    expect(createArgs.data.status).toBe('pending')
    expect(createArgs.data.isActive).toBe(false)
  })

  it('payload invalido -> 400 VALIDATION', async () => {
    authAs()
    const res = mockRes()
    await propertiesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { title: 'Solo titulo' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'VALIDATION', message: expect.any(String) } })
  })
})

describe('GET/PATCH/DELETE /api/properties/[id]', () => {
  it('GET activa anon -> 200', async () => {
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', isActive: true, ownerId: 'owner-1' })
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('GET inactiva anon -> 404; owner -> 200', async () => {
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', isActive: false, ownerId: 'owner-1' })
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(404)

    authAs()
    const res2 = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res2)
    expect(res2.status).toHaveBeenCalledWith(200)
  })

  it('GET inactiva admin -> 200', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', isActive: false, ownerId: 'owner-9' })
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('PATCH propiedad ajena -> 403 (API-02 owner isolation)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-2', isActive: true })
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { title: 'Hack' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.delegates.property.update).not.toHaveBeenCalled()
  })

  it('PATCH owner puede editar campos y publicar (isActive)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    mocks.delegates.property.update.mockImplementation(async ({ data }) => ({ id: 'p1', ...data }))
    const res = mockRes()
    await propertyDetailHandler({
      query: { id: 'p1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' },
      body: { title: 'Nuevo titulo', isActive: true },
    }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const updateArgs = mocks.delegates.property.update.mock.calls[0][0]
    expect(updateArgs.data.title).toBe('Nuevo titulo')
    expect(updateArgs.data.isActive).toBe(true)
  })

  it('PATCH owner intenta status -> 403 (moderación admin-only)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'active' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('PATCH admin aprueba -> status active + isActive true + reviewedBy', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: false, status: 'pending' })
    mocks.delegates.property.update.mockImplementation(async ({ data }) => ({ id: 'p1', ...data }))
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'active' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const updateArgs = mocks.delegates.property.update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('active')
    expect(updateArgs.data.isActive).toBe(true)
    expect(updateArgs.data.reviewedBy).toBe('owner-1')
  })

  it('DELETE con reservas -> 409 (soft constraint)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    mocks.delegates.reservation.count.mockResolvedValue(2)
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'DELETE', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: expect.any(String) } })
    expect(mocks.delegates.property.delete).not.toHaveBeenCalled()
  })

  it('DELETE sin reservas -> 200 y borra reviews/messages/property', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    mocks.delegates.reservation.count.mockResolvedValue(0)
    const res = mockRes()
    await propertyDetailHandler({ query: { id: 'p1' }, method: 'DELETE', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.review.deleteMany).toHaveBeenCalledWith({ where: { propertyId: 'p1' } })
    expect(mocks.delegates.message.deleteMany).toHaveBeenCalledWith({ where: { propertyId: 'p1' } })
    expect(mocks.delegates.property.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})

describe('GET /api/properties/mine', () => {
  it('anon -> 401, no-owner -> 403', async () => {
    const res = mockRes()
    await propertyMineHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)

    authAs({ role: 'guest' })
    const res2 = mockRes()
    await propertyMineHandler({ query: {}, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res2)
    expect(res2.status).toHaveBeenCalledWith(403)
  })

  it('owner -> 200 filtrado por ownerId, con filtro de status', async () => {
    authAs()
    mocks.delegates.property.findMany.mockResolvedValue([{ id: 'p1' }])
    mocks.delegates.property.count.mockResolvedValue(1)
    const res = mockRes()
    await propertyMineHandler({ query: { status: 'pending' }, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: 'owner-1', status: 'pending' },
    }))
  })
})
