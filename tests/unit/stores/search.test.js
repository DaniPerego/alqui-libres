// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSearchStore } from '@/stores/search'

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn()
}))

vi.mock('@/services/api', () => ({
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

describe('search store (API failure fallback to mock listings)', () => {
  it('loads mock listings and applies client filters', async () => {
    const store = useSearchStore()
    store.updateFilters({
      city: '',
      guests: 1,
      priceMin: 0,
      priceMax: 100000,
      minBedrooms: 3,
      amenities: ['WiFi', 'Parrilla']
    })

    const result = await store.searchListings()

    expect(result.success).toBe(true)
    expect(store.filteredListings.length).toBeGreaterThan(0)
    expect(store.filteredListings.every(l => l.capacity.bedrooms >= 3)).toBe(true)
    expect(store.filteredListings.every(l =>
      store.filters.amenities.every(a => l.amenities.includes(a))
    )).toBe(true)
  })
})

describe('search store (native API)', () => {
  it('queries the API with filter params and normalizes results', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [apiListing] })
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
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [apiListing] })
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
