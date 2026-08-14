// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePropertyStore } from '@/stores/property.js'
import { mockProperties } from '@/data/mockData'

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => false),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn()
}))

vi.mock('@/config/supabase', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  supabase: null
}))

vi.mock('@/services/api', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPatch: mocks.apiPatch,
  apiPut: mocks.apiPut,
  apiDelete: mocks.apiDelete
}))

const apiProperty = {
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
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

function normalizedShape(p) {
  return {
    ...p,
    location: {
      city: p.locationCity,
      state: p.locationState,
      country: p.locationCountry
    },
    capacity: {
      guests: p.capacityGuests,
      bedrooms: p.capacityBedrooms,
      beds: p.capacityBeds,
      bathrooms: p.capacityBathrooms
    },
    pricing: {
      basePrice: p.pricingBasePrice,
      cleaningFee: p.pricingCleaningFee
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  mocks.isSupabaseConfigured.mockReturnValue(false)
})

describe('property store (demo mode)', () => {
  it('fetchUserProperties filters mock properties by owner id', async () => {
    const store = usePropertyStore()
    const result = await store.fetchUserProperties('user123')

    expect(result.success).toBe(true)
    expect(store.properties).toHaveLength(3)
    expect(store.properties.map(p => p.id)).toEqual(['1', '2', '4'])
  })

  it('fetchProperty returns the matching demo property by id when no owner id is given', async () => {
    const store = usePropertyStore()
    const result = await store.fetchProperty(undefined, '2')

    expect(result.success).toBe(true)
    expect(store.currentProperty.id).toBe('2')
    expect(store.currentProperty.title).toBe('Departamento Céntrico con Vista al Mar')
  })

  it('fetchProperty filters by owner id when provided', async () => {
    const store = usePropertyStore()
    const result = await store.fetchProperty('user456', '1')

    expect(result.success).toBe(false)
    expect(store.currentProperty).toBeNull()
  })

  it('returns not found for an unknown property id', async () => {
    const store = usePropertyStore()
    const result = await store.fetchProperty(undefined, 'unknown')

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('createProperty adds a new demo property to local state', async () => {
    const store = usePropertyStore()
    const result = await store.createProperty('owner001', {
      title: 'Nueva Demo',
      description: 'Desc',
      propertyType: 'casa',
      rentalType: 'temporario'
    })

    expect(result.success).toBe(true)
    expect(store.properties[0].title).toBe('Nueva Demo')
    expect(store.properties[0].ownerId).toBe('owner001')
    expect(store.properties[0].status).toBe('active')
  })

  it('updateProperty patches an existing demo property', async () => {
    const store = usePropertyStore()
    await store.fetchUserProperties('user123')
    const result = await store.updateProperty('user123', '1', { title: 'Actualizada' })

    expect(result.success).toBe(true)
    expect(store.properties.find(p => p.id === '1').title).toBe('Actualizada')
  })

  it('deleteProperty removes a demo property from local state', async () => {
    const store = usePropertyStore()
    await store.fetchUserProperties('user123')
    const result = await store.deleteProperty('user123', '1')

    expect(result.success).toBe(true)
    expect(store.properties.find(p => p.id === '1')).toBeUndefined()
  })
})

describe('property store (Supabase mode)', () => {
  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true)
  })

  it('fetchUserProperties calls the owner endpoint and normalizes the response', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: [apiProperty] })
    const store = usePropertyStore()

    const result = await store.fetchUserProperties('owner001')

    expect(mocks.apiGet).toHaveBeenCalledWith('/properties', { mine: 'owner' })
    expect(result.success).toBe(true)
    expect(store.properties).toHaveLength(1)
    expect(store.properties[0].location.city).toBe('Carlos Paz')
    expect(store.properties[0].capacity.bedrooms).toBe(3)
    expect(store.properties[0].pricing.basePrice).toBe(150)
  })

  it('fetchProperty calls the public detail endpoint and normalizes the response', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: apiProperty })
    const store = usePropertyStore()

    const result = await store.fetchProperty(undefined, 'api-1')

    expect(mocks.apiGet).toHaveBeenCalledWith('/properties/api-1', undefined, { public: true })
    expect(result.success).toBe(true)
    expect(store.currentProperty.id).toBe('api-1')
    expect(store.currentProperty.location.city).toBe('Carlos Paz')
  })

  it('returns not found when the detail endpoint fails', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Missing' }
    })
    const store = usePropertyStore()

    const result = await store.fetchProperty(undefined, 'missing')

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
    expect(store.currentProperty).toBeNull()
  })

  it('createProperty posts a flat payload and updates local state', async () => {
    const created = { ...apiProperty, id: 'api-new' }
    mocks.apiPost.mockResolvedValueOnce({ success: true, data: created })
    const store = usePropertyStore()

    const result = await store.createProperty('owner001', {
      title: 'Nueva API',
      description: 'Desc',
      propertyType: 'casa',
      rentalType: 'temporario',
      location: { city: 'Carlos Paz', state: 'Córdoba', country: 'Argentina' },
      capacity: { guests: 6, bedrooms: 3, beds: 4, bathrooms: 2 },
      pricing: { basePrice: 150, cleaningFee: 25 }
    })

    expect(mocks.apiPost).toHaveBeenCalledWith('/properties', expect.objectContaining({
      title: 'Nueva API',
      locationCity: 'Carlos Paz',
      capacityGuests: 6,
      pricingBasePrice: 150
    }))
    expect(result.success).toBe(true)
    expect(store.properties[0].id).toBe('api-new')
  })

  it('updateProperty patches a flat payload and updates local state', async () => {
    const updated = { ...apiProperty, title: 'Actualizada API' }
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: updated })
    const store = usePropertyStore()
    store.properties = [normalizedShape(apiProperty)]

    const result = await store.updateProperty('owner001', 'api-1', {
      title: 'Actualizada API',
      pricing: { basePrice: 175 }
    })

    expect(mocks.apiPatch).toHaveBeenCalledWith('/properties/api-1', expect.objectContaining({
      title: 'Actualizada API',
      pricingBasePrice: 175
    }))
    expect(result.success).toBe(true)
    expect(store.properties[0].title).toBe('Actualizada API')
    expect(store.properties[0].pricing.basePrice).toBe(150)
  })

  it('deleteProperty calls the delete endpoint and removes the row', async () => {
    mocks.apiDelete.mockResolvedValueOnce({ success: true, data: { deleted: true, id: 'api-1' } })
    const store = usePropertyStore()
    store.properties = [normalizedShape(apiProperty)]

    const result = await store.deleteProperty('owner001', 'api-1')

    expect(mocks.apiDelete).toHaveBeenCalledWith('/properties/api-1')
    expect(result.success).toBe(true)
    expect(store.properties).toHaveLength(0)
  })
})
