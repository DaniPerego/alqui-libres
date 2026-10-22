// tests/integration/sitemap.test.js
//
// Integration tests for the public sitemap endpoint with mocked Prisma.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  property: {
    findMany: vi.fn(),
  },
}))

vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client')
  return {
    ...actual,
    PrismaClient: class {
      constructor() {
        this.property = mocks.property
      }
    },
  }
})

import sitemapHandler from '../../api/sitemap.js'

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.property.findMany.mockResolvedValue([])
})

describe('GET /api/sitemap', () => {
  it('returns XML with static routes and a 200 status', async () => {
    const res = mockRes()
    await sitemapHandler({ method: 'GET', query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/xml')

    const xml = res.send.mock.calls[0][0]
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/buscar</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/login</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/registro</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/terminos</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/privacidad</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/contrato</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/faq</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/nosotros</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/como-funciona</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/contacto</loc>')
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/cookies</loc>')
  })

  it('includes active properties and skips inactive/rejected ones', async () => {
    mocks.property.findMany.mockResolvedValue([
      { id: 'p-active', updatedAt: new Date('2026-10-20T00:00:00.000Z') },
    ])

    const res = mockRes()
    await sitemapHandler({ method: 'GET', query: {} }, res)

    const xml = res.send.mock.calls[0][0]
    expect(xml).toContain('<loc>https://alqui-libres.vercel.app/propiedad/p-active</loc>')
    expect(xml).toContain('<lastmod>2026-10-20</lastmod>')
    expect(xml).not.toContain('propiedad/p-inactive')
    expect(xml).not.toContain('propiedad/p-rejected')
    expect(mocks.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'active', isActive: true },
      select: { id: true, updatedAt: true },
    }))
  })

  it('escapes special XML characters in property ids', async () => {
    mocks.property.findMany.mockResolvedValue([
      { id: 'p&1<>2', updatedAt: new Date('2026-10-20T00:00:00.000Z') },
    ])

    const res = mockRes()
    await sitemapHandler({ method: 'GET', query: {} }, res)

    const xml = res.send.mock.calls[0][0]
    expect(xml).toContain('propiedad/p&amp;1&lt;&gt;2')
    expect(xml).not.toContain('propiedad/p&1<>2')
  })

  it('rejects non-GET methods', async () => {
    const res = mockRes()
    await sitemapHandler({ method: 'POST', query: {} }, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'METHOD', message: expect.any(String) } })
  })
})
