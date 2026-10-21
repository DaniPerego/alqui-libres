// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPropertyReviews,
  addReview,
  getOwnerReviews,
  getPropertyRating
} from '@/services/reviews.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('reviews service (native API)', () => {
  it('fetches property reviews from the API sorted newest first', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          { id: 'rx2', propertyId: 'p1', rating: 5, comment: 'Latest', createdAt: '2024-09-01T00:00:00.000Z' },
          { id: 'rx1', propertyId: 'p1', rating: 4, comment: 'Older', createdAt: '2024-08-01T00:00:00.000Z' }
        ],
        meta: { page: 1, limit: 20, total: 2 }
      }
    })

    const reviews = await getPropertyReviews('p1')

    expect(mocks.apiGet).toHaveBeenCalledWith('/reviews', { propertyId: 'p1' }, { public: true })
    expect(reviews[0].id).toBe('rx2')
    expect(reviews[1].id).toBe('rx1')
  })

  it('adds a review via the API', async () => {
    const created = {
      id: 'rx3',
      propertyId: 'p1',
      guestName: 'API Guest',
      rating: 5,
      comment: 'API review',
      visible: true,
      createdAt: '2024-10-01T00:00:00.000Z'
    }
    mocks.apiPost.mockResolvedValueOnce({ success: true, data: created })

    const review = await addReview({
      propertyId: 'p1',
      guestName: 'API Guest',
      rating: 5,
      comment: 'API review'
    })

    expect(mocks.apiPost).toHaveBeenCalledWith('/reviews', expect.objectContaining({
      propertyId: 'p1',
      rating: 5,
      comment: 'API review'
    }))
    expect(review.id).toBe('rx3')
  })

  it('fetches owner reviews from the API', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          { id: 'rx1', propertyId: 'p1', rating: 5, comment: 'Owner review' }
        ],
        meta: { page: 1, limit: 20, total: 1 }
      }
    })

    const reviews = await getOwnerReviews(['p1', 'p2'])

    expect(mocks.apiGet).toHaveBeenCalledWith('/reviews', { owner: 'me' })
    expect(reviews.length).toBe(1)
    expect(reviews[0].propertyId).toBe('p1')
  })
})

describe('reviews service (localStorage fallback when the API fails)', () => {
  it('falls back to stored reviews sorted newest first for a property', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const reviews = await getPropertyReviews('1')

    expect(reviews.length).toBe(2)
    expect(new Date(reviews[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(reviews[1].createdAt).getTime()
    )
  })

  it('returns an empty array when a property has no reviews', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    expect(await getPropertyReviews('unknown')).toEqual([])
  })

  it('adds a review locally and persists it to localStorage when the API rejects it', async () => {
    const apiFailure = { success: false, error: { code: 'INTERNAL', message: 'Boom' } }
    mocks.apiPost.mockResolvedValueOnce(apiFailure)
    mocks.apiGet.mockResolvedValue(apiFailure)

    const review = await addReview({
      listingId: '2',
      guestName: 'Test Guest',
      rating: 4,
      comment: 'Great place'
    })

    expect(review.listingId).toBe('2')
    expect(review.rating).toBe(4)
    expect(review.verified).toBe(true)
    expect(await getPropertyReviews('2')).toContainEqual(expect.objectContaining({ id: review.id }))
  })

  it('aggregates reviews for an owner properties when the API fails', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const reviews = await getOwnerReviews(['1', '2'])
    expect(reviews.length).toBe(3)
  })
})

describe('getPropertyRating', () => {
  it('computes rating and count for a property', () => {
    const { rating, count } = getPropertyRating('1')
    expect(count).toBe(2)
    expect(rating).toBe(5)
  })

  it('returns zero rating when there are no reviews', () => {
    expect(getPropertyRating('unknown')).toEqual({ rating: 0, count: 0 })
  })
})
