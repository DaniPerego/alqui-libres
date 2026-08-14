// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createReservation,
  getOwnerReservations,
  getGuestReservations,
  confirmReservation,
  rejectReservation,
  cancelReservation,
  deleteReservation
} from '@/services/reservations.js'

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => false),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn()
}))

vi.mock('@/config/supabase', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  supabase: null
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch,
  apiDelete: mocks.apiDelete
}))

const backendReservation = {
  id: 'res-1',
  propertyId: 'p1',
  ownerId: 'owner001',
  guestId: 'guest001',
  property: { id: 'p1', title: 'Casa API', city: 'Carlos Paz', image: 'img.jpg' },
  guestName: 'API Guest',
  guestEmail: 'guest@example.com',
  guestPhone: '+54',
  ownerName: 'Owner',
  ownerEmail: 'owner@example.com',
  checkIn: '2025-12-20',
  checkOut: '2025-12-25',
  nights: 5,
  guests: 4,
  basePrice: 100,
  cleaningFee: 20,
  total: 520,
  message: 'Hi',
  status: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

function normalizedReservation(r) {
  return {
    ...r,
    property: {
      ...r.property,
      location: r.property.city
    },
    guest: {
      name: r.guestName,
      email: r.guestEmail,
      phone: r.guestPhone
    },
    totalPrice: r.total
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem('reservations')
  mocks.isSupabaseConfigured.mockReturnValue(false)
})

describe('reservations service (demo mode)', () => {
  it('creates a demo reservation and stores it in localStorage', async () => {
    const result = await createReservation({
      propertyId: 'p1',
      checkIn: '2025-12-20',
      checkOut: '2025-12-25',
      guests: 4,
      guestName: 'Demo Guest',
      guestEmail: 'demo@example.com',
      guestPhone: '+54',
      property: { title: 'Casa Demo', city: 'Carlos Paz', image: 'img.jpg' },
      total: 500
    })

    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('pending')
    expect(result.reservation.guest.name).toBe('Demo Guest')
    expect(result.reservation.totalPrice).toBe(500)

    const stored = JSON.parse(localStorage.getItem('reservations'))
    expect(stored).toHaveLength(1)
    expect(stored[0].guest.email).toBe('demo@example.com')
  })

  it('returns owner reservations from localStorage', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const reservations = await getOwnerReservations('owner001')

    expect(reservations).toHaveLength(1)
    expect(reservations[0].id).toBe('1')
  })

  it('filters owner reservations by status', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() },
      { id: '2', ownerId: 'owner001', status: 'confirmed', property: { title: 'B' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const reservations = await getOwnerReservations('owner001', 'confirmed')

    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe('confirmed')
  })

  it('returns guest reservations from localStorage', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', guestId: 'guest001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const reservations = await getGuestReservations('guest001')

    expect(reservations).toHaveLength(1)
  })

  it('confirms a demo reservation', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const result = await confirmReservation('1')

    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('confirmed')
    const stored = JSON.parse(localStorage.getItem('reservations'))
    expect(stored[0].status).toBe('confirmed')
  })

  it('rejects a demo reservation with a reason', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const result = await rejectReservation('1', 'No disponible')

    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('rejected')
    const stored = JSON.parse(localStorage.getItem('reservations'))
    expect(stored[0].rejectionReason).toBe('No disponible')
  })

  it('cancels a demo reservation', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'confirmed', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const result = await cancelReservation('1', 'owner')

    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('cancelled')
    const stored = JSON.parse(localStorage.getItem('reservations'))
    expect(stored[0].status).toBe('cancelled')
  })

  it('deletes a demo reservation from localStorage', async () => {
    localStorage.setItem('reservations', JSON.stringify([
      { id: '1', ownerId: 'owner001', status: 'pending', property: { title: 'A' }, guest: { name: 'G' }, totalPrice: 100, createdAt: Date.now() }
    ]))

    const result = await deleteReservation('1')

    expect(result.success).toBe(true)
    expect(JSON.parse(localStorage.getItem('reservations'))).toHaveLength(0)
  })
})

describe('reservations service (Supabase mode)', () => {
  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true)
  })

  it('creates a reservation via the API', async () => {
    mocks.apiPost.mockResolvedValueOnce({ success: true, data: backendReservation })

    const result = await createReservation({
      propertyId: 'p1',
      checkIn: '2025-12-20',
      checkOut: '2025-12-25',
      guests: 4,
      guestName: 'API Guest',
      guestEmail: 'guest@example.com',
      guestPhone: '+54',
      message: 'Hi'
    })

    expect(mocks.apiPost).toHaveBeenCalledWith('/reservations', expect.objectContaining({
      propertyId: 'p1',
      checkIn: '2025-12-20',
      checkOut: '2025-12-25',
      guests: 4
    }))
    expect(result.success).toBe(true)
    expect(result.reservation.property.title).toBe('Casa API')
    expect(result.reservation.guest.name).toBe('API Guest')
    expect(result.reservation.totalPrice).toBe(520)
  })

  it('fetches owner reservations from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [backendReservation] })

    const reservations = await getOwnerReservations('owner001')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'owner' })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe('pending')
  })

  it('passes a status filter to the owner endpoint', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [backendReservation] })

    await getOwnerReservations('owner001', 'confirmed')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'owner', status: 'confirmed' })
  })

  it('fetches guest reservations from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [backendReservation] })

    const reservations = await getGuestReservations('guest001')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'guest' })
    expect(reservations).toHaveLength(1)
  })

  it('confirms a reservation via the API', async () => {
    const confirmed = { ...backendReservation, status: 'confirmed' }
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: confirmed })

    const result = await confirmReservation('res-1')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/reservations/res-1/status', { status: 'confirmed' })
    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('confirmed')
  })

  it('rejects a reservation via the API', async () => {
    const rejected = { ...backendReservation, status: 'rejected', rejectionReason: 'No' }
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: rejected })

    const result = await rejectReservation('res-1', 'No')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/reservations/res-1/status', { status: 'rejected', reason: 'No' })
    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('rejected')
  })

  it('cancels a reservation via the API', async () => {
    const cancelled = { ...backendReservation, status: 'cancelled', cancelledBy: 'owner' }
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: cancelled })

    const result = await cancelReservation('res-1', 'owner')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/reservations/res-1/status', { status: 'cancelled' })
    expect(result.success).toBe(true)
    expect(result.reservation.status).toBe('cancelled')
  })

  it('deletes a reservation via the API', async () => {
    mocks.apiDelete.mockResolvedValueOnce({ success: true, data: { deleted: true, id: 'res-1' } })

    const result = await deleteReservation('res-1')

    expect(mocks.apiDelete).toHaveBeenCalledWith('/reservations/res-1')
    expect(result.success).toBe(true)
  })
})
