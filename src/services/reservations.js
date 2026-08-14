import { isSupabaseConfigured } from '@/config/supabase'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api'

const STORAGE_KEY = 'reservations'

function loadReservations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveReservations(reservations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations))
  } catch {}
}

function isFrontendShape(r) {
  return r && typeof r.guest === 'object' && typeof r.property === 'object' && r.totalPrice !== undefined
}

function normalizeReservation(r) {
  if (!r) return null
  if (isFrontendShape(r)) return r

  const propertyData = r.property || {}
  return {
    ...r,
    property: {
      id: r.propertyId,
      title: propertyData.title || '',
      location: propertyData.city || '',
      image: propertyData.image || ''
    },
    guest: {
      name: r.guestName || '',
      email: r.guestEmail || '',
      phone: r.guestPhone || ''
    },
    totalPrice: r.total ?? 0,
    createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
  }
}

function updateStoredReservation(reservationId, updater) {
  const stored = loadReservations()
  const index = stored.findIndex(r => r.id === reservationId)
  if (index !== -1) {
    stored[index] = updater(stored[index])
    saveReservations(stored)
  }
}

export async function createReservation(reservationData) {
  try {
    if (!isSupabaseConfigured()) {
      const reservations = loadReservations()
      const reservation = {
        id: `demo-${Date.now()}`,
        propertyId: reservationData.propertyId,
        ownerId: reservationData.ownerId,
        guestId: reservationData.guestId,
        property: reservationData.property || {
          id: reservationData.propertyId,
          title: '',
          location: '',
          image: ''
        },
        guest: {
          name: reservationData.guestName || '',
          email: reservationData.guestEmail || '',
          phone: reservationData.guestPhone || ''
        },
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        nights: reservationData.nights ?? 0,
        guests: reservationData.guests,
        basePrice: reservationData.basePrice ?? 0,
        cleaningFee: reservationData.cleaningFee ?? 0,
        totalPrice: reservationData.total ?? 0,
        message: reservationData.message || '',
        status: 'pending',
        createdAt: Date.now()
      }
      reservations.unshift(reservation)
      saveReservations(reservations)
      return { success: true, reservation }
    }

    const payload = {
      propertyId: reservationData.propertyId,
      checkIn: reservationData.checkIn,
      checkOut: reservationData.checkOut,
      guests: reservationData.guests,
      guestName: reservationData.guestName,
      guestEmail: reservationData.guestEmail,
      guestPhone: reservationData.guestPhone,
      message: reservationData.message
    }

    const result = await apiPost('/reservations', payload)
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to create reservation' }
    }

    const reservation = normalizeReservation(result.data)
    const stored = loadReservations()
    stored.unshift(reservation)
    saveReservations(stored)
    return { success: true, reservation }
  } catch (error) {
    console.error('Error creating reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function getOwnerReservations(ownerId, statusFilter = null) {
  try {
    if (!isSupabaseConfigured()) {
      const reservations = loadReservations().filter(r => r.ownerId === ownerId)
      if (statusFilter && statusFilter !== 'all') {
        return reservations.filter(r => r.status === statusFilter)
      }
      return reservations
    }

    const params = { mine: 'owner' }
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter

    const result = await apiGet('/reservations', params)
    if (!result.success) {
      console.warn('⚠️ Error fetching owner reservations, using localStorage:', result.error?.message)
      return loadReservations().filter(r => r.ownerId === ownerId)
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting owner reservations:', error)
    return loadReservations().filter(r => r.ownerId === ownerId)
  }
}

export async function getReservation(reservationId) {
  try {
    if (!isSupabaseConfigured()) {
      return loadReservations().find(r => r.id === reservationId) || null
    }

    const result = await apiGet(`/reservations/${reservationId}`)
    if (!result.success) {
      console.warn('⚠️ Error fetching reservation, using localStorage:', result.error?.message)
      return loadReservations().find(r => r.id === reservationId) || null
    }
    return normalizeReservation(result.data)
  } catch (error) {
    console.error('Error getting reservation:', error)
    return loadReservations().find(r => r.id === reservationId) || null
  }
}

export async function updateReservation(reservationId, updates) {
  try {
    if (!isSupabaseConfigured()) {
      updateStoredReservation(reservationId, r => ({ ...r, ...updates }))
      return { id: reservationId, ...updates }
    }

    const result = await apiPatch(`/reservations/${reservationId}`, updates)
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to update reservation' }
    }
    const updated = normalizeReservation(result.data)
    updateStoredReservation(reservationId, () => updated)
    return { success: true, reservation: updated }
  } catch (error) {
    console.error('Error updating reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function confirmReservation(reservationId) {
  try {
    if (!isSupabaseConfigured()) {
      updateStoredReservation(reservationId, r => ({ ...r, status: 'confirmed', confirmedAt: Date.now() }))
      return { success: true, reservation: loadReservations().find(r => r.id === reservationId) }
    }

    const result = await apiPatch(`/reservations/${reservationId}/status`, { status: 'confirmed' })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to confirm reservation' }
    }
    const updated = normalizeReservation(result.data)
    updateStoredReservation(reservationId, () => updated)
    return { success: true, reservation: updated }
  } catch (error) {
    console.error('Error confirming reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectReservation(reservationId, reason = '') {
  try {
    if (!isSupabaseConfigured()) {
      updateStoredReservation(reservationId, r => ({
        ...r,
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: Date.now()
      }))
      return { success: true, reservation: loadReservations().find(r => r.id === reservationId) }
    }

    const result = await apiPatch(`/reservations/${reservationId}/status`, { status: 'rejected', reason })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to reject reservation' }
    }
    const updated = normalizeReservation(result.data)
    updateStoredReservation(reservationId, () => updated)
    return { success: true, reservation: updated }
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function cancelReservation(reservationId, cancelledBy = 'owner') {
  try {
    if (!isSupabaseConfigured()) {
      updateStoredReservation(reservationId, r => ({
        ...r,
        status: 'cancelled',
        cancelledBy,
        cancelledAt: Date.now()
      }))
      return { success: true, reservation: loadReservations().find(r => r.id === reservationId) }
    }

    const result = await apiPatch(`/reservations/${reservationId}/status`, { status: 'cancelled' })
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to cancel reservation' }
    }
    const updated = normalizeReservation(result.data)
    updateStoredReservation(reservationId, () => updated)
    return { success: true, reservation: updated }
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteReservation(reservationId) {
  try {
    if (!isSupabaseConfigured()) {
      const reservations = loadReservations().filter(r => r.id !== reservationId)
      saveReservations(reservations)
      return { success: true, id: reservationId }
    }

    const result = await apiDelete(`/reservations/${reservationId}`)
    if (!result.success) {
      return { success: false, error: result.error?.message || 'Failed to delete reservation' }
    }
    const reservations = loadReservations().filter(r => r.id !== reservationId)
    saveReservations(reservations)
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return { success: false, error: error.message }
  }
}

export async function getGuestReservations(guestId) {
  try {
    if (!isSupabaseConfigured()) {
      return loadReservations().filter(r => r.guestId === guestId)
    }

    const result = await apiGet('/reservations', { mine: 'guest' })
    if (!result.success) {
      console.warn('⚠️ Error fetching guest reservations, using localStorage:', result.error?.message)
      return loadReservations().filter(r => r.guestId === guestId)
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting guest reservations:', error)
    return loadReservations().filter(r => r.guestId === guestId)
  }
}

export async function getPropertyReservations(propertyId) {
  try {
    if (!isSupabaseConfigured()) {
      return loadReservations().filter(r => r.propertyId === propertyId)
    }

    const result = await apiGet('/reservations', { propertyId })
    if (!result.success) {
      console.warn('⚠️ Error fetching property reservations, using localStorage:', result.error?.message)
      return loadReservations().filter(r => r.propertyId === propertyId)
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting property reservations:', error)
    return loadReservations().filter(r => r.propertyId === propertyId)
  }
}
