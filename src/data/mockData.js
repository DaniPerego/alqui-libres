// Mock data para testing sin Firebase
export const mockProperties = [
  {
    id: '1',
    ownerId: 'user123',
    title: 'Casa Familiar con Parrilla y Pileta',
    description: 'Hermosa casa ideal para familias, con amplio jardín, parrilla de carbón profesional y pileta climatizada. A solo 5 minutos del centro de la ciudad.',
    propertyType: 'casa',
    mainImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    pricing: {
      basePrice: 120,
      cleaningFee: 30,
      currency: 'USD'
    },
    capacity: {
      guests: 8,
      bedrooms: 4,
      beds: 5,
      bathrooms: 3
    },
    location: {
      city: 'Villa Carlos Paz',
      state: 'Córdoba',
      country: 'Argentina',
      coordinates: { lat: -31.4204, lng: -64.1888 }
    },
    amenities: ['WiFi', 'TV', 'Cocina completa', 'Aire Acondicionado', 'Calefacción', 'Piscina', 'Parrilla', 'Estacionamiento', 'Jardín'],
    localFeatures: {
      grillType: 'carbon',
      parkingSize: 'grande',
      nearbyAttractions: ['Lago San Roque', 'Cerro de la Cruz'],
      distanceToCenter: 5.2
    },
    rating: 4.9,
    reviewCount: 47,
    isActive: true,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-20')
  },
  {
    id: '2',
    ownerId: 'user123',
    title: 'Departamento Céntrico con Vista al Mar',
    description: 'Moderno departamento en pleno centro, con impresionantes vistas al mar. Ideal para parejas o pequeñas familias.',
    propertyType: 'apartamento',
    mainImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260066-6bc35f0a1e1e?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    pricing: {
      basePrice: 85,
      cleaningFee: 20,
      currency: 'USD'
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2
    },
    location: {
      city: 'Mar del Plata',
      state: 'Buenos Aires',
      country: 'Argentina',
      coordinates: { lat: -38.0055, lng: -57.5426 }
    },
    amenities: ['WiFi', 'TV', 'Cocina', 'Aire Acondicionado', 'Vista al mar', 'Balcón'],
    localFeatures: {
      grillType: 'electrica',
      parkingSize: 'pequena',
      nearbyAttractions: ['Playa Bristol', 'Rambla'],
      distanceToCenter: 0.5
    },
    rating: 4.7,
    reviewCount: 32,
    isActive: true,
    status: 'active',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-10-25')
  },
  {
    id: '3',
    ownerId: 'user456',
    title: 'Cabaña Rústica en las Sierras',
    description: 'Cabaña de montaña perfecta para desconectarse. Rodeada de naturaleza, con fogón y quincho. Ideal para grupos de amigos.',
    propertyType: 'cabana',
    mainImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
    images: [
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',
      'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800'
    ],
    pricing: {
      basePrice: 95,
      cleaningFee: 25,
      currency: 'USD'
    },
    capacity: {
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2
    },
    location: {
      city: 'Mina Clavero',
      state: 'Córdoba',
      country: 'Argentina',
      coordinates: { lat: -31.7281, lng: -65.0078 }
    },
    amenities: ['WiFi', 'Cocina', 'Calefacción', 'Parrilla', 'Jardín', 'Fogón', 'Quincho'],
    localFeatures: {
      grillType: 'carbon',
      parkingSize: 'mediana',
      nearbyAttractions: ['Río Mina Clavero', 'Nido de Águila'],
      distanceToCenter: 8.5
    },
    rating: 4.8,
    reviewCount: 28,
    isActive: true,
    status: 'active',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: '4',
    ownerId: 'user123',
    title: 'Loft Moderno en Palermo',
    description: 'Loft de diseño en el corazón de Palermo. Perfecto para profesionales o parejas que buscan comodidad y estilo.',
    propertyType: 'loft',
    mainImage: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800'
    ],
    pricing: {
      basePrice: 110,
      cleaningFee: 15,
      currency: 'USD'
    },
    capacity: {
      guests: 3,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1
    },
    location: {
      city: 'Buenos Aires',
      state: 'CABA',
      country: 'Argentina',
      coordinates: { lat: -34.5889, lng: -58.4199 }
    },
    amenities: ['WiFi', 'TV', 'Cocina', 'Aire Acondicionado', 'Lavadora', 'Gimnasio'],
    localFeatures: {
      grillType: '',
      parkingSize: '',
      nearbyAttractions: ['Bosques de Palermo', 'Plaza Serrano'],
      distanceToCenter: 3.2
    },
    rating: 4.6,
    reviewCount: 19,
    isActive: true,
    status: 'active',
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-10-30')
  }
]

