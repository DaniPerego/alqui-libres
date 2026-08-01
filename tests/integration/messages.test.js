// tests/integration/messages.test.js
//
// Integration tests for the messages handlers with mocked Prisma
// (API-01, AUTH-04):
//   GET participant-scoped with read/propertyId filters, POST guest contact
//   owner (unread row), PATCH owner mark read/replied.
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

import messagesHandler from '../../api/messages.js'
import messageIdHandler from '../../api/messages/[id].js'

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
  mocks.delegates.message.count.mockResolvedValue(0)
  mocks.delegates.message.findMany.mockResolvedValue([])
})

describe('GET /api/messages', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('participante -> 200 con filtro OR ownerId/guestId', async () => {
    authAs({ uid: 'guest-1', role: 'guest' })
    mocks.delegates.message.findMany.mockResolvedValue([{ id: 'm1' }])
    mocks.delegates.message.count.mockResolvedValue(1)
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ ownerId: 'guest-1' }, { guestId: 'guest-1' }] },
    }))
    expect(res.json).toHaveBeenCalledWith({ data: [{ id: 'm1' }], meta: expect.any(Object) })
  })

  it('filtro read=true', async () => {
    authAs()
    const res = mockRes()
    await messagesHandler({ query: { read: 'true' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(mocks.delegates.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ read: true }),
    }))
  })
})

describe('POST /api/messages', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'POST', body: { propertyId: 'p1', message: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('guest contacta owner -> 201, fila unread para el owner', async () => {
    authAs({ uid: 'guest-1', role: 'guest', email: 'guest@test.com', displayName: 'Guest' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', title: 'Casa', isActive: true })
    mocks.delegates.message.create.mockImplementation(async ({ data }) => ({ id: 'm-new', ...data }))
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1', message: 'Hola, está libre en marzo?' } }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.message.create.mock.calls[0][0]
    expect(createArgs.data).toMatchObject({
      ownerId: 'owner-1',
      guestId: 'guest-1',
      propertyId: 'p1',
      propertyTitle: 'Casa',
      guestName: 'Guest',
      guestEmail: 'guest@test.com',
      message: 'Hola, está libre en marzo?',
      status: 'unread',
      read: false,
    })
  })

  it('faltan campos -> 400', async () => {
    authAs()
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('propiedad inactiva o inexistente -> 404', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'pX', message: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('no puede mensajear su propia propiedad -> 400', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.property.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'owner-1', title: 'Casa', isActive: true })
    const res = mockRes()
    await messagesHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { propertyId: 'p1', message: 'Hola' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PATCH /api/messages/[id]', () => {
  it('owner marca replied -> 200 con repliedAt', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.message.findUnique.mockResolvedValue({ id: 'm1', ownerId: 'owner-1', guestId: 'g1' })
    mocks.delegates.message.update.mockImplementation(async ({ data }) => ({ id: 'm1', ...data }))
    const res = mockRes()
    await messageIdHandler({ query: { id: 'm1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'replied' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' },
      data: expect.objectContaining({ read: true, status: 'replied', repliedAt: expect.any(Date) }),
    }))
  })

  it('no-owner (guest) -> 404', async () => {
    authAs({ uid: 'guest-1', role: 'guest' })
    mocks.delegates.message.findUnique.mockResolvedValue({ id: 'm1', ownerId: 'owner-1', guestId: 'guest-1' })
    const res = mockRes()
    await messageIdHandler({ query: { id: 'm1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'read' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('inexistente -> 404; status invalido -> 400', async () => {
    authAs({ uid: 'owner-1' })
    mocks.delegates.message.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await messageIdHandler({ query: { id: 'mX' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: {} }, res)
    expect(res.status).toHaveBeenCalledWith(404)

    mocks.delegates.message.findUnique.mockResolvedValue({ id: 'm1', ownerId: 'owner-1' })
    const res2 = mockRes()
    await messageIdHandler({ query: { id: 'm1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'spam' } }, res2)
    expect(res2.status).toHaveBeenCalledWith(400)
  })
})
