// tests/integration/reviews.test.js
//
// Integration tests for the reviews handler with mocked Prisma (API-01):
//   GET public visible-only by propertyId, GET owner=me scoped to own
//   properties, POST guest with rating 1..5 (verified=false).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeAuthHeaders } from './helpers/auth.js'

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
  return { delegates, $queryRaw: vi.fn() }
})

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

import reviewsHandler from '../../api-handlers/reviews.js'
import reviewIdHandler from '../../api-handlers/reviews/[id].js'

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  res.json.mockReturnValue(res)
  return res
}

let authHeaders = {}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  authHeaders = makeAuthHeaders({ uid, role, email })
  return { uid, role }
}

beforeEach(() => {
  vi.clearAllMocks()
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
    await reviewsHandler({ query: { owner: 'me' }, method: 'GET', headers: authHeaders }, res)
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
    await reviewsHandler({ query: {}, method: 'POST', headers: authHeaders, body: { propertyId: 'p1', rating: 4, comment: 'Muy lindo' } }, res)
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
    await reviewsHandler({ query: {}, method: 'POST', headers: authHeaders, body: { propertyId: 'p1', rating: 0 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('propiedad inexistente/inactiva -> 404', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: authHeaders, body: { propertyId: 'pX', rating: 5 } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('no puede reseñar su propia propiedad -> 400', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', isActive: true })
    const res = mockRes()
    await reviewsHandler({ query: {}, method: 'POST', headers: authHeaders, body: { propertyId: 'p1', rating: 5 } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PATCH /api/reviews/[id]', () => {
  function mockReview(ownerId = 'owner-1') {
    return {
      id: 'r1',
      propertyId: 'p1',
      guestId: 'guest-1',
      property: { ownerId },
    }
  }

  it('owner responde -> 200 con ownerResponse y ownerRespondedAt', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.review.findUnique.mockResolvedValue(mockReview('owner-1'))
    mocks.delegates.review.update.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }))
    const res = mockRes()
    await reviewIdHandler({ query: { id: 'r1' }, method: 'PATCH', headers: authHeaders, body: { response: 'Gracias por tu comentario.' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.review.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'r1' },
      data: expect.objectContaining({
        ownerResponse: 'Gracias por tu comentario.',
        ownerRespondedAt: expect.any(Date),
      }),
    }))
  })

  it('respuesta vacia -> 400', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.review.findUnique.mockResolvedValue(mockReview('owner-1'))
    const res = mockRes()
    await reviewIdHandler({ query: { id: 'r1' }, method: 'PATCH', headers: authHeaders, body: { response: '' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('guest/owner extranjero -> 403', async () => {
    authAs({ uid: 'guest-1', role: 'guest' })
    mocks.delegates.review.findUnique.mockResolvedValue(mockReview('owner-1'))
    const res = mockRes()
    await reviewIdHandler({ query: { id: 'r1' }, method: 'PATCH', headers: authHeaders, body: { response: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)

    authAs({ uid: 'owner-2' })
    const res2 = mockRes()
    await reviewIdHandler({ query: { id: 'r1' }, method: 'PATCH', headers: authHeaders, body: { response: 'Hola' } }, res2)
    expect(res2.status).toHaveBeenCalledWith(403)
  })

  it('review inexistente -> 404', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.review.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await reviewIdHandler({ query: { id: 'rX' }, method: 'PATCH', headers: authHeaders, body: { response: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('anonimo -> 401', async () => {
    mocks.delegates.review.findUnique.mockResolvedValue(mockReview('owner-1'))
    const res = mockRes()
    await reviewIdHandler({ query: { id: 'r1' }, method: 'PATCH', body: { response: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