export const mockReviews = [
  {
    id: 'r1',
    listingId: '1',
    guestName: 'María González',
    rating: 5,
    comment: 'Excelente lugar, la parrilla es espectacular y la casa tiene todo lo necesario. El anfitrión fue muy atento. ¡Volveremos seguro!',
    verified: true,
    createdAt: new Date('2024-10-15')
  },
  {
    id: 'r2',
    listingId: '1',
    guestName: 'Carlos Ramírez',
    rating: 5,
    comment: 'Perfecta para familias. Los niños disfrutaron mucho la pileta y el jardín es enorme. Muy limpia y bien ubicada.',
    verified: true,
    createdAt: new Date('2024-09-22')
  },
  {
    id: 'r3',
    listingId: '2',
    guestName: 'Laura Fernández',
    rating: 5,
    comment: 'La vista al mar es increíble. Departamento muy cómodo y céntrico. Caminamos a todas partes.',
    verified: true,
    createdAt: new Date('2024-08-10')
  },
  {
    id: 'r4',
    listingId: '3',
    guestName: 'Javier López',
    rating: 5,
    comment: 'Un lugar mágico para desconectarse. La naturaleza, el río cerca y la tranquilidad son incomparables.',
    verified: true,
    createdAt: new Date('2024-07-05')
  }
]

export const mockMessages = [
  {
    id: 'm1',
    propertyId: '1',
    propertyTitle: 'Casa Familiar con Parrilla y Pileta',
    guestName: 'Ana Martínez',
    guestEmail: 'ana.martinez@example.com',
    message: '¡Hola! Me interesa tu propiedad para las fechas 15-20 de diciembre. Somos 6 adultos y 2 niños. ¿Está disponible? ¿Incluye ropa de cama?',
    status: 'unread',
    checkIn: '2025-12-15',
    checkOut: '2025-12-20',
    guests: 8,
    createdAt: new Date('2025-11-05')
  },
  {
    id: 'm2',
    propertyId: '2',
    propertyTitle: 'Departamento Céntrico con Vista al Mar',
    guestName: 'Roberto Silva',
    guestEmail: 'roberto.silva@example.com',
    message: 'Buenas tardes, ¿el estacionamiento está incluido? ¿Qué tan cerca está de la playa?',
    status: 'read',
    checkIn: '2025-11-20',
    checkOut: '2025-11-25',
    guests: 2,
    createdAt: new Date('2025-11-03')
  },
  {
    id: 'm3',
    propertyId: '4',
    propertyTitle: 'Loft Moderno en Palermo',
    guestName: 'Sofía Rodríguez',
    guestEmail: 'sofia.rodriguez@example.com',
    message: 'Hola, viajo por trabajo y necesito quedarme un mes. ¿Hacen descuentos por estadías largas?',
    status: 'unread',
    checkIn: '2025-12-01',
    checkOut: '2025-12-31',
    guests: 1,
    createdAt: new Date('2025-11-06')
  }
]

export const mockUser = {
  uid: 'user123',
  email: 'demo@alquilubres.com',
  displayName: 'Usuario Demo',
  emailVerified: true
}
