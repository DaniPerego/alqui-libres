import { apiGet, apiPost, apiPatch, toList, isDemoMode } from '@/services/api'
import { mockReviews } from '@/data/mockData'

const STORAGE_KEY = 'alquilibres_reviews'

function loadReviews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return isDemoMode() ? [...mockReviews] : []
}

function saveReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
  } catch {}
}

function sortByNewest(reviews) {
  return [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function resolvePropertyId(review) {
  return review.propertyId || review.listingId
}

function normalizeReview(row) {
  if (!row) return null
  return {
    ...row,
    reply: row.ownerResponse ?? row.reply ?? null,
    ownerResponse: row.ownerResponse ?? null,
    ownerRespondedAt: row.ownerRespondedAt ?? null,
  }
}

function isNetworkError(resultOrError) {
  if (resultOrError && typeof resultOrError === 'object') {
    return resultOrError.code === 'NETWORK_ERROR' || resultOrError.code === 'NETWORK'
  }
  return false
}

function shouldUseOfflineFallback(resultOrError) {
  return isDemoMode() && isNetworkError(resultOrError)
}

export async function getPropertyReviews(propertyId, options = {}) {
  const { throwOnError = false } = options

  try {
    const result = await apiGet('/reviews', { propertyId }, { public: true })
    if (!result.success) {
      if (shouldUseOfflineFallback(result.error)) {
        console.warn('⚠️ Error fetching reviews, using offline demo data:', result.error?.message)
        const reviews = loadReviews()
        return sortByNewest(reviews.filter(r => r.listingId === propertyId || r.propertyId === propertyId).map(normalizeReview))
      }
      const error = new Error(result.error?.message || 'Failed to fetch reviews')
      if (throwOnError) throw error
      console.error('Error fetching reviews:', error)
      return []
    }
    return sortByNewest(toList(result.data).map(normalizeReview))
  } catch (error) {
    if (shouldUseOfflineFallback(error)) {
      const reviews = loadReviews()
      return sortByNewest(reviews.filter(r => r.listingId === propertyId || r.propertyId === propertyId).map(normalizeReview))
    }
    if (throwOnError) throw error
    console.error('Error fetching reviews:', error)
    return []
  }
}

export async function addReview(review) {
  const payload = {
    propertyId: resolvePropertyId(review),
    rating: review.rating,
    comment: review.comment,
    guestName: review.guestName,
    ratings: review.ratings
  }
  const result = await apiPost('/reviews', payload)
  if (!result.success) {
    if (shouldUseOfflineFallback(result.error)) {
      console.warn('⚠️ Error adding review, using offline demo data:', result.error?.message)
      const reviews = loadReviews()
      const propertyId = resolvePropertyId(review)
      const newReview = {
        ...review,
        listingId: review.listingId || propertyId,
        propertyId,
        id: 'r' + Date.now(),
        verified: true,
        createdAt: new Date().toISOString()
      }
      reviews.push(newReview)
      saveReviews(reviews)
      return { success: true, review: normalizeReview(newReview) }
    }
    return { success: false, error: result.error?.message || 'Failed to add review' }
  }
  const created = normalizeReview(result.data)
  const reviews = loadReviews()
  reviews.push(created)
  saveReviews(reviews)
  return { success: true, review: created }
}

export async function getOwnerReviews(ownerPropertyIds, options = {}) {
  const { throwOnError = false } = options

  try {
    const result = await apiGet('/reviews', { owner: 'me' })
    if (!result.success) {
      if (shouldUseOfflineFallback(result.error)) {
        console.warn('⚠️ Error fetching owner reviews, using offline demo data:', result.error?.message)
        const reviews = loadReviews()
        return sortByNewest(reviews.filter(r => ownerPropertyIds.includes(r.listingId) || ownerPropertyIds.includes(r.propertyId)).map(normalizeReview))
      }
      const error = new Error(result.error?.message || 'Failed to fetch owner reviews')
      if (throwOnError) throw error
      console.error('Error fetching owner reviews:', error)
      return []
    }
    return sortByNewest(toList(result.data).map(normalizeReview))
  } catch (error) {
    if (shouldUseOfflineFallback(error)) {
      const reviews = loadReviews()
      return sortByNewest(reviews.filter(r => ownerPropertyIds.includes(r.listingId) || ownerPropertyIds.includes(r.propertyId)).map(normalizeReview))
    }
    if (throwOnError) throw error
    console.error('Error fetching owner reviews:', error)
    return []
  }
}

export async function replyToReview(reviewId, response) {
  try {
    const result = await apiPatch(`/reviews/${reviewId}`, { response })
    if (!result.success) {
      if (shouldUseOfflineFallback(result.error)) {
        console.warn('⚠️ Error replying to review, using offline demo data:', result.error?.message)
        const reviews = loadReviews()
        const index = reviews.findIndex(r => r.id === reviewId)
        const fallback = {
          id: reviewId,
          reply: response,
          ownerResponse: response,
          ownerRespondedAt: new Date().toISOString()
        }
        if (index !== -1) {
          reviews[index] = { ...reviews[index], ...fallback }
        } else {
          reviews.push(fallback)
        }
        saveReviews(reviews)
        return { success: true, review: normalizeReview(reviews[index] ?? fallback) }
      }
      return { success: false, error: result.error?.message || 'Failed to respond to review' }
    }
    const updated = normalizeReview(result.data)
    const reviews = loadReviews()
    const index = reviews.findIndex(r => r.id === reviewId)
    if (index !== -1) {
      reviews[index] = { ...reviews[index], ...updated }
      saveReviews(reviews)
    }
    return { success: true, review: updated }
  } catch (error) {
    console.error('Error replying to review:', error)
    return { success: false, error: error.message }
  }
}

export function getPropertyRating(propertyId) {
  const reviews = loadReviews().filter(r => r.listingId === propertyId || r.propertyId === propertyId)
  if (!reviews.length) return { rating: 0, count: 0 }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { rating: Math.round(avg * 10) / 10, count: reviews.length }
}
