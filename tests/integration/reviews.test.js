// tests/integration/reviews.test.js
//
// Integration tests for the reviews handler with mocked Prisma (API-01):
//   GET public visible-only by propertyId, GET owner=me scoped to own
//   properties, POST guest with rating 1..5 (verified=false).
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

import reviewsHandler from '../../api/reviews.js'

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
  mocks.delegates.review.count.mockResolvedValue(0)
  mocks.delegates.review.findMany.mockResolvedValue([])
})

describe('GET /api/reviews', () => {
  it('publico por propertyId -> 200 solo visibles, sin auth', async () => {
    mocks.delegates.review.findMany.mockResolvedValue([{ id: 'r1' }])
    mocks.delegates.review.count.mockResolvedValue(1)
    const res = mockRes()
    await reviewsHandler({ query: { propertyId: 'p1' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.review.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { propertyId: 'p1', visible: true },
    }))
  })

  it('owner=me -> 200 scoped a propiedades propias (relation filter)', async () => {
    authAs({ uid: 'owner-1' })
    const res = mockRes()
    await reviewsHandler({ query: { owner: 'me' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.review.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { property: { ownerId: 'owner-1' } },
    }))
  })

  it('owner=me sin auth -> 401', async () => {
    const res = mockRes()
    await reviewsHandler({ query: { owner: 'me' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('sin filtro -> 400', async () => {
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('POST /api/reviews', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', body: { propertyId: 'p1', rating: 5 } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('guest deja review -> 201 con verified=false', async () => {
    authAs({ uid: 'guest-1', role: 'guest', email: 'guest@test.com', displayName: 'Guest' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    mocks.delegates.review.create.mockImplementation(async ({ data }) => ({ id: 'r-new', ...data }))
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1', rating: 4, comment: 'Muy lindo' } }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.review.create.mock.calls[0][0]
    expect(createArgs.data).toMatchObject({
      propertyId: 'p1',
      ownerId: 'owner-1',
      guestId: 'guest-1',
      guestName: 'Guest',
      rating: 4,
      comment: 'Muy lindo',
      verified: false,
      visible: true,
    })
  })

  it('rating fuera de rango -> 400', async () => {
    authAs()
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1', rating: 0 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('propiedad inexistente/inactiva -> 404', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'pX', rating: 5 } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('no puede reseñar su propia propiedad -> 400', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1', rating: 5 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
