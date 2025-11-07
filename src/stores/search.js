import { defineStore } from 'pinia'
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { getPublicListingsPath } from '@/config/firestore-structure'

export const useSearchStore = defineStore('search', {
  state: () => ({
    listings: [],
    filteredListings: [],
    loading: false,
    error: null,
    filters: {
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      priceMin: 0,
      priceMax: 100000,
      propertyType: '',
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
             state.filters.propertyType !== '' ||
             state.filters.amenities.length > 0 ||
             state.filters.localFeatures.grillType !== ''
    }
  },
  
  actions: {
    async searchListings() {
      this.loading = true
      this.error = null
      
      try {
        const listingsRef = collection(db, getPublicListingsPath())
        let q = query(listingsRef, where('isActive', '==', true))
        
        // Aplicar filtros de ciudad si existe
        if (this.filters.city) {
          q = query(q, where('location.city', '==', this.filters.city))
        }
        
        // Ordenar por fecha de creación
        q = query(q, orderBy('createdAt', 'desc'), limit(50))
        
        const snapshot = await getDocs(q)
        this.listings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Aplicar filtros adicionales en el cliente
        this.applyClientFilters()
        
        return { success: true, data: this.filteredListings }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
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
        city: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
        priceMin: 0,
        priceMax: 100000,
        propertyType: '',
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
