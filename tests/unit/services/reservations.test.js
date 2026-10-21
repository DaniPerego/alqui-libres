// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createReservation,
  getOwnerReservations,
  getGuestReservations,
  getPropertyReservations,
  confirmReservation,
  rejectReservation,
  cancelReservation,
  deleteReservation
} from '@/services/reservations.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
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

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem('reservations')
})

describe('reservations service (native API)', () => {
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

  it('returns an error when the API rejects the reservation', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: false,
      error: { code: 'VALIDATION', message: 'Property not available' }
    })

    const result = await createReservation({ propertyId: 'p1' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Property not available')
  })

  it('fetches owner reservations from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [backendReservation], meta: { page: 1, limit: 20, total: 1 } }
    })

    const reservations = await getOwnerReservations('owner001')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'owner' })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe('pending')
  })

  it('passes a status filter to the owner endpoint', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [backendReservation], meta: { page: 1, limit: 20, total: 1 } }
    })

    await getOwnerReservations('owner001', 'confirmed')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'owner', status: 'confirmed' })
  })

  it('fetches guest reservations from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [backendReservation], meta: { page: 1, limit: 20, total: 1 } }
    })

    const reservations = await getGuestReservations('guest001')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { mine: 'guest' })
    expect(reservations).toHaveLength(1)
  })

  it('fetches property reservations from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [backendReservation], meta: { page: 1, limit: 20, total: 1 } }
    })

    const reservations = await getPropertyReservations('p1')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reservations', { propertyId: 'p1' })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].property.title).toBe('Casa API')
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
