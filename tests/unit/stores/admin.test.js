// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminStore } from '@/stores/admin.js'

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => false),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  saveMockCredentials: vi.fn()
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

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    saveMockCredentials: mocks.saveMockCredentials
  }))
}))

const apiUser = {
  id: 'api-user-1',
  email: 'api@example.com',
  displayName: 'API User',
  role: 'owner',
  isActive: true,
  createdAt: '2024-01-15T00:00:00.000Z',
  subscription: {
    planId: 'pro',
    status: 'active',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2025-01-15T00:00:00.000Z'
  },
  stats: { properties: 2, bookings: 10, revenue: 5000 }
}

const apiProperty = {
  id: 'api-prop-1',
  ownerId: 'api-user-1',
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
  status: 'pending',
  isActive: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const apiPlan = {
  id: 'basic',
  name: 'Plan Básico',
  price: 14999,
  currency: 'ARS',
  interval: 'month',
  features: ['Hasta 3 propiedades activas'],
  maxProperties: 3,
  isActive: true
}

const apiSubscription = {
  id: 'sub-1',
  userId: 'api-user-1',
  planId: 'pro',
  status: 'active',
  createdAt: '2024-01-15T00:00:00.000Z'
}

const apiSettings = {
  platformName: 'AlquiLibres',
  contactEmail: 'info@alquilibres.com',
  supportPhone: '+54 9 11 1234-5678',
  commissionRate: 0,
  emailNotifications: true,
  whatsappNotifications: true,
  requireEmailVerification: false,
  moderateProperties: false
}

function userInternalShape(u) {
  return {
    ...u,
    uid: u.id,
    createdAt: new Date(u.createdAt)
  }
}

function propertyInternalShape(p) {
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
      cleaningFee: p.pricingCleaningFee,
      currency: p.pricingCurrency
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  setActivePinia(createPinia())
  localStorage.clear()
  mocks.isSupabaseConfigured.mockReturnValue(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('admin store (demo mode)', () => {
  it('fetchUsers loads hardcoded demo users and computes stats', async () => {
    const store = useAdminStore()

    const result = await store.fetchUsers()

    expect(result.success).toBe(true)
    expect(store.users.length).toBeGreaterThan(0)
    expect(store.users.some(u => u.email === 'demo@alquilubres.com')).toBe(true)
    expect(store.stats.totalUsers).toBe(store.users.length)
  })

  it('createUser pushes a new demo user and returns a generated password', async () => {
    const store = useAdminStore()
    await store.fetchUsers()

    const result = await store.createUser({
      email: 'new@example.com',
      displayName: 'New Demo',
      role: 'owner',
      planId: 'basic'
    })

    expect(result.success).toBe(true)
    expect(result.password).toBeTruthy()
    expect(store.users.some(u => u.email === 'new@example.com')).toBe(true)
    expect(store.stats.totalUsers).toBe(4)
  })

  it('updateUserRole patches the role of a demo user', async () => {
    const store = useAdminStore()
    await store.fetchUsers()

    const result = await store.updateUserRole('user123', 'admin')

    expect(result.success).toBe(true)
    expect(store.users.find(u => u.uid === 'user123').role).toBe('admin')
  })

  it('toggleUserStatus suspends a demo user', async () => {
    const store = useAdminStore()
    await store.fetchUsers()

    const result = await store.toggleUserStatus('user123', false)

    expect(result.success).toBe(true)
    expect(store.users.find(u => u.uid === 'user123').isActive).toBe(false)
  })

  it('deleteUser removes a demo user from state', async () => {
    const store = useAdminStore()
    await store.fetchUsers()

    const result = await store.deleteUser('user123')

    expect(result.success).toBe(true)
    expect(store.users.find(u => u.uid === 'user123')).toBeUndefined()
  })

  it('fetchAllProperties loads demo properties including pending ones', async () => {
    const store = useAdminStore()

    const result = await store.fetchAllProperties()

    expect(result.success).toBe(true)
    expect(store.properties.length).toBeGreaterThan(0)
    expect(store.properties.some(p => p.status === 'pending')).toBe(true)
    expect(store.stats.totalProperties).toBe(store.properties.length)
  })

  it('updatePropertyStatus approves a demo property', async () => {
    const store = useAdminStore()
    await store.fetchAllProperties()
    const pending = store.properties.find(p => p.status === 'pending')

    const result = await store.updatePropertyStatus(pending.id, 'active')

    expect(result.success).toBe(true)
    expect(store.properties.find(p => p.id === pending.id).status).toBe('active')
  })

  it('deleteProperty removes a demo property', async () => {
    const store = useAdminStore()
    await store.fetchAllProperties()
    const id = store.properties[0].id

    const result = await store.deleteProperty(id)

    expect(result.success).toBe(true)
    expect(store.properties.find(p => p.id === id)).toBeUndefined()
  })

  it('initPlans loads default plans when none are stored', async () => {
    const store = useAdminStore()

    const result = await store.initPlans()

    expect(result.success).toBe(true)
    expect(store.subscriptionPlans.length).toBe(3)
    expect(store.subscriptionPlans.find(p => p.id === 'pro').recommended).toBe(true)
  })

  it('updateSubscriptionPlan updates a demo plan', async () => {
    const store = useAdminStore()
    await store.initPlans()

    const result = await store.updateSubscriptionPlan('basic', { price: 9999 })

    expect(result.success).toBe(true)
    expect(store.subscriptionPlans.find(p => p.id === 'basic').price).toBe(9999)
  })

  it('initSubscriptions keeps an empty subscriptions array in demo mode', async () => {
    const store = useAdminStore()

    const result = await store.initSubscriptions()

    expect(result.success).toBe(true)
    expect(store.subscriptions).toEqual([])
  })

  it('updateUserSubscription updates the subscription of a demo user', async () => {
    const store = useAdminStore()
    await store.fetchUsers()

    const result = await store.updateUserSubscription('user123', 'enterprise', 'active')

    expect(result.success).toBe(true)
    expect(store.users.find(u => u.uid === 'user123').subscription.planId).toBe('enterprise')
  })

  it('initPlatformSettings loads stored settings or defaults', async () => {
    const store = useAdminStore()

    const result = await store.initPlatformSettings()

    expect(result.success).toBe(true)
    expect(store.platformSettings.platformName).toBe('AlquiLibres')
  })

  it('updatePlatformSettings persists demo settings to localStorage', async () => {
    const store = useAdminStore()
    await store.initPlatformSettings()

    const result = await store.updatePlatformSettings({ platformName: 'Test' })

    expect(result.success).toBe(true)
    expect(store.platformSettings.platformName).toBe('Test')
    expect(JSON.parse(localStorage.getItem('platformSettings')).platformName).toBe('Test')
  })
})

describe('admin store (Supabase mode)', () => {
  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true)
  })

  it('fetchUsers calls /api/users and normalizes the response', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [apiUser] } })
    const store = useAdminStore()

    const result = await store.fetchUsers()

    expect(mocks.apiGet).toHaveBeenCalledWith('/users')
    expect(result.success).toBe(true)
    expect(store.users).toHaveLength(1)
    expect(store.users[0].uid).toBe('api-user-1')
    expect(store.users[0].createdAt).toBeInstanceOf(Date)
    expect(store.stats.totalUsers).toBe(1)
  })

  it('createUser posts to /api/users and applies an optional plan subscription', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: { user: apiUser, tempPassword: 'temp123' }
    })
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: apiUser })
    const store = useAdminStore()

    const result = await store.createUser({
      email: 'api@example.com',
      displayName: 'API User',
      role: 'owner',
      planId: 'pro'
    })

    expect(mocks.apiPost).toHaveBeenCalledWith('/users', expect.objectContaining({
      email: 'api@example.com',
      displayName: 'API User',
      role: 'owner',
      isActive: true
    }))
    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/api-user-1', expect.objectContaining({
      subscription: expect.objectContaining({ planId: 'pro', status: 'active' })
    }))
    expect(result.success).toBe(true)
    expect(result.password).toBe('temp123')
    expect(store.users[0].uid).toBe('api-user-1')
  })

  it('updateUserRole patches /api/users/{id}', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { ...apiUser, role: 'admin' } })
    const store = useAdminStore()
    store.users = [userInternalShape(apiUser)]

    const result = await store.updateUserRole('api-user-1', 'admin')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/api-user-1', { role: 'admin' })
    expect(result.success).toBe(true)
    expect(store.users[0].role).toBe('admin')
  })

  it('toggleUserStatus patches /api/users/{id}', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { ...apiUser, isActive: false } })
    const store = useAdminStore()
    store.users = [userInternalShape(apiUser)]

    const result = await store.toggleUserStatus('api-user-1', false)

    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/api-user-1', { isActive: false })
    expect(result.success).toBe(true)
    expect(store.users[0].isActive).toBe(false)
  })

  it('deleteUser calls /api/users/{id}', async () => {
    mocks.apiDelete.mockResolvedValueOnce({ success: true, data: { deleted: true } })
    const store = useAdminStore()
    store.users = [userInternalShape(apiUser)]

    const result = await store.deleteUser('api-user-1')

    expect(mocks.apiDelete).toHaveBeenCalledWith('/users/api-user-1')
    expect(result.success).toBe(true)
    expect(store.users).toHaveLength(0)
  })

  it('fetchAllProperties calls /api/properties?scope=all and normalizes rows', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [apiProperty] } })
    const store = useAdminStore()

    const result = await store.fetchAllProperties()

    expect(mocks.apiGet).toHaveBeenCalledWith('/properties', { scope: 'all' })
    expect(result.success).toBe(true)
    expect(store.properties).toHaveLength(1)
    expect(store.properties[0].location.city).toBe('Carlos Paz')
    expect(store.properties[0].capacity.bedrooms).toBe(3)
    expect(store.properties[0].pricing.basePrice).toBe(150)
  })

  it('updatePropertyStatus patches /api/properties/{id}', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { ...apiProperty, status: 'active', isActive: true } })
    const store = useAdminStore()
    store.properties = [propertyInternalShape(apiProperty)]

    const result = await store.updatePropertyStatus('api-prop-1', 'active')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/properties/api-prop-1', { status: 'active', isActive: true })
    expect(result.success).toBe(true)
    expect(store.properties[0].status).toBe('active')
    expect(store.properties[0].isActive).toBe(true)
  })

  it('deleteProperty calls /api/properties/{id}', async () => {
    mocks.apiDelete.mockResolvedValueOnce({ success: true, data: { deleted: true } })
    const store = useAdminStore()
    store.properties = [propertyInternalShape(apiProperty)]

    const result = await store.deleteProperty('api-prop-1')

    expect(mocks.apiDelete).toHaveBeenCalledWith('/properties/api-prop-1')
    expect(result.success).toBe(true)
    expect(store.properties).toHaveLength(0)
  })

  it('initPlans calls /api/plans and seeds defaults when empty', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [] } })
    mocks.apiPatch.mockResolvedValue({ success: true, data: apiPlan })
    const store = useAdminStore()

    const result = await store.initPlans()

    expect(mocks.apiGet).toHaveBeenCalledWith('/plans')
    expect(mocks.apiPatch).toHaveBeenCalledTimes(3)
    expect(result.success).toBe(true)
    expect(store.subscriptionPlans.length).toBe(3)
  })

  it('updateSubscriptionPlan patches /api/plans/{id}', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { ...apiPlan, price: 9999 } })
    const store = useAdminStore()
    store.subscriptionPlans = [apiPlan]

    const result = await store.updateSubscriptionPlan('basic', { price: 9999 })

    expect(mocks.apiPatch).toHaveBeenCalledWith('/plans/basic', expect.objectContaining({ price: 9999 }))
    expect(result.success).toBe(true)
    expect(store.subscriptionPlans[0].price).toBe(9999)
  })

  it('initSubscriptions calls /api/subscriptions', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: { data: [apiSubscription] } })
    const store = useAdminStore()

    const result = await store.initSubscriptions()

    expect(mocks.apiGet).toHaveBeenCalledWith('/subscriptions')
    expect(result.success).toBe(true)
    expect(store.subscriptions).toHaveLength(1)
    expect(store.subscriptions[0].id).toBe('sub-1')
  })

  it('updateUserSubscription patches the user subscription via /api/users/{id}', async () => {
    mocks.apiPatch.mockResolvedValueOnce({
      success: true,
      data: { ...apiUser, subscription: { planId: 'enterprise', status: 'active' } }
    })
    const store = useAdminStore()
    store.users = [userInternalShape(apiUser)]

    const result = await store.updateUserSubscription('api-user-1', 'enterprise', 'active')

    expect(mocks.apiPatch).toHaveBeenCalledWith('/users/api-user-1', expect.objectContaining({
      subscription: expect.objectContaining({ planId: 'enterprise', status: 'active' })
    }))
    expect(result.success).toBe(true)
    expect(store.users[0].subscription.planId).toBe('enterprise')
  })

  it('initPlatformSettings calls /api/platform-settings', async () => {
    mocks.apiGet.mockResolvedValueOnce({ success: true, data: apiSettings })
    const store = useAdminStore()

    const result = await store.initPlatformSettings()

    expect(mocks.apiGet).toHaveBeenCalledWith('/platform-settings')
    expect(result.success).toBe(true)
    expect(store.platformSettings.platformName).toBe('AlquiLibres')
  })

  it('updatePlatformSettings patches /api/platform-settings', async () => {
    mocks.apiPatch.mockResolvedValueOnce({ success: true, data: { ...apiSettings, platformName: 'Test' } })
    const store = useAdminStore()

    const result = await store.updatePlatformSettings({ platformName: 'Test' })

    expect(mocks.apiPatch).toHaveBeenCalledWith('/platform-settings', { platformName: 'Test' })
    expect(result.success).toBe(true)
    expect(store.platformSettings.platformName).toBe('Test')
  })

  it('startPolling schedules repeated refetch and stopPolling cancels it', async () => {
    mocks.apiGet
      .mockResolvedValueOnce({ success: true, data: { data: [] } })
      .mockResolvedValueOnce({ success: true, data: { data: [] } })
      .mockResolvedValueOnce({ success: true, data: { data: [] } })
      .mockResolvedValueOnce({ success: true, data: apiSettings })
      .mockResolvedValueOnce({ success: true, data: { data: [] } })
    const store = useAdminStore()

    store.startPolling(30000)
    await vi.advanceTimersByTimeAsync(30000)

    expect(mocks.apiGet).toHaveBeenCalledWith('/users')
    expect(mocks.apiGet).toHaveBeenCalledWith('/properties', { scope: 'all' })

    store.stopPolling()
    mocks.apiGet.mockClear()
    await vi.advanceTimersByTimeAsync(30000)

    expect(mocks.apiGet).not.toHaveBeenCalled()
  })
})
