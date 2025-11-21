/**
 * Servicio para gestionar reservas en Firestore
 */
import { 
  collection, 
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/config/firebase'

const COLLECTION_NAME = 'reservations'

/**
 * Crea una nueva reserva en Firestore
 */
export async function createReservation(reservationData) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...reservationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...reservationData }
  } catch (error) {
    console.error('Error creating reservation:', error)
    throw error
  }
}

/**
 * Obtiene todas las reservas de un propietario
 */
export async function getOwnerReservations(ownerId, statusFilter = null) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    let q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    )
    
    if (statusFilter && statusFilter !== 'all') {
      q = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', ownerId),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      )
    }
    
    const querySnapshot = await getDocs(q)
    const reservations = []
    
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
        // Convertir timestamps a Date objects
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })
    })
    
    return reservations
  } catch (error) {
    console.error('Error getting owner reservations:', error)
    throw error
  }
}

/**
 * Obtiene una reserva por ID
 */
export async function getReservation(reservationId) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      }
    } else {
      throw new Error('Reservation not found')
    }
  } catch (error) {
    console.error('Error getting reservation:', error)
    throw error
  }
}

/**
 * Actualiza una reserva
 */
export async function updateReservation(reservationId, updates) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    return { id: reservationId, ...updates }
  } catch (error) {
    console.error('Error updating reservation:', error)
    throw error
  }
}

/**
 * Confirma una reserva (shortcut)
 */
export async function confirmReservation(reservationId) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    await updateDoc(docRef, {
      status: 'confirmed',
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: reservationId, status: 'confirmed' }
  } catch (error) {
    console.error('Error confirming reservation:', error)
    throw error
  }
}

/**
 * Rechaza una reserva (shortcut)
 */
export async function rejectReservation(reservationId, reason = '') {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: reservationId, status: 'rejected' }
  } catch (error) {
    console.error('Error rejecting reservation:', error)
    throw error
  }
}

/**
 * Cancela una reserva
 */
export async function cancelReservation(reservationId, cancelledBy = 'owner') {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelledBy,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: reservationId, status: 'cancelled' }
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    throw error
  }
}

/**
 * Elimina una reserva
 */
export async function deleteReservation(reservationId) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const docRef = doc(db, COLLECTION_NAME, reservationId)
    await deleteDoc(docRef)
    
    return { id: reservationId }
  } catch (error) {
    console.error('Error deleting reservation:', error)
    throw error
  }
}

/**
 * Obtiene reservas de un huésped
 */
export async function getGuestReservations(guestId) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const q = query(
      collection(db, COLLECTION_NAME),
      where('guestId', '==', guestId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const reservations = []
    
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })
    })
    
    return reservations
  } catch (error) {
    console.error('Error getting guest reservations:', error)
    throw error
  }
}

/**
 * Obtiene reservas de una propiedad específica
 */
export async function getPropertyReservations(propertyId) {
  try {
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED')
    const q = query(
      collection(db, COLLECTION_NAME),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const reservations = []
    
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })
    })
    
    return reservations
  } catch (error) {
    console.error('Error getting property reservations:', error)
    throw error
  }
}
