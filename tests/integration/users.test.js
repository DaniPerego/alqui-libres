// tests/integration/users.test.js
//
// Integration tests for the users handlers with mocked Prisma
// (API-02, AUTH-01, AUTH-02, AUTH-03):
//   POST self materialize (role owner), POST exists -> 409, POST anon -> 401,
//   admin create via service role + temp password, duplicate email -> 409,
//   GET admin-only, PATCH me rejects role/isActive with 403, PATCH [id] admin.
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

import usersHandler from '../../api/users.js'
import usersMeHandler from '../../api/users/me.js'
import usersIdHandler from '../../api/users/[id].js'

// Shared state so findUnique can answer both the auth lookup (currentUser)
// and target lookups (targets) without one mockResolvedValue overriding the
// other (the handlers do up to two findUnique calls per request).
const state = vi.hoisted(() => ({ currentUser: null, targets: {} }))

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  state.currentUser = { id: uid, role, isActive: true, displayName, email }
  getUserResult = { data: { user: { id: uid, email } }, error: null }
  mocks.delegates.user.findUnique.mockImplementation(async ({ where }) => {
    if (state.currentUser && where.id === state.currentUser.id) return state.currentUser
    return state.targets[where.id] || null
  })
  return state.currentUser
}

function anon() {
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
  state.currentUser = null
  state.targets = {}
  mocks.createClient.mockReturnValue({
    auth: {
      getUser: vi.fn(async () => getUserResult),
      admin: { createUser: mocks.createUser },
    },
  })
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.user.findMany.mockResolvedValue([])
  mocks.delegates.user.count.mockResolvedValue(0)
  mocks.createUser.mockResolvedValue({ data: { user: { id: 'new-uid', email: 'new@test.com' } }, error: null })
})

describe('POST /api/users (self materialize, AUTH-03 register flow)', () => {
  it('anon -> 401 (AUTH-01)', async () => {
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: {}, body: { displayName: 'Nuevo' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('token valido sin fila -> 201 con role owner', async () => {
    authAs({ uid: 'new-uid', email: 'nuevo@test.com' })
    mocks.delegates.user.findUnique.mockResolvedValue(null)
    mocks.delegates.user.create.mockImplementation(async ({ data }) => ({ id: 'new-uid', ...data }))
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { displayName: 'Nuevo' } }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.user.create.mock.calls[0][0]
    expect(createArgs.data.id).toBe('new-uid')
    expect(createArgs.data.email).toBe('nuevo@test.com')
    expect(createArgs.data.role).toBe('owner')
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it('fila ya existente -> 409 (no duplica)', async () => {
    authAs()
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { displayName: 'X' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: expect.any(String) } })
    expect(mocks.delegates.user.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/users (admin create, service role)', () => {
  it('admin -> 201, crea usuario Supabase + fila, devuelve temp password', async () => {
    authAs({ uid: 'admin-1', role: 'admin', email: 'admin@test.com' })
    mocks.createUser.mockResolvedValue({ data: { user: { id: 'new-uid', email: 'nuevo@test.com' } }, error: null })
    mocks.delegates.user.create.mockImplementation(async ({ data }) => ({ id: data.id, ...data }))
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'guest' } }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'nuevo@test.com',
      email_confirm: true,
    }))
    const createArgs = mocks.delegates.user.create.mock.calls[0][0]
    expect(createArgs.data.id).toBe('new-uid')
    expect(createArgs.data.role).toBe('guest')
    const body = res.json.mock.calls[0][0]
    expect(body.tempPassword).toEqual(expect.any(String))
  })

  it('email duplicado en Supabase -> 409', async () => {
    authAs({ uid: 'admin-1', role: 'admin' })
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } })
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { email: 'dup@test.com' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.delegates.user.create).not.toHaveBeenCalled()
  })

  it('non-admin con fila existente -> 409 y nunca llega a create (admin-only por estructura)', async () => {
    authAs()
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { email: 'x@test.com', role: 'guest' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(mocks.delegates.user.create).not.toHaveBeenCalled()
    expect(mocks.createUser).not.toHaveBeenCalled()
  })
})

describe('GET /api/users', () => {
  it('no-admin -> 403', async () => {
    authAs()
    const res = mockRes()
    await usersHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('admin -> 200 con filtros role/isActive', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.user.findMany.mockResolvedValue([{ id: 'u1' }])
    mocks.delegates.user.count.mockResolvedValue(1)
    const res = mockRes()
    await usersHandler({ query: { role: 'owner', isActive: 'true' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: 'owner', isActive: true },
    }))
  })
})

describe('GET/PATCH /api/users/me', () => {
  it('GET devuelve perfil con rol desde DB (D7)', async () => {
    authAs({ role: 'owner' })
    const res = mockRes()
    await usersMeHandler({ query: {}, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ id: 'uid-1', role: 'owner', isActive: true, displayName: 'User Test', email: 'user@test.com' })
  })

  it('PATCH intenta role -> 403 (admin-controlled)', async () => {
    authAs()
    const res = mockRes()
    await usersMeHandler({ query: {}, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { role: 'admin' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.delegates.user.update).not.toHaveBeenCalled()
  })

  it('PATCH displayName -> 200', async () => {
    authAs()
    mocks.delegates.user.update.mockImplementation(async ({ data }) => ({ id: 'uid-1', ...data }))
    const res = mockRes()
    await usersMeHandler({ query: {}, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { displayName: 'Nuevo nombre' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'uid-1' },
      data: { displayName: 'Nuevo nombre' },
    }))
  })
})

describe('PATCH /api/users/[id]', () => {
  it('admin actualiza rol/isActive/displayName', async () => {
    authAs({ role: 'admin' })
    state.targets.u2 = { id: 'u2', role: 'guest', isActive: true, displayName: 'Otro', email: 'otro@test.com' }
    mocks.delegates.user.update.mockImplementation(async ({ data }) => ({ id: 'u2', ...data }))
    const res = mockRes()
    await usersIdHandler({ query: { id: 'u2' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { role: 'owner', isActive: false } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u2' },
      data: { role: 'owner', isActive: false },
    }))
  })

  it('no-admin -> 403', async () => {
    authAs()
    const res = mockRes()
    await usersIdHandler({ query: { id: 'u2' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { role: 'owner' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
