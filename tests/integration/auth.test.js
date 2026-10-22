// tests/integration/auth.test.js
//
// Integration tests for POST /api/auth/reset-password with mocked Prisma.
// Contract (see api-handlers/auth.js):
//   anonymous -> 200 no-op (no password mutation, no temporary password)
//   admin     -> 200 temporary password returned once + hash rotated
//   non-admin -> 403
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

import authHandler from '../../api-handlers/auth.js'

// One findUnique answers two different lookups per request: the caller (by
// id, for the admin role check) and the target (by email).
const state = vi.hoisted(() => ({ caller: null, targets: {} }))

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  res.json.mockReturnValue(res)
  return res
}

function route() {
  return { query: { action: 'reset-password' }, method: 'POST', headers: {}, body: {} }
}

function authAs({ uid = 'uid-1', role = 'admin', email = 'admin@test.com' } = {}) {
  state.caller = { id: uid, role, email, isActive: true }
  mocks.delegates.user.findUnique.mockImplementation(async ({ where }) => {
    if (where.email) return state.targets[where.email] || null
    if (state.caller && where.id === state.caller.id) return state.caller
    return null
  })
  return makeAuthHeaders({ uid, role, email })
}

beforeEach(() => {
  vi.clearAllMocks()
  state.caller = null
  state.targets = {}
  mocks.$queryRaw.mockResolvedValue([])
})

describe('POST /api/auth/reset-password', () => {
  it('anonymous -> 200 and NEVER rotates the password (no lockout)', async () => {
    const res = mockRes()
    await authHandler({ ...route(), headers: {}, body: { email: 'target@test.com' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.temporaryPassword).toBeUndefined()
    expect(mocks.delegates.user.update).not.toHaveBeenCalled()
  })

  it('anonymous -> 200 explains that email recovery is not enabled', async () => {
    const res = mockRes()
    await authHandler({ ...route(), headers: {}, body: { email: 'target@test.com' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.message).toMatch(/not enabled/i)
  })

  it('admin -> 200 with a temporary password that verifies against the new hash', async () => {
    const headers = authAs({ role: 'admin' })
    state.targets['target@test.com'] = { id: 'target-1', email: 'target@test.com' }
    mocks.delegates.user.update.mockResolvedValue({ id: 'target-1' })

    const res = mockRes()
    await authHandler({ ...route(), headers, body: { email: 'target@test.com' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.temporaryPassword).toEqual(expect.any(String))
    expect(body.temporaryPassword.length).toBeGreaterThanOrEqual(8)

    expect(mocks.delegates.user.update).toHaveBeenCalledTimes(1)
    const updateArgs = mocks.delegates.user.update.mock.calls[0][0]
    expect(updateArgs.where).toEqual({ id: 'target-1' })
    expect(updateArgs.data.password).not.toBe(body.temporaryPassword)
    expect(bcrypt.compareSync(body.temporaryPassword, updateArgs.data.password)).toBe(true)
  })

  it('non-admin -> 403 and the password stays untouched', async () => {
    const headers = authAs({ role: 'owner' })
    state.targets['target@test.com'] = { id: 'target-1', email: 'target@test.com' }

    const res = mockRes()
    await authHandler({ ...route(), headers, body: { email: 'target@test.com' } }, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mocks.delegates.user.update).not.toHaveBeenCalled()
  })

  it('admin resetting an unknown email -> 200 without temporary password', async () => {
    const headers = authAs({ role: 'admin' })

    const res = mockRes()
    await authHandler({ ...route(), headers, body: { email: 'nobody@test.com' } }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].temporaryPassword).toBeNull()
    expect(mocks.delegates.user.update).not.toHaveBeenCalled()
  })

  it('missing email -> 400', async () => {
    const headers = authAs({ role: 'admin' })
    const res = mockRes()
    await authHandler({ ...route(), headers, body: {} }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
