// Firestore Database Structure
// 
// Este archivo documenta la estructura de las colecciones en Firestore
// 
// COLECCIONES PRIVADAS (Gestión del Locatario)
// /artifacts/{appId}/users/{userId}/properties/{propertyId}
// {
//   id: string,
//   title: string,
//   description: string,
//   propertyType: string, // casa, apartamento, cabaña, etc.
//   images: string[], // URLs de las imágenes
//   pricing: {
//     basePrice: number,
//     cleaningFee: number,
//     currency: string
//   },
//   capacity: {
//     guests: number,
//     bedrooms: number,
//     beds: number,
//     bathrooms: number
//   },
//   location: {
//     address: string,
//     city: string,
//     state: string,
//     country: string,
//     coordinates: { lat: number, lng: number }
//   },
//   amenities: string[], // array de comodidades
//   localFeatures: { // OPORTUNIDAD DE DATOS LOCALES
//     grillType: string, // 'gas', 'carbón', 'eléctrica'
//     parkingSize: string, // 'pequeña', 'mediana', 'grande'
//     nearbyAttractions: string[],
//     distanceToCenter: number
//   },
//   rules: string[],
//   availability: {
//     calendar: string, // URL iCal
//     blockedDates: string[] // fechas bloqueadas
//   },
//   status: string, // 'active', 'inactive', 'pending'
//   createdAt: timestamp,
//   updatedAt: timestamp
// }
//
// /artifacts/{appId}/users/{userId}/messages/{messageId}
// {
//   id: string,
//   propertyId: string,
//   guestName: string,
//   guestEmail: string,
//   message: string,
//   status: string, // 'unread', 'read', 'replied'
//   checkIn: string,
//   checkOut: string,
//   guests: number,
//   createdAt: timestamp
// }
//
// /artifacts/{appId}/users/{userId}/subscription
// {
//   plan: string, // 'basic', 'premium', 'enterprise'
//   status: string, // 'active', 'cancelled', 'expired'
//   startDate: timestamp,
//   endDate: timestamp,
//   paymentMethod: string,
//   amount: number,
//   currency: string
// }
//
// COLECCIONES PÚBLICAS (Motor de Búsqueda)
// /artifacts/{appId}/public/data/listings/{listingId}
// {
//   id: string,
//   ownerId: string,
//   title: string,
//   description: string,
//   propertyType: string,
//   mainImage: string,
//   images: string[],
//   pricing: {
//     basePrice: number,
//     cleaningFee: number,
//     currency: string
//   },
//   capacity: {
//     guests: number,
//     bedrooms: number,
//     beds: number,
//     bathrooms: number
//   },
//   location: {
//     city: string,
//     state: string,
//     coordinates: { lat: number, lng: number }
//   },
//   amenities: string[],
//   localFeatures: {
//     grillType: string,
//     parkingSize: string,
//     nearbyAttractions: string[],
//     distanceToCenter: number
//   },
//   rating: number,
//   reviewCount: number,
//   availableDates: string[], // fechas disponibles para búsqueda rápida
//   createdAt: timestamp,
//   updatedAt: timestamp,
//   isActive: boolean
// }
//
// /artifacts/{appId}/public/data/reviews/{reviewId}
// {
//   listingId: string,
//   guestName: string,
//   rating: number,
//   comment: string,
//   verified: boolean,
//   createdAt: timestamp
// }

export const APP_ID = 'alqui-libres'

// Helper functions para construir paths
export const getPrivatePropertyPath = (userId) => 
  `artifacts/${APP_ID}/users/${userId}/properties`

export const getPrivateMessagesPath = (userId) => 
  `artifacts/${APP_ID}/users/${userId}/messages`

export const getPrivateSubscriptionPath = (userId) => 
  `artifacts/${APP_ID}/users/${userId}/subscription`

export const getPublicListingsPath = () => 
  `artifacts/${APP_ID}/public/data/listings`

export const getPublicReviewsPath = () => 
  `artifacts/${APP_ID}/public/data/reviews`
