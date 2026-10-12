// tests/unit/auth.test.js
//
// RED unit tests for api/lib/auth.js — JWT middleware matrix (AUTH-01, AUTH-02):
//   no token -> 401 | token sin fila en users -> 403 | rol incorrecto -> 403 |
//   rol permitido -> next (req.auth poblado con rol desde DB, D7).
//
// @prisma/client is mocked (bare specifier, the most robust interception);
// no network/DB.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  jwtVerify: vi.fn(),
}))

vi.mock('jsonwebtoken', () => ({ default: { verify: mocks.jwtVerify } }))
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: mocks.findUnique }
  },
}))

import { requireAuth, requireRole, extractBearer } from '../../api-handlers/lib/auth.js'

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'admin', isActive: true })
  // Mock jwt.verify to return a valid payload for any token
  mocks.jwtVerify.mockReturnValue({ sub: 'uid-1', email: 'x@example.com', role: 'admin' })
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
    mocks.jwtVerify.mockImplementation(() => { throw new Error('JWT expired') })
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
