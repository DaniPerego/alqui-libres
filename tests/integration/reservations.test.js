// tests/integration/reservations.test.js
//
// Integration tests for the reservations handlers with mocked Prisma
// (API-01, API-02, API-04, AUTH-01, AUTH-04):
//   anon POST -> 401, guest POST creates reservation + owner notification row,
//   overlap -> 409, PATCH confirm -> guest notification row,
//   PATCH cancel -> NO notification row, GET non-participant -> 404.
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

import reservationsHandler from '../../api/reservations.js'
import reservationDetailHandler from '../../api/reservations/[id].js'
import reservationStatusHandler from '../../api/reservations/[id]/status.js'

let getUserResult

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

function authAs({ uid = 'guest-1', role = 'guest', email = 'guest@test.com', displayName = 'Guest Test' } = {}) {
  getUserResult = { data: { user: { id: uid, email } }, error: null }
  mocks.delegates.user.findUnique.mockResolvedValue({ id: uid, role, isActive: true, displayName, email })
  return { uid, role }
}

function anon() {
  getUserResult = { data: { user: null }, error: { message: 'missing token' } }
}

const activeProperty = {
  id: 'p1', title: 'Casa', locationCity: 'Mar del Plata', mainImage: 'img.jpg',
  ownerId: 'owner-1', ownerName: 'Owner Test', ownerEmail: 'owner@test.com', ownerPhone: null,
  pricingBasePrice: 100, pricingCleaningFee: 20, isActive: true,
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
  mocks.delegates.reservation.findMany.mockResolvedValue([])
  mocks.delegates.reservation.count.mockResolvedValue(0)
  mocks.delegates.reservation.findUnique.mockResolvedValue(null)
  mocks.delegates.reservation.findFirst.mockResolvedValue(null)
  mocks.delegates.property.findUnique.mockResolvedValue(null)
})

