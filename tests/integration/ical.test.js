// tests/integration/ical.test.js
//
// Integration tests for the iCal subscription + calendar feed handlers:
//   GET  /api/properties/:id/calendar  — public feed (active properties only)
//   POST /api/properties/:id/ical      — owner/admin sync (auth + role gated)
//   DELETE /api/properties/:id/ical    — owner/admin unsubscribe
//   routing — the catch-all dispatcher resolves both new sub-routes.
//
// fetchIcal is mocked (network); parseIcal/serializeIcal stay real so the
// contract exercised here is the one production runs.
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

const fetchIcalMock = vi.hoisted(() => vi.fn())

vi.mock('../../api-handlers/lib/ical.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetchIcal: fetchIcalMock }
})

import calendarHandler from '../../api-handlers/properties/[id]/calendar.js'
import icalHandler from '../../api-handlers/properties/[id]/ical.js'
import dispatchHandler from '../../api/[...slug].js'

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) { this.statusCode = code; return this },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this },
    json(payload) { this.body = payload; return this },
    end(payload) { this.body = payload; return this },
  }
  return res
}

const ACTIVE_PROPERTY = {
  id: 'p1',
  title: 'Depto centro',
  status: 'active',
  isActive: true,
  ownerId: 'owner-1',
  availability: {
    blockedDates: ['2026-07-01'],
    ical: {
      url: 'https://calendar.example.com/feed.ics',
      syncedAt: '2026-01-01T00:00:00.000Z',
      eventCount: 1,
      events: [{ start: '2026-08-10', end: '2026-08-12', summary: 'External' }],
    },
  },
}

