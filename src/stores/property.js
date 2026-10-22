import { defineStore } from 'pinia'
import { apiGet, apiPost, apiPatch, apiDelete, toList } from '@/services/api'

function normalizeProperty(row) {
  if (!row) return null
  return {
    ...row,
    location: {
      city: row.locationCity || '',
      state: row.locationState || '',
      country: row.locationCountry || 'Argentina',
      postalCode: row.locationPostalCode || '',
      coordinates: row.locationCoordinates || null
    },
    capacity: {
      guests: row.capacityGuests ?? 1,
      bedrooms: row.capacityBedrooms ?? 1,
      beds: row.capacityBeds ?? 1,
      bathrooms: row.capacityBathrooms ?? 1
    },
    pricing: {
      basePrice: row.pricingBasePrice ?? 0,
      cleaningFee: row.pricingCleaningFee ?? 0,
      currency: row.pricingCurrency || 'USD',
      weeklyDiscount: row.pricingWeeklyDiscount ?? 0,
      monthlyDiscount: row.pricingMonthlyDiscount ?? 0
    }
  }
}

function mapCreatePropertyError(apiError) {
  if (apiError?.code === 'PAYMENT_REQUIRED') {
    const limitMatch = apiError.message?.match(/limit:\s*(\d+)/i)
    if (limitMatch) {
      return `Alcanzaste el límite de propiedades de tu plan (${limitMatch[1]}). Actualizá tu suscripción para publicar más.`
    }
    return 'Necesitás una suscripción activa para publicar propiedades.'
  }
  return apiError?.message || 'Failed to create property'
}

function flattenProperty(data) {
  const flat = {}
  const scalar = (key, value) => {
    if (value !== undefined) flat[key] = value
  }

  scalar('title', data.title)
  scalar('description', data.description)
  scalar('propertyType', data.propertyType)
  scalar('rentalType', data.rentalType)
  scalar('mainImage', data.mainImage)
  if (Array.isArray(data.images)) flat.images = data.images
  if (Array.isArray(data.amenities)) flat.amenities = data.amenities
  if (data.localFeatures !== undefined) flat.localFeatures = data.localFeatures

  if (data.location) {
    scalar('locationCity', data.location.city)
    scalar('locationState', data.location.state)
    scalar('locationCountry', data.location.country)
    scalar('locationPostalCode', data.location.postalCode)
    scalar('locationCoordinates', data.location.coordinates)
  }

  if (data.capacity) {
    scalar('capacityGuests', data.capacity.guests)
    scalar('capacityBedrooms', data.capacity.bedrooms)
    scalar('capacityBeds', data.capacity.beds)
    scalar('capacityBathrooms', data.capacity.bathrooms)
  }

  if (data.pricing) {
    scalar('pricingBasePrice', data.pricing.basePrice)
    scalar('pricingCleaningFee', data.pricing.cleaningFee)
    scalar('pricingCurrency', data.pricing.currency)
    scalar('pricingWeeklyDiscount', data.pricing.weeklyDiscount)
    scalar('pricingMonthlyDiscount', data.pricing.monthlyDiscount)
  }

  if (data.availability !== undefined) flat.availability = data.availability
  if (data.houseRules !== undefined) flat.houseRules = data.houseRules
  if (data.isActive !== undefined) flat.isActive = data.isActive
  if (data.featured !== undefined) flat.featured = data.featured

  return flat
}

export const usePropertyStore = defineStore('property', {
  state: () => ({
    properties: [],
    currentProperty: null,
    loading: false,
    error: null
  }),

  getters: {
    activeProperties: (state) => state.properties.filter(p => p.status === 'active'),
    propertyCount: (state) => state.properties.length
  },

  actions: {
    async fetchUserProperties(userId) {
      this.loading = true
      this.error = null

      try {
        const result = await apiGet('/properties', { mine: 'owner' })
        if (!result.success) {
          this.error = result.error?.message || 'Failed to fetch properties'
          return { success: false, error: this.error }
        }

        this.properties = toList(result.data).map(normalizeProperty)
        return { success: true, data: this.properties }
      } catch (error) {
        console.warn('⚠️ Error fetching properties:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async fetchProperty(userId, propertyId) {
      this.loading = true
      this.error = null

      try {
        const result = await apiGet(`/properties/${propertyId}`, undefined, { public: true })
        if (!result.success) {
          this.error = result.error?.code === 'NOT_FOUND'
            ? 'Property not found'
            : (result.error?.message || 'Property not found')
          return { success: false, error: this.error }
        }

        this.currentProperty = normalizeProperty(result.data)
        return { success: true, data: this.currentProperty }
      } catch (error) {
        console.warn('⚠️ Error fetching property:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async createProperty(userId, propertyData) {
      this.loading = true
      this.error = null

      try {
        const payload = flattenProperty(propertyData)
        const result = await apiPost('/properties', payload)
        if (!result.success) {
          this.error = mapCreatePropertyError(result.error)
          return { success: false, error: this.error }
        }

        const created = normalizeProperty(result.data)
        this.properties.unshift(created)
        return { success: true, id: created.id, data: created }
      } catch (error) {
        console.warn('⚠️ Error al crear propiedad:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async updateProperty(userId, propertyId, propertyData) {
      this.loading = true
      this.error = null

      try {
        const payload = flattenProperty(propertyData)
        const result = await apiPatch(`/properties/${propertyId}`, payload)
        if (!result.success) {
          this.error = result.error?.message || 'Failed to update property'
          return { success: false, error: this.error }
        }

        const updated = normalizeProperty(result.data)
        const index = this.properties.findIndex(p => p.id === propertyId)
        if (index !== -1) {
          this.properties[index] = updated
        }
        return { success: true, data: updated }
      } catch (error) {
        console.warn('⚠️ Error al actualizar propiedad:', error.message)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async deleteProperty(userId, propertyId) {
      this.loading = true
      this.error = null

      try {
        const result = await apiDelete(`/properties/${propertyId}`)
        if (!result.success) {
          this.error = result.error?.message || 'Failed to delete property'
          return { success: false, error: this.error }
        }

        this.properties = this.properties.filter(p => p.id !== propertyId)
        return { success: true, data: result.data }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    }
  }
})