describe('GET /api/reservations', () => {
  it('anon -> 401', async () => {
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('guest sin mine -> ve propias como guest y owner', async () => {
    authAs()
    mocks.delegates.reservation.findMany.mockResolvedValue([{ id: 'r1' }])
    mocks.delegates.reservation.count.mockResolvedValue(1)
    const res = mockRes()
    await reservationsHandler({ query: {}, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.reservation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ ownerId: 'guest-1' }, { guestId: 'guest-1' }] },
    }))
  })

  it('admin sin mine -> ve todas', async () => {
    authAs({ role: 'admin' })
    mocks.delegates.reservation.findMany.mockResolvedValue([{ id: 'r1' }])
    mocks.delegates.reservation.count.mockResolvedValue(1)
    const res = mockRes()
    await reservationsHandler({ query: {}, headers: { authorization: 'Bearer tok' }, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.reservation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})

describe('POST /api/reservations', () => {
  const validBody = { propertyId: 'p1', checkIn: '2026-09-01', checkOut: '2026-09-04', guests: 2, message: 'Hola' }

  it('anon -> 401 (AUTH-04)', async () => {
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: {}, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('owner no puede reservar como guest -> 403 (API-02)', async () => {
    authAs({ role: 'owner' })
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('guest -> 201, guestId del token, notificacion para el owner (API-04)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(activeProperty)
    mocks.delegates.reservation.create.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }))
    mocks.delegates.notification.create.mockResolvedValue({ id: 'n1' })
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(201)
    const createArgs = mocks.delegates.reservation.create.mock.calls[0][0]
    expect(createArgs.data.guestId).toBe('guest-1')
    expect(createArgs.data.ownerId).toBe('owner-1')
    expect(createArgs.data.status).toBe('pending')
    expect(createArgs.data.nights).toBe(3)
    expect(createArgs.data.total).toBe(3 * 100 + 20)
    // notification row for the OWNER
    expect(mocks.delegates.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'owner-1', type: 'reservation' }),
    }))
  })

  it('fechas invalidas -> 400', async () => {
    authAs()
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: { ...validBody, checkOut: '2026-08-01' } }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('overlap con reserva pendiente/confirmada -> 409 (API-04)', async () => {
    authAs()
    mocks.delegates.property.findUnique.mockResolvedValue(activeProperty)
    mocks.delegates.reservation.findFirst.mockResolvedValue({ id: 'r-existente', status: 'pending' })
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: expect.any(String) } })
    expect(mocks.delegates.reservation.create).not.toHaveBeenCalled()
  })

  it('propiedad inexistente o inactiva -> 404', async () => {
    authAs()
    const res = mockRes()
    await reservationsHandler({ query: {}, method: 'POST', headers: { authorization: 'Bearer tok' }, body: validBody }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('GET /api/reservations/[id]', () => {
  it('no participante -> 404 (API-02)', async () => {
    authAs()
    mocks.delegates.reservation.findUnique.mockResolvedValue({ id: 'r1', ownerId: 'owner-9', guestId: 'guest-9' })
    const res = mockRes()
    await reservationDetailHandler({ query: { id: 'r1' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('participante -> 200', async () => {
    authAs({ uid: 'owner-1', role: 'owner' })
    mocks.delegates.reservation.findUnique.mockResolvedValue({ id: 'r1', ownerId: 'owner-1', guestId: 'guest-1' })
    const res = mockRes()
    await reservationDetailHandler({ query: { id: 'r1' }, method: 'GET', headers: { authorization: 'Bearer tok' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('PATCH /api/reservations/[id]/status (API-04 / D6)', () => {
  const reservation = { id: 'r1', propertyId: 'p1', ownerId: 'owner-1', guestId: 'guest-1', status: 'pending' }

  it('anon -> 401', async () => {
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: {}, body: { status: 'confirmed' } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('transicion invalida (confirmed->confirmed) -> 409', async () => {
    authAs({ uid: 'owner-1', role: 'owner' })
    mocks.delegates.reservation.findUnique.mockResolvedValue({ ...reservation, status: 'confirmed' })
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'confirmed' } }, res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'CONFLICT', message: expect.any(String) } })
  })

  it('guest intenta confirmar -> 403', async () => {
    authAs({ uid: 'guest-1', role: 'guest' })
    mocks.delegates.reservation.findUnique.mockResolvedValue(reservation)
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'confirmed' } }, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('owner confirma -> 200 + notificacion para el GUEST (API-04)', async () => {
    authAs({ uid: 'owner-1', role: 'owner' })
    mocks.delegates.reservation.findUnique.mockResolvedValue(reservation)
    mocks.delegates.reservation.update.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }))
    mocks.delegates.notification.create.mockResolvedValue({ id: 'n1' })
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'confirmed' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'confirmed', confirmedAt: expect.any(Date) }),
    }))
    const notifArgs = mocks.delegates.notification.create.mock.calls[0][0]
    expect(notifArgs.data.userId).toBe('guest-1')
    expect(notifArgs.data.type).toBe('reservation')
  })

  it('owner rechaza -> 200 + rejectionReason + notificacion al guest', async () => {
    authAs({ uid: 'owner-1', role: 'owner' })
    mocks.delegates.reservation.findUnique.mockResolvedValue(reservation)
    mocks.delegates.reservation.update.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }))
    mocks.delegates.notification.create.mockResolvedValue({ id: 'n1' })
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'rejected', reason: 'No disponible' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.delegates.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'rejected', rejectionReason: 'No disponible' }),
    }))
    expect(mocks.delegates.notification.create).toHaveBeenCalledTimes(1)
  })

  it('cancel silencioso: guest cancela -> 200 y NO crea notificacion (API-04)', async () => {
    authAs({ uid: 'guest-1', role: 'guest' })
    mocks.delegates.reservation.findUnique.mockResolvedValue({ ...reservation, status: 'confirmed' })
    mocks.delegates.reservation.update.mockImplementation(async ({ data }) => ({ id: 'r1', ...data }))
    const res = mockRes()
    await reservationStatusHandler({ query: { id: 'r1' }, method: 'PATCH', headers: { authorization: 'Bearer tok' }, body: { status: 'cancelled' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const updateArgs = mocks.delegates.reservation.update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('cancelled')
    expect(updateArgs.data.cancelledBy).toBe('guest')
    expect(mocks.delegates.notification.create).not.toHaveBeenCalled()
  })
})
