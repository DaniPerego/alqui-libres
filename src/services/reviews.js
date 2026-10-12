import { apiGet, apiPost } from '@/services/api'
import { isSupabaseConfigured } from '@/config/supabase'
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

export async function getPropertyReviews(propertyId) {
  if (!isSupabaseConfigured()) {
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => r.listingId === propertyId || r.propertyId === propertyId))
  }
  const result = await apiGet('/reviews', { propertyId }, { public: true })
  if (!result.success) {
    console.warn('⚠️ Error fetching reviews, falling back to localStorage:', result.error?.message)
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => r.listingId === propertyId || r.propertyId === propertyId))
  }
  return sortByNewest(result.data || [])
}

export async function addReview(review) {
  if (!isSupabaseConfigured()) {
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
    return newReview
  }

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
    return newReview
  }
  return result.data
}

export async function getOwnerReviews(ownerPropertyIds) {
  if (!isSupabaseConfigured()) {
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => ownerPropertyIds.includes(r.listingId) || ownerPropertyIds.includes(r.propertyId)))
  }
  const result = await apiGet('/reviews', { owner: 'me' })
  if (!result.success) {
    console.warn('⚠️ Error fetching owner reviews, falling back to localStorage:', result.error?.message)
    const reviews = loadReviews()
    return sortByNewest(reviews.filter(r => ownerPropertyIds.includes(r.listingId) || ownerPropertyIds.includes(r.propertyId)))
  }
  return sortByNewest(result.data || [])
}

export function getPropertyRating(propertyId) {
  const reviews = loadReviews().filter(r => r.listingId === propertyId || r.propertyId === propertyId)
  if (!reviews.length) return { rating: 0, count: 0 }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { rating: Math.round(avg * 10) / 10, count: reviews.length }
}
