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
    const params = { mine: 'owner' }
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter

    const result = await apiGet('/reservations', params)
    if (!result.success) {
      console.warn('⚠️ Error fetching owner reservations:', result.error?.message)
      return []
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting owner reservations:', error)
    return []
  }
}

export async function getReservation(reservationId) {
  try {
    const result = await apiGet(`/reservations/${reservationId}`)
    if (!result.success) {
      console.warn('⚠️ Error fetching reservation:', result.error?.message)
      return null
    }
    return normalizeReservation(result.data)
  } catch (error) {
    console.error('Error getting reservation:', error)
    return null
  }
}

export async function updateReservation(reservationId, updates) {
  try {
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
    const result = await apiGet('/reservations', { mine: 'guest' })
    if (!result.success) {
      console.warn('⚠️ Error fetching guest reservations:', result.error?.message)
      return []
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting guest reservations:', error)
    return []
  }
}

export async function getPropertyAvailability(propertyId) {
  try {
    const result = await apiGet(`/properties/${propertyId}/availability`)
    if (!result.success) {
      console.warn('⚠️ Error fetching property availability:', result.error?.message)
      return { blockedDates: [], bookedRanges: [] }
    }
    return result.data || { blockedDates: [], bookedRanges: [] }
  } catch (error) {
    console.error('Error getting property availability:', error)
    return { blockedDates: [], bookedRanges: [] }
  }
}

export async function getPropertyReservations(propertyId) {
  try {
    const result = await apiGet('/reservations', { propertyId })
    if (!result.success) {
      console.warn('⚠️ Error fetching property reservations:', result.error?.message)
      return []
    }
    return (result.data || []).map(normalizeReservation)
  } catch (error) {
    console.error('Error getting property reservations:', error)
    return []
  }
}
