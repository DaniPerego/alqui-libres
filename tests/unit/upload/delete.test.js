// tests/unit/upload/delete.test.js
//
// Unit tests for api-handlers/upload/delete.js — image deletion guardrails:
//   anonymous -> 401 | guest -> 403 | owner/admin -> { success: true }
import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

const mocks = vi.hoisted(() => ({
  del: vi.fn(),
  findUnique: vi.fn()
}))

vi.mock('@vercel/blob', () => ({ del: mocks.del }))
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: mocks.findUnique }
  }
}))

import deleteHandler from '../../../api-handlers/upload/delete.js'

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  res.json.mockReturnValue(res)
  return res
}

function mockReq({ method = 'POST', body, headers = {} } = {}) {
  return { method, headers, body }
}

function authHeaders(role = 'owner') {
  const token = jwt.sign(
    { sub: 'uid-1', email: 'owner@example.com', role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  return { authorization: `Bearer ${token}` }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'owner', isActive: true })
})

describe('POST /api/upload/delete', () => {
  it('rejects anonymous requests with 401 and does not delete from storage', async () => {
    const res = mockRes()

    await deleteHandler(mockReq({ body: { url: 'https://example.blob/1.jpg' } }), res)

    expect(mocks.del).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: expect.any(String) }
    })
  })

  it('rejects authenticated guests with 403 and does not delete from storage', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'guest', isActive: true })
    const res = mockRes()

    await deleteHandler(
      mockReq({ body: { url: 'https://example.blob/1.jpg' }, headers: authHeaders('guest') }),
      res
    )

    expect(mocks.del).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: expect.any(String) }
    })
  })

  it('lets owners delete a blob and returns { success: true }', async () => {
    const url = 'https://example.blob.vercel-storage.com/properties/1.jpg'
    mocks.del.mockResolvedValue(undefined)
    const res = mockRes()

    await deleteHandler(mockReq({ body: { url }, headers: authHeaders() }), res)

    expect(mocks.del).toHaveBeenCalledTimes(1)
    expect(mocks.del).toHaveBeenCalledWith(url)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('returns { success: true } when the blob is already gone', async () => {
    const url = 'https://example.blob.vercel-storage.com/properties/missing.jpg'
    mocks.del.mockRejectedValue(new Error('blob not found'))
    const res = mockRes()

    await deleteHandler(mockReq({ body: { url }, headers: authHeaders() }), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('rejects non-POST methods', async () => {
    const res = mockRes()

    await deleteHandler(mockReq({ method: 'GET', headers: authHeaders() }), res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'METHOD', message: expect.any(String) }
    })
  })
})
