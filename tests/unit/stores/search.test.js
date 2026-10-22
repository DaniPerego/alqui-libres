// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSearchStore } from '@/stores/search'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn()
}))

vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: mocks.apiGet
}))

const apiListing = {
  id: 'api-1',
  ownerId: 'owner001',
  title: 'Casa API',
  description: 'Desde la API',
  propertyType: 'casa',
  rentalType: 'temporario',
  mainImage: 'https://example.com/main.jpg',
  images: ['https://example.com/main.jpg'],
  locationCity: 'Carlos Paz',
  locationState: 'Córdoba',
  locationCountry: 'Argentina',
  capacityGuests: 6,
  capacityBedrooms: 3,
  capacityBeds: 4,
  capacityBathrooms: 2,
  pricingBasePrice: 150,
  pricingCleaningFee: 25,
  amenities: ['WiFi', 'Parrilla'],
  localFeatures: { grillType: 'carbon' },
  status: 'active',
  isActive: true,
  rating: 4.5,
  reviewCount: 10
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('search store clearFilters', () => {
  it('resets minBedrooms to 0', () => {
    const store = useSearchStore()
    store.updateFilters({ minBedrooms: 3 })
    expect(store.filters.minBedrooms).toBe(3)

    store.clearFilters()
    expect(store.filters.minBedrooms).toBe(0)
  })
})

describe('search store (API failure surfaces error, no mock rows)', () => {
  it('returns an error and leaves listings empty when the API fails', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL', message: 'Boom' }
    })
    const store = useSearchStore()

    const result = await store.searchListings()

    expect(result.success).toBe(false)
    expect(store.error).toBe('Boom')
    expect(store.listings).toEqual([])
    expect(store.filteredListings).toEqual([])
  })

  it('only uses mock listings in demo mode when the failure is a network error', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'offline' }
    })
    const store = useSearchStore()

    const result = await store.searchListings()

    expect(result.success).toBe(false)
    expect(store.error).toBe('offline')
    expect(store.listings.length).toBeGreaterThan(0)
    vi.unstubAllEnvs()
  })
})

describe('search store (native API)', () => {
  it('queries the API with filter params and normalizes results', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [apiListing], meta: { page: 1, limit: 20, total: 1 } }
    })
    const store = useSearchStore()
    store.updateFilters({
      city: 'Carlos Paz',
      guests: 4,
      propertyType: 'casa',
      rentalType: 'temporario',
      q: 'parrilla'
    })

    const result = await store.searchListings()

    expect(mocks.apiGet).toHaveBeenCalledWith('/properties', {
      city: 'Carlos Paz',
      guests: 4,
      propertyType: 'casa',
      rentalType: 'temporario',
      q: 'parrilla'
    }, { public: true })
    expect(result.success).toBe(true)
    expect(store.listings).toHaveLength(1)
    expect(store.listings[0].location.city).toBe('Carlos Paz')
    expect(store.listings[0].capacity.guests).toBe(6)
    expect(store.listings[0].pricing.basePrice).toBe(150)
  })

  it('applies client-side filters on top of API results', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: true,
      data: { data: [apiListing], meta: { page: 1, limit: 20, total: 1 } }
    })
    const store = useSearchStore()
    store.updateFilters({
      minBedrooms: 5,
      amenities: ['Piscina']
    })

    await store.searchListings()

    expect(store.listings).toHaveLength(1)
    expect(store.filteredListings).toHaveLength(0)
  })
})
