// tests/integration/users.test.js
//
// Integration tests for the users handlers with mocked Prisma
// (API-02, AUTH-01, AUTH-02, AUTH-03):
//   POST admin create (bcrypt + temp password), duplicate email -> 409,
//   GET admin-only, PATCH me rejects role/isActive with 403, PATCH [id] admin.
// Auth uses REAL JWTs signed with the handlers' secret (helpers/auth.js).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
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

import usersHandler from '../../api-handlers/users.js'
import usersMeHandler from '../../api-handlers/users/me.js'
import usersIdHandler from '../../api-handlers/users/[id].js'

// Shared state so findUnique can answer the auth lookup (currentUser),
// target lookups (targets) and email lookups (emails) without one
// mockResolvedValue overriding the other (handlers do up to two findUnique
// calls per request).
const state = vi.hoisted(() => ({ currentUser: null, targets: {}, emails: {} }))

let authHeaders = {}

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'uid-1', role = 'owner', email = 'user@test.com', displayName = 'User Test' } = {}) {
  state.currentUser = { id: uid, role, isActive: true, displayName, email }
  mocks.delegates.user.findUnique.mockImplementation(async ({ where }) => {
    if (where.email) return state.emails[where.email] || null
    if (state.currentUser && where.id === state.currentUser.id) return state.currentUser
    return state.targets[where.id] || null
  })
  authHeaders = makeAuthHeaders({ uid, role, email })
  return state.currentUser
}

function anon() {
  // No authenticated user — no Authorization header.
  state.currentUser = null
  authHeaders = {}
}

beforeEach(() => {
  vi.clearAllMocks()
  state.currentUser = null
  state.targets = {}
  state.emails = {}
  authHeaders = {}
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.user.findMany.mockResolvedValue([])
  mocks.delegates.user.count.mockResolvedValue(0)
})

describe('POST /api/users (admin create, native bcrypt)', () => {
  it('anon -> 401 (AUTH-01)', async () => {
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: {}, body: { displayName: 'Nuevo' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('non-admin -> 403 (admin-only)', async () => {
    authAs()
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: authHeaders, body: { email: 'x@test.com', role: 'guest' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.delegates.user.create).not.toHaveBeenCalled()
  })

  it('admin -> 201, crea usuario + fila, devuelve temp password', async () => {
    authAs({ uid: 'admin-1', role: 'admin', email: 'admin@test.com' })
    mocks.delegates.user.create.mockImplementation(async ({ data }) => ({ id: data.id, ...data }))
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: authHeaders, body: { email: 'nuevo@test.com', displayName: 'Nuevo', role: 'guest' } }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.user.create.mock.calls[0][0]
    expect(createArgs.data.id).toEqual(expect.any(String))
    expect(createArgs.data.email).toBe('nuevo@test.com')
    expect(createArgs.data.role).toBe('guest')
    expect(createArgs.data.isActive).toBe(true)
    const body = res.json.mock.calls[0][0]
    expect(body.tempPassword).toEqual(expect.any(String))
    // Password stored as a bcrypt hash that verifies against the returned
    // temp password; the hash itself never leaves the API.
    expect(createArgs.data.password).not.toBe(body.tempPassword)
    expect(bcrypt.compareSync(body.tempPassword, createArgs.data.password)).toBe(true)
    expect(body.user).not.toHaveProperty('password')
  })

  it('email duplicado -> 409', async () => {
    authAs({ uid: 'admin-1', role: 'admin' })
    state.emails['dup@test.com'] = { id: 'existing-uid', email: 'dup@test.com' }
    const res = mockRes()
    await usersHandler({ query: {}, method: 'POST', headers: authHeaders, body: { email: 'dup@test.com' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: expect.any(String) } })
    expect(mocks.delegates.user.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/users', () => {
  it('no-admin -> 403', async () => {
    authAs()
    const res = mockRes()
    await usersHandler({ query: {}, method: 'GET', headers: authHeaders }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('admin -> 200 con filtros role/isActive', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.user.findMany.mockResolvedValue([{ id: 'u1' }])
    mocks.delegates.user.count.mockResolvedValue(1)
    const res = mockRes()
    await usersHandler({ query: { role: 'owner', isActive: 'true' }, method: 'GET', headers: authHeaders }, res)
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
    await usersMeHandler({ query: {}, method: 'GET', headers: authHeaders }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ id: 'uid-1', role: 'owner', isActive: true, displayName: 'User Test', email: 'user@test.com' })
  })

  it('PATCH intenta role -> 403 (admin-controlled)', async () => {
    authAs()
    const res = mockRes()
    await usersMeHandler({ query: {}, method: 'PATCH', headers: authHeaders, body: { role: 'admin' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.delegates.user.update).not.toHaveBeenCalled()
  })

  it('PATCH displayName -> 200', async () => {
    authAs()
    mocks.delegates.user.update.mockImplementation(async ({ data }) => ({ id: 'uid-1', ...data }))
    const res = mockRes()
    await usersMeHandler({ query: {}, method: 'PATCH', headers: authHeaders, body: { displayName: 'Nuevo nombre' } }, res)
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
    await usersIdHandler({ query: { id: 'u2' }, method: 'PATCH', headers: authHeaders, body: { role: 'owner', isActive: false } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u2' },
      data: { role: 'owner', isActive: false },
    }))
  })

  it('no-admin -> 403', async () => {
    authAs()
    const res = mockRes()
    await usersIdHandler({ query: { id: 'u2' }, method: 'PATCH', headers: authHeaders, body: { role: 'owner' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
