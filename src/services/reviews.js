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

export function getPropertyReviews(propertyId) {
  const reviews = loadReviews()
  return reviews.filter(r => r.listingId === propertyId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function addReview(review) {
  const reviews = loadReviews()
  const newReview = {
    ...review,
    id: 'r' + Date.now(),
    verified: true,
    createdAt: new Date().toISOString()
  }
  reviews.push(newReview)
  saveReviews(reviews)
  return newReview
}

export function getOwnerReviews(ownerPropertyIds) {
  const reviews = loadReviews()
  return reviews.filter(r => ownerPropertyIds.includes(r.listingId))
}

export function getPropertyRating(propertyId) {
  const reviews = getPropertyReviews(propertyId)
  if (!reviews.length) return { rating: 0, count: 0 }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { rating: Math.round(avg * 10) / 10, count: reviews.length }
}
