// tests/unit/upload.test.js
//
// Unit tests for api-handlers/upload.js — multipart upload guardrails:
//   anonymous -> 401 | guest -> 403 | owner/admin -> body validated
//   oversized request -> 400 VALIDATION (no storage write)
//   non-image file    -> 400 VALIDATION (no storage write)
//   valid image       -> 200 with public URL (storage dependency mocked)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  findUnique: vi.fn()
}))

vi.mock('@vercel/blob', () => ({ put: mocks.put }))
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: mocks.findUnique }
  }
}))

import uploadHandler from '../../api-handlers/upload.js'

function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  res.json.mockReturnValue(res)
  return res
}

function authHeaders(role = 'owner') {
  const token = jwt.sign(
    { sub: 'uid-1', email: 'owner@example.com', role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  return { authorization: `Bearer ${token}` }
}

function buildMultipart({ filename = 'test.jpg', contentType = 'image/jpeg', body = Buffer.from('fake-image') }) {
  const boundary = '----TestBoundary42'
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  )
  const tail = Buffer.from(`\r\n--${boundary}--`)
  return {
    boundary,
    body: Buffer.concat([head, body, tail])
  }
}

function mockReq({ method = 'POST', body, boundary, headers = {} } = {}) {
  return {
    method,
    headers: {
      'content-type': boundary ? `multipart/form-data; boundary=${boundary}` : '',
      ...headers
    },
    on(event, cb) {
      if (event === 'data') {
        // Emit body in chunks to exercise the streaming size guard
        const chunkSize = 1024
        for (let i = 0; i < body.length; i += chunkSize) {
          cb(body.slice(i, i + chunkSize))
        }
      }
      if (event === 'end') cb()
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'owner', isActive: true })
})

describe('POST /api/upload', () => {
  it('rejects anonymous requests with 401 and does not write to storage', async () => {
    const { boundary, body } = buildMultipart({
      filename: 'room.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('valid-jpeg-bytes')
    })
    const res = mockRes()

    await uploadHandler(mockReq({ boundary, body }), res)

    expect(mocks.put).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: expect.any(String) }
    })
  })

  it('rejects authenticated guests with 403 and does not write to storage', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'uid-1', role: 'guest', isActive: true })
    const { boundary, body } = buildMultipart({
      filename: 'room.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('valid-jpeg-bytes')
    })
    const res = mockRes()

    await uploadHandler(mockReq({ boundary, body, headers: authHeaders('guest') }), res)

    expect(mocks.put).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: expect.any(String) }
    })
  })

  it('rejects requests larger than 5MB without writing to storage', async () => {
    const { boundary } = buildMultipart({
      filename: 'big.jpg',
      contentType: 'image/jpeg',
      body: Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)
    })
    const bigBody = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)
    const res = mockRes()

    await uploadHandler(mockReq({ boundary, body: bigBody, headers: authHeaders() }), res)

    expect(mocks.put).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION',
        message: expect.stringMatching(/5MB/i)
      }
    })
  })

  it('rejects non-image content types without writing to storage', async () => {
    const { boundary, body } = buildMultipart({
      filename: 'malicious.exe',
      contentType: 'application/octet-stream',
      body: Buffer.from('MZ')
    })
    const res = mockRes()

    await uploadHandler(mockReq({ boundary, body, headers: authHeaders() }), res)

    expect(mocks.put).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION',
        message: expect.stringMatching(/Invalid file type/i)
      }
    })
  })

  it('accepts a valid image and returns the public blob URL', async () => {
    mocks.put.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/properties/123456.jpg',
      pathname: 'properties/123456.jpg'
    })

    const { boundary, body } = buildMultipart({
      filename: 'room.jpg',
      contentType: 'image/jpeg',
      body: Buffer.from('valid-jpeg-bytes')
    })
    const res = mockRes()

    await uploadHandler(mockReq({ boundary, body, headers: { ...authHeaders(), 'x-upload-type': 'property' } }), res)

    expect(mocks.put).toHaveBeenCalledTimes(1)
    expect(mocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^properties\/\d+-[a-z0-9]+\.jpg$/),
      expect.any(Buffer),
      expect.objectContaining({ access: 'public', contentType: 'image/jpeg' })
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      url: 'https://example.blob.vercel-storage.com/properties/123456.jpg',
      filePath: 'properties/123456.jpg'
    })
  })

  it('rejects non-POST methods', async () => {
    const res = mockRes()
    await uploadHandler(mockReq({ method: 'GET', body: Buffer.alloc(0), headers: authHeaders() }), res)
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'METHOD', message: expect.any(String) }
    })
  })
})
