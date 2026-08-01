// tests/unit/auth.test.js
//
// RED unit tests for api/lib/auth.js — JWT middleware matrix (AUTH-01, AUTH-02):
//   no token -> 401 | token sin fila en users -> 403 | rol incorrecto -> 403 |
//   rol permitido -> next (req.auth poblado con rol desde DB, D7).
//
// @supabase/supabase-js and @prisma/client are mocked (bare specifiers, the
// most robust interception); no network/DB. getAdminClient() caches the
// service-role client at module level, so the mocked getUser reads the
// mutable `getUserResult` at call time — every test controls the outcome
// without reloading modules.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: mocks.findUnique }
  },
}))

import { requireAuth, requireRole, extractBearer } from '../../api/lib/auth.js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

beforeEach(() => {
  vi.clearAllMocks()
  // getAdminClient() validates env presence before creating the client; the
  // client itself is mocked, so any non-empty values work here.
  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  getUserResult = { data: { user: { id: 'uid-1', email: 'x@example.com' } }, error: null }
  mocks.createClient.mockReturnValue({
    auth: {
      getUser: vi.fn(async () => getUserResult),
    },
  })
  mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'admin', isActive: true })
})

describe('extractBearer', () => {
  it('parsea Bearer token', () => {
    expect(extractBearer({ headers: { authorization: 'Bearer abc.def' } })).toBe('abc.def')
  })
  it('rechaza scheme distinto y header ausente', () => {
    expect(extractBearer({ headers: { authorization: 'Basic abc' } })).toBeNull()
    expect(extractBearer({ headers: {} })).toBeNull()
    expect(extractBearer({})).toBeNull()
  })
})

describe('requireAuth (AUTH-01, AUTH-02)', () => {
  it('sin token -> 401', async () => {
    const res = mockRes()
    const next = vi.fn()
    await requireAuth({ headers: {} }, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'UNAUTHORIZED', message: expect.any(String) } })
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('token invalido/vencido (getUser con error) -> 401', async () => {
    getUserResult = { data: { user: null }, error: { message: 'JWT expired' } }
    const res = mockRes()
    await requireAuth({ headers: { authorization: 'Bearer expirado' } }, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'UNAUTHORIZED', message: expect.any(String) } })
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it('token valido sin fila en users -> 403 (AUTH-02 edge)', async () => {
    mocks.findUnique.mockResolvedValue(null)
    const res = mockRes()
    await requireAuth({ headers: { authorization: 'Bearer tok' } }, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'FORBIDDEN', message: expect.any(String) } })
  })

  it('usuario inactivo -> 403', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'owner', isActive: false })
    const res = mockRes()
    await requireAuth({ headers: { authorization: 'Bearer tok' } }, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'FORBIDDEN', message: expect.any(String) } })
  })

  it('token valido + fila activa -> req.auth con rol desde DB y next() (D7)', async () => {
    const req = { headers: { authorization: 'Bearer tok' } }
    const res = mockRes()
    const next = vi.fn()
    await requireAuth(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(req.auth).toEqual({
      userId: 'uid-1',
      role: 'admin',
      user: { id: 'uid-1', role: 'admin', isActive: true },
    })
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('requireRole (AUTH-02)', () => {
  it('rol incorrecto -> 403', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'guest', isActive: true })
    const req = { headers: { authorization: 'Bearer tok' } }
    const res = mockRes()
    const next = vi.fn()
    await requireAuth(req, res, next)
    expect(next).toHaveBeenCalledTimes(1) // auth paso

    requireRole('admin')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'FORBIDDEN', message: expect.any(String) } })
    expect(next).toHaveBeenCalledTimes(1) // no avanzo
  })

  it('rol permitido -> next()', async () => {
    const req = { headers: { authorization: 'Bearer tok' } }
    const res = mockRes()
    const next = vi.fn()
    await requireAuth(req, res, next)
    requireRole('admin', 'owner')(req, res, next)
    expect(res.status).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('sin req.auth -> 401', () => {
    const res = mockRes()
    const next = vi.fn()
    requireRole('admin')({}, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'UNAUTHORIZED', message: expect.any(String) } })
  })
})
