import { defineStore } from 'pinia'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { mockProperties, mockMessages } from '@/data/mockData'
import { getPrivatePropertyPath, getPublicListingsPath } from '@/config/firestore-structure'

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
        // Usar mock data si Firebase no está configurado
        if (!db) {
          console.log('🧪 Usando datos de prueba (mock data)')
          await new Promise(resolve => setTimeout(resolve, 500))
          this.properties = mockProperties.filter(p => p.ownerId === userId)
          return { success: true, data: this.properties }
        }

        const propertiesRef = collection(db, getPrivatePropertyPath(userId))
        const q = query(propertiesRef, orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        
        this.properties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        return { success: true, data: this.properties }
      } catch (error) {
        console.warn('⚠️ Error en Firebase, usando datos de prueba:', error.message)
        this.properties = mockProperties.filter(p => p.ownerId === userId)
        return { success: true, data: this.properties }
      } finally {
        this.loading = false
      }
    },
    
    async fetchProperty(userId, propertyId) {
      this.loading = true
      this.error = null
      
      try {
        // Usar mock data si Firebase no está configurado
        if (!db) {
          console.log('🧪 Buscando propiedad en datos de prueba')
          await new Promise(resolve => setTimeout(resolve, 300))
          const property = mockProperties.find(p => p.id === propertyId && p.ownerId === userId)
          if (property) {
            this.currentProperty = property
            return { success: true, data: property }
          } else {
            this.error = 'Propiedad no encontrada'
            return { success: false, error: this.error }
          }
        }

        const propertyRef = doc(db, getPrivatePropertyPath(userId), propertyId)
        const snapshot = await getDoc(propertyRef)
        
        if (snapshot.exists()) {
          this.currentProperty = { id: snapshot.id, ...snapshot.data() }
          return { success: true, data: this.currentProperty }
        } else {
          this.error = 'Propiedad no encontrada'
          return { success: false, error: this.error }
        }
      } catch (error) {
        console.warn('⚠️ Error en Firebase, usando datos de prueba:', error.message)
        const property = mockProperties.find(p => p.id === propertyId && p.ownerId === userId)
        if (property) {
          this.currentProperty = property
          return { success: true, data: property }
        }
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
        // Modo demo - no persiste, solo simula
        if (!db) {
          console.log('🧪 Modo demo: Propiedad creada (no se guardará al recargar)')
          await new Promise(resolve => setTimeout(resolve, 500))
          const newId = `mock-${Date.now()}`
          const newProperty = {
            id: newId,
            ...propertyData,
            ownerId: userId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          // Agregar temporalmente al array local
          this.properties.unshift(newProperty)
          return { success: true, id: newId, message: 'Propiedad creada (modo demo)' }
        }

        const propertiesRef = collection(db, getPrivatePropertyPath(userId))
        
        const newProperty = {
          ...propertyData,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        const docRef = await addDoc(propertiesRef, newProperty)
        
        // También crear en la colección pública para búsquedas
        await this.syncToPublicListings(docRef.id, userId, propertyData)
        
        return { success: true, id: docRef.id }
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
        // Modo demo - actualiza temporalmente
        if (!db) {
          console.log('🧪 Modo demo: Propiedad actualizada (no se guardará al recargar)')
          await new Promise(resolve => setTimeout(resolve, 500))
          const index = this.properties.findIndex(p => p.id === propertyId)
          if (index !== -1) {
            this.properties[index] = {
              ...this.properties[index],
              ...propertyData,
              updatedAt: new Date()
            }
          }
          return { success: true, message: 'Propiedad actualizada (modo demo)' }
        }

        const propertyRef = doc(db, getPrivatePropertyPath(userId), propertyId)
        
        const updateData = {
          ...propertyData,
          updatedAt: serverTimestamp()
        }
        
        await updateDoc(propertyRef, updateData)
        
        // Actualizar en la colección pública
        await this.syncToPublicListings(propertyId, userId, propertyData)
        
        return { success: true }
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
        // Modo demo - elimina temporalmente
        if (!db) {
          console.log('🧪 Modo demo: Propiedad eliminada (no se guardará al recargar)')
          await new Promise(resolve => setTimeout(resolve, 500))
          this.properties = this.properties.filter(p => p.id !== propertyId)
          return { success: true, message: 'Propiedad eliminada (modo demo)' }
        }

        // Eliminar de la colección privada
        const propertyRef = doc(db, getPrivatePropertyPath(userId), propertyId)
        await deleteDoc(propertyRef)
        
        // Eliminar de la colección pública
        const publicRef = doc(db, getPublicListingsPath(), propertyId)
        await deleteDoc(publicRef)
        
        // Actualizar estado local
        this.properties = this.properties.filter(p => p.id !== propertyId)
        
        return { success: true }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },
    
    async syncToPublicListings(propertyId, userId, propertyData) {
      // En modo demo, no hacer nada
      if (!db) {
        return
      }

      const publicListingRef = doc(db, getPublicListingsPath(), propertyId)
      
      const publicData = {
        ownerId: userId,
        title: propertyData.title,
        description: propertyData.description,
        propertyType: propertyData.propertyType,
        mainImage: propertyData.images?.[0] || '',
        images: propertyData.images || [],
        pricing: propertyData.pricing,
        capacity: propertyData.capacity,
        location: {
          city: propertyData.location?.city,
          state: propertyData.location?.state,
          coordinates: propertyData.location?.coordinates
        },
        amenities: propertyData.amenities || [],
        localFeatures: propertyData.localFeatures || {},
        rating: 0,
        reviewCount: 0,
        availableDates: [], // Se actualizará con el calendario
        isActive: propertyData.status === 'active',
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(publicListingRef, publicData).catch(() => {
        // Si no existe, crear
        return addDoc(collection(db, getPublicListingsPath()), {
          ...publicData,
          createdAt: serverTimestamp()
        })
      })
    }
  }
})