function authAs({ uid = 'owner-1', role = 'owner' } = {}) {
  mocks.delegates.user.findUnique.mockResolvedValue({
    id: uid, role, isActive: true, displayName: 'Owner', email: 'owner@test.com',
  })
  return makeAuthHeaders({ uid, role, email: 'owner@test.com' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.$queryRaw.mockResolvedValue([])
  mocks.delegates.property.findUnique.mockResolvedValue(null)
  mocks.delegates.property.update.mockResolvedValue({})
})

describe('GET /api/properties/:id/calendar (public feed)', () => {
  it('une reservas, bloqueos manuales e iCal importado en text/calendar', async () => {
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)
    mocks.delegates.reservation.findMany.mockResolvedValue([
      { checkIn: new Date('2026-09-01T00:00:00.000Z'), checkOut: new Date('2026-09-05T00:00:00.000Z') },
    ])

    const res = mockRes()
    await calendarHandler({ method: 'GET', query: { id: 'p1' } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8')
    expect(res.headers['content-disposition']).toContain('alquilibres-p1.ics')

    const body = res.body
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('SUMMARY:Reserved')
    expect(body).toContain('DTSTART;VALUE=DATE:20260901')
    expect(body).toContain('DTEND;VALUE=DATE:20260905')
    // manual blocked day + imported external event
    expect(body).toContain('SUMMARY:Blocked')
    expect(body).toContain('SUMMARY:External')
    expect(body).toContain('DTSTART;VALUE=DATE:20260701')
    expect(body).toContain('DTSTART;VALUE=DATE:20260810')
  })

  it('404 si la propiedad no existe, no está activa o fue desactivada', async () => {
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    let res = mockRes()
    await calendarHandler({ method: 'GET', query: { id: 'nope' } }, res)
    expect(res.statusCode).toBe(404)

    mocks.delegates.property.findUnique.mockResolvedValue({ ...ACTIVE_PROPERTY, status: 'draft' })
    res = mockRes()
    await calendarHandler({ method: 'GET', query: { id: 'p1' } }, res)
    expect(res.statusCode).toBe(404)

    mocks.delegates.property.findUnique.mockResolvedValue({ ...ACTIVE_PROPERTY, isActive: false })
    res = mockRes()
    await calendarHandler({ method: 'GET', query: { id: 'p1' } }, res)
    expect(res.statusCode).toBe(404)
  })

  it('405 para métodos que no sean GET y 400 si falta el id', async () => {
    let res = mockRes()
    await calendarHandler({ method: 'POST', query: { id: 'p1' } }, res)
    expect(res.statusCode).toBe(405)

    res = mockRes()
    await calendarHandler({ method: 'GET', query: {} }, res)
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/properties/:id/ical (sync)', () => {
  it('401 sin token y 403 con rol no permitido', async () => {
    let res = mockRes()
    await icalHandler({ method: 'POST', query: { id: 'p1' }, headers: {}, body: { url: 'https://x.com/a.ics' } }, res)
    expect(res.statusCode).toBe(401)

    const headers = authAs({ role: 'guest' })
    res = mockRes()
    await icalHandler({ method: 'POST', query: { id: 'p1' }, headers, body: { url: 'https://x.com/a.ics' } }, res)
    expect(res.statusCode).toBe(403)
  })

  it('owner sin propiedad -> 404; propiedad ajena -> 403', async () => {
    const headers = authAs({ role: 'owner' })
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    let res = mockRes()
    await icalHandler({ method: 'POST', query: { id: 'nope' }, headers, body: { url: 'https://x.com/a.ics' } }, res)
    expect(res.statusCode).toBe(404)

    mocks.delegates.property.findUnique.mockResolvedValue({ ...ACTIVE_PROPERTY, ownerId: 'otro-owner' })
    res = mockRes()
    await icalHandler({ method: 'POST', query: { id: 'p1' }, headers, body: { url: 'https://x.com/a.ics' } }, res)
    expect(res.statusCode).toBe(403)
  })

  it('400 si falta la URL', async () => {
    const headers = authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)
    const res = mockRes()
    await icalHandler({ method: 'POST', query: { id: 'p1' }, headers, body: {} }, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error.message).toContain('url')
  })

  it('owner sincroniza: guarda availability.ical y devuelve blockedDays', async () => {
    const headers = authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)
    fetchIcalMock.mockResolvedValue([
      'BEGIN:VCALENDAR', 'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20261105',
      'DTEND;VALUE=DATE:20261108',
      'SUMMARY:Airbnb block',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n'))

    const res = mockRes()
    await icalHandler(
      { method: 'POST', query: { id: 'p1' }, headers, body: { url: 'https://calendar.example.com/f.ics' } },
      res
    )

    expect(res.statusCode).toBe(200)
    expect(res.body.eventCount).toBe(1)
    expect(res.body.blockedDays).toEqual(['2026-11-05', '2026-11-06', '2026-11-07'])
    expect(res.body.url).toBe('https://calendar.example.com/f.ics')
    expect(mocks.delegates.property.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: {
        availability: expect.objectContaining({
          ical: expect.objectContaining({ eventCount: 1 }),
          blockedDates: ['2026-07-01'],
        }),
      },
    })
    // Manual blocked dates must survive a sync.
    expect(res.body.blockedDays).not.toContain('2026-07-01')
  })
})

describe('DELETE /api/properties/:id/ical (unsubscribe)', () => {
  it('quita la suscripción preservando blockedDates manuales', async () => {
    const headers = authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)

    const res = mockRes()
    await icalHandler({ method: 'DELETE', query: { id: 'p1' }, headers }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.removed).toBe(true)
    expect(mocks.delegates.property.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { availability: { blockedDates: ['2026-07-01'] } },
    })
  })

  it('si no había suscripción responde removed: false', async () => {
    const headers = authAs()
    mocks.delegates.property.findUnique.mockResolvedValue({ ...ACTIVE_PROPERTY, availability: null })

    const res = mockRes()
    await icalHandler({ method: 'DELETE', query: { id: 'p1' }, headers }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.removed).toBe(false)
    expect(mocks.delegates.property.update).not.toHaveBeenCalled()
  })
})

describe('catch-all dispatcher routing', () => {
  it('resuelve /api/properties/:id/calendar y /api/properties/:id/ical', async () => {
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)
    mocks.delegates.reservation.findMany.mockResolvedValue([])

    const res = mockRes()
    await dispatchHandler(
      { method: 'GET', url: '/api/properties/p1/calendar', query: {} },
      res
    )
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8')

    // Dynamic id must be injected into req.query for the handler.
    mocks.delegates.property.findUnique.mockResolvedValue(null)
    const res2 = mockRes()
    await dispatchHandler(
      { method: 'GET', url: '/api/properties/xyz', query: {} },
      res2
    )
    expect(res2.statusCode).toBe(404)
  })

  it('el dispatcher no captura el iCal en la ruta genérica de propiedad', async () => {
    const headers = authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(ACTIVE_PROPERTY)
    fetchIcalMock.mockResolvedValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR')

    const res = mockRes()
    await dispatchHandler(
      { method: 'POST', url: '/api/properties/p1/ical', query: { id: 'p1' }, headers, body: { url: 'https://calendar.example.com/f.ics' } },
      res
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('blockedDays')
  })
})