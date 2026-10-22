// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPropertyReviews,
  addReview,
  getOwnerReviews,
  replyToReview,
  getPropertyRating
} from '@/services/reviews.js'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch,
  isDemoMode: () => import.meta.env.VITE_DEMO_MODE === 'true'
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

    const result = await addReview({
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
    expect(result.success).toBe(true)
    expect(result.review.id).toBe('rx3')
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

  it('exposes ownerResponse as reply in fetched reviews', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          { id: 'rx1', propertyId: 'p1', rating: 5, comment: 'Great', ownerResponse: 'Gracias', ownerRespondedAt: '2024-09-02T00:00:00.000Z' }
        ],
        meta: { page: 1, limit: 20, total: 1 }
      }
    })

    const reviews = await getOwnerReviews(['p1'])

    expect(reviews[0].reply).toBe('Gracias')
    expect(reviews[0].ownerResponse).toBe('Gracias')
    expect(reviews[0].ownerRespondedAt).toBe('2024-09-02T00:00:00.000Z')
  })

  it('replies to a review via PATCH /reviews/:id', async () => {
    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: { id: 'rx1', ownerResponse: 'Gracias por tu visita.', ownerRespondedAt: '2024-10-02T00:00:00.000Z' }
    })

    const result = await replyToReview('rx1', 'Gracias por tu visita.')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/reviews/rx1', { response: 'Gracias por tu visita.' })
    expect(result.success).toBe(true)
    expect(result.review.reply).toBe('Gracias por tu visita.')
  })
})

describe('reviews service (offline demo fallback only)', () => {
  it('returns an empty array for a property when the API fails in production', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    const reviews = await getPropertyReviews('1')

    expect(reviews).toEqual([])
  })

  it('falls back to stored reviews sorted newest first for a property only in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const reviews = await getPropertyReviews('1')

    expect(reviews.length).toBe(2)
    expect(new Date(reviews[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(reviews[1].createdAt).getTime()
    )
    vi.unstubAllEnvs()
  })

  it('returns an empty array when a property has no reviews even in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    expect(await getPropertyReviews('unknown')).toEqual([])
    vi.unstubAllEnvs()
  })

  it('returns an error when adding a review fails in production', async () => {
    mocks.apiPost.mockResolvedValueOnce({ success: false, error: { code: 'INTERNAL', message: 'Boom' } })

    const result = await addReview({
      listingId: '2',
      guestName: 'Test Guest',
      rating: 4,
      comment: 'Great place'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Boom')
  })

  it('adds a review locally only in demo mode when the API has a network error', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    const apiFailure = { success: false, error: { code: 'NETWORK_ERROR', message: 'offline' } }
    mocks.apiPost.mockResolvedValueOnce(apiFailure)
    mocks.apiGet.mockResolvedValue(apiFailure)

    const result = await addReview({
      listingId: '2',
      guestName: 'Test Guest',
      rating: 4,
      comment: 'Great place'
    })

    expect(result.success).toBe(true)
    expect(result.review.listingId).toBe('2')
    expect(await getPropertyReviews('2')).toContainEqual(expect.objectContaining({ id: result.review.id }))
    vi.unstubAllEnvs()
  })

  it('returns an empty array for owner reviews when the API fails in production', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })

    const reviews = await getOwnerReviews(['1', '2'])
    expect(reviews).toEqual([])
  })

  it('aggregates reviews for owner properties only in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    })

    const reviews = await getOwnerReviews(['1', '2'])
    expect(reviews.length).toBe(3)
    vi.unstubAllEnvs()
  })
})

describe('getPropertyRating', () => {
  it('computes rating and count from cached reviews in production', () => {
    localStorage.setItem('alquilibres_reviews', JSON.stringify([
      { id: 'r1', listingId: '1', propertyId: '1', rating: 5, createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'r2', listingId: '1', propertyId: '1', rating: 5, createdAt: '2024-02-01T00:00:00.000Z' }
    ]))
    const { rating, count } = getPropertyRating('1')
    expect(count).toBe(2)
    expect(rating).toBe(5)
    localStorage.removeItem('alquilibres_reviews')
  })

  it('returns zero rating when there are no reviews', () => {
    expect(getPropertyRating('unknown')).toEqual({ rating: 0, count: 0 })
  })
})
