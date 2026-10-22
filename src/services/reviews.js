import { apiGet, apiPost, apiPatch, toList } from '@/services/api'
import { mockReviews } from '@/data/mockData'

const STORAGE_KEY = 'alquilibres_reviews'

function loadReviews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return [...mockReviews]
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

export async function getPropertyReviews(propertyId) {
  const result = await apiGet('/reviews', { propertyId }, { public: true })
  if (!result.success) {
    console.warn('⚠️ Error fetching reviews, falling back to localStorage:', result.error?.message)
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => r.listingId === propertyId || r.propertyId === propertyId).map(normalizeReview))
  }
  return sortByNewest(toList(result.data).map(normalizeReview))
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
    console.warn('⚠️ Error adding review, falling back to localStorage:', result.error?.message)
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
    return normalizeReview(newReview)
  }
  return normalizeReview(result.data)
}

export async function getOwnerReviews(ownerPropertyIds) {
  const result = await apiGet('/reviews', { owner: 'me' })
  if (!result.success) {
    console.warn('⚠️ Error fetching owner reviews, falling back to localStorage:', result.error?.message)
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => ownerPropertyIds.includes(r.listingId) || ownerPropertyIds.includes(r.propertyId)).map(normalizeReview))
  }
  return sortByNewest(toList(result.data).map(normalizeReview))
}

export async function replyToReview(reviewId, response) {
  try {
    const result = await apiPatch(`/reviews/${reviewId}`, { response })
    if (!result.success) {
      console.warn('⚠️ Error replying to review, falling back to localStorage:', result.error?.message)
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
      return { success: false, error: result.error?.message || 'Failed to respond to review', review: normalizeReview(reviews[index] ?? fallback) }
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
