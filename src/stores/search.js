import { defineStore } from 'pinia'
import { apiGet } from '@/services/api'
import { mockProperties } from '@/data/mockData'

function normalizeListing(row) {
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

export const useSearchStore = defineStore('search', {
  state: () => ({
    listings: [],
    filteredListings: [],
    loading: false,
    error: null,
    filters: {
      q: '',
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      priceMin: 0,
      priceMax: 100000,
      propertyType: '',
      rentalType: '',
      minBedrooms: 0,
      amenities: [],
      localFeatures: {
        grillType: '',
        parkingSize: '',
        nearbyAttractions: []
      }
    }
  }),

  getters: {
    resultsCount: (state) => state.filteredListings.length,
    hasActiveFilters: (state) => {
      return state.filters.city !== '' ||
             state.filters.q !== '' ||
             state.filters.propertyType !== '' ||
             state.filters.rentalType !== '' ||
             state.filters.amenities.length > 0 ||
             state.filters.localFeatures.grillType !== ''
    }
  },

  actions: {
    async searchListings() {
      this.loading = true
      this.error = null

      try {
        const params = {}
        if (this.filters.city) params.city = this.filters.city
        if (this.filters.q) params.q = this.filters.q
        if (this.filters.propertyType) params.propertyType = this.filters.propertyType
        if (this.filters.rentalType) params.rentalType = this.filters.rentalType
        if (this.filters.guests > 1) params.guests = this.filters.guests

        const result = await apiGet('/properties', params, { public: true })
        if (!result.success) {
          this.error = result.error?.message || 'Search failed'
          this.listings = mockProperties
          this.applyClientFilters()
          return { success: true, data: this.filteredListings }
        }

        this.listings = (result.data || []).map(normalizeListing)
        this.applyClientFilters()
        return { success: true, data: this.filteredListings }
      } catch (error) {
        console.warn('⚠️ Error en API:', error.message)
        this.listings = mockProperties
        this.applyClientFilters()
        return { success: true, data: this.filteredListings }
      } finally {
        this.loading = false
      }
    },

    applyClientFilters() {
      this.filteredListings = this.listings.filter(listing => {
        // Filtro de capacidad
        if (listing.capacity.guests < this.filters.guests) {
          return false
        }

        // Filtro de precio
        const price = listing.pricing.basePrice
        if (price < this.filters.priceMin || price > this.filters.priceMax) {
          return false
        }

        // Filtro de tipo de propiedad
        if (this.filters.propertyType && listing.propertyType !== this.filters.propertyType) {
          return false
        }

        // Filtro de tipo de alquiler (temporario / anual)
        if (this.filters.rentalType && listing.rentalType !== this.filters.rentalType) {
          return false
        }

        // Filtro de cantidad mínima de dormitorios
        if (this.filters.minBedrooms > 0 && listing.capacity.bedrooms < this.filters.minBedrooms) {
          return false
        }

        // Filtro de amenidades
        if (this.filters.amenities.length > 0) {
          const hasAllAmenities = this.filters.amenities.every(amenity =>
            listing.amenities.includes(amenity)
          )
          if (!hasAllAmenities) return false
        }

        // Filtros locales específicos
        if (this.filters.localFeatures.grillType &&
            listing.localFeatures?.grillType !== this.filters.localFeatures.grillType) {
          return false
        }

        if (this.filters.localFeatures.parkingSize &&
            listing.localFeatures?.parkingSize !== this.filters.localFeatures.parkingSize) {
          return false
        }

        return true
      })
    },

    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
      this.applyClientFilters()
    },

    clearFilters() {
      this.filters = {
        q: '',
        city: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
        priceMin: 0,
        priceMax: 100000,
        propertyType: '',
        rentalType: '',
        minBedrooms: 0,
        amenities: [],
        localFeatures: {
          grillType: '',
          parkingSize: '',
          nearbyAttractions: []
        }
      }
      this.applyClientFilters()
    }
  }
})
