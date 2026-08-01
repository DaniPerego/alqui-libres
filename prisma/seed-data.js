// prisma/seed-data.js
//
// Pure, unit-testable seed payload builder (VPD-04, D8, D9, D10).
// Takes the existing mockData from src/data/mockData.js and produces
// upsert-ready rows:
//   - normalizes propertyType values into the PropertyType enum (D8):
//     apartamento -> departamento, cabana -> cabana, loft -> otro
//   - keeps rentalType values as-is ('temporario' | 'anual' -> PropertyRentalType)
//   - remaps mock owner ids ('user123' / 'user456' / 'owner001') to the
//     seeded Supabase owner UID (usuario@alquilibres.com)
//   - remaps review listingId -> seeded property id and message/review
//     participants to the seeded guest/owner UIDs
//   - seeds 3 demo users, plans (basic/pro/enterprise), platform_settings
//     'general', 2 demo reservations + their notification rows (D10)
//
// No I/O: this module never touches the DB or Supabase. See seed.js for
// the orchestration that consumes buildSeedPayload().

// D8 — mockData uses propertyType values that are NOT members of the
// PropertyType enum (apartamento/cabana/loft). Normalize into enum members.
export const PROPERTY_TYPE_NORMALIZATION = {
  casa: 'casa',
  departamento: 'departamento',
  apartamento: 'departamento',
  cabana: 'cabana',
  habitacion: 'habitacion',
  loft: 'otro',
  otro: 'otro',
}

export function normalizePropertyType(value) {
  return PROPERTY_TYPE_NORMALIZATION[value] || 'otro'
}

// D9 — stable mock owner ids map to the single seeded owner account
// (usuario@alquilibres.com). 'owner001' is the owner id used by
// mockAnnualProperty.
function buildOwnerIdMap(ownerUid) {
  return { user123: ownerUid, user456: ownerUid, owner001: ownerUid }
}

function toDate(value) {
  if (value === undefined || value === null) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function rentalTypeToEnum(value) {
  return value === 'anual' ? 'anual' : 'temporario'
}

export function buildSeedPayload(mockData, { userIds }) {
  const {
    mockProperties,
    mockPendingProperties,
    mockAnnualProperty,
    mockReviews,
    mockMessages,
    mockGuestUser,
    mockOwnerUser,
    mockAdminUser,
  } = mockData

  if (!userIds || !userIds.guest || !userIds.owner || !userIds.admin) {
    throw new Error('buildSeedPayload requiere userIds = { guest, owner, admin } (Supabase UIDs)')
  }

  const ownerUid = buildOwnerIdMap(userIds.owner)
  const resolveOwner = (id) => ownerUid[id] || id

  // --- users rows (id = Supabase Auth UID, D1) ---
  const users = [
    {
      id: userIds.guest,
      email: mockGuestUser.email,
      displayName: mockGuestUser.displayName,
      role: 'guest',
      emailVerified: mockGuestUser.emailVerified !== false,
      isActive: true,
      subscription: mockGuestUser.subscription ?? null,
    },
    {
      id: userIds.owner,
      email: mockOwnerUser.email,
      displayName: mockOwnerUser.displayName,
      role: 'owner',
      emailVerified: mockOwnerUser.emailVerified !== false,
      isActive: true,
      subscription: mockOwnerUser.subscription ?? null,
    },
    {
      id: userIds.admin,
      email: mockAdminUser.email,
      displayName: mockAdminUser.displayName,
      role: 'admin',
      emailVerified: mockAdminUser.emailVerified !== false,
      isActive: true,
      subscription: mockAdminUser.subscription ?? null,
    },
  ]

  // --- properties (all mock data: active + pending/rejected + annual) ---
  const allProperties = [
    ...mockProperties,
    ...mockPendingProperties,
    ...(mockAnnualProperty ? [mockAnnualProperty] : []),
  ]

  const properties = allProperties.map((p) => ({
    id: p.id,
    ownerId: resolveOwner(p.ownerId),
    ownerName: mockOwnerUser.displayName,
    ownerEmail: mockOwnerUser.email,
    title: p.title,
    description: p.description,
    propertyType: normalizePropertyType(p.propertyType),
    rentalType: rentalTypeToEnum(p.rentalType),
    mainImage: p.mainImage ?? null,
    images: p.images ?? [],
    locationCity: p.location?.city ?? '',
    locationState: p.location?.state ?? '',
    locationCountry: p.location?.country ?? 'Argentina',
    locationPostalCode: p.location?.postalCode ?? null,
    locationCoordinates: p.location?.coordinates ?? null,
    capacityGuests: p.capacity?.guests ?? 1,
    capacityBedrooms: p.capacity?.bedrooms ?? 1,
    capacityBeds: p.capacity?.beds ?? 1,
    capacityBathrooms: p.capacity?.bathrooms ?? 1,
    localFeatures: p.localFeatures ?? null,
    amenities: p.amenities ?? [],
    pricingBasePrice: p.pricing?.basePrice ?? 0,
    pricingCleaningFee: p.pricing?.cleaningFee ?? 0,
    pricingCurrency: p.pricing?.currency ?? 'ARS',
    pricingWeeklyDiscount: p.pricing?.weeklyDiscount ?? null,
    pricingMonthlyDiscount: p.pricing?.monthlyDiscount ?? null,
    availability: p.availability ?? null,
    houseRules: p.houseRules ?? null,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    viewCount: p.viewCount ?? 0,
    bookingCount: p.bookingCount ?? 0,
    status: p.status ?? 'pending',
    isActive: p.isActive ?? false,
    featured: p.featured ?? false,
    reviewedAt: toDate(p.reviewedAt),
    reviewedBy: p.reviewedBy ?? null,
    rejectionReason: p.rejectionReason ?? null,
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
  }))

  const propertiesById = new Map(properties.map((p) => [p.id, p]))

  // --- reviews (listingId -> property id, guest -> seeded guest UID) ---
  const reviews = mockReviews.map((r) => {
    const prop = propertiesById.get(String(r.listingId))
    return {
      id: r.id,
      propertyId: String(r.listingId),
      ownerId: prop ? prop.ownerId : userIds.owner,
      guestId: userIds.guest,
      reservationId: r.reservationId ?? null,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment ?? null,
      verified: r.verified ?? false,
      visible: r.visible ?? true,
      createdAt: toDate(r.createdAt),
      updatedAt: toDate(r.updatedAt ?? r.createdAt),
    }
  })

  // --- messages (participants -> seeded UIDs) ---
  const messages = mockMessages.map((m) => {
    const prop = propertiesById.get(String(m.propertyId))
    return {
      id: m.id,
      ownerId: prop ? prop.ownerId : userIds.owner,
      guestId: userIds.guest,
      propertyId: String(m.propertyId),
      propertyTitle: m.propertyTitle ?? null,
      guestName: m.guestName,
      guestEmail: m.guestEmail,
      message: m.message,
      checkIn: m.checkIn ? toDate(m.checkIn) : null,
      checkOut: m.checkOut ? toDate(m.checkOut) : null,
      guests: m.guests ?? null,
      status: m.status ?? 'unread',
      read: m.status === 'read' || m.read === true,
      readAt: m.status === 'read' && m.readAt ? toDate(m.readAt) : null,
      repliedAt: m.repliedAt ? toDate(m.repliedAt) : null,
      createdAt: toDate(m.createdAt),
    }
  })

  // --- plans (stable ids basic/pro/enterprise, D9) ---
  const plans = [
    {
      id: 'basic',
      name: 'Plan Básico',
      price: 14999,
      currency: 'ARS',
      interval: 'month',
      features: ['Hasta 3 propiedades activas', 'Sin comisión por reserva', 'Soporte por email'],
      maxProperties: 3,
      isActive: true,
      recommended: false,
      order: 1,
    },
    {
      id: 'pro',
      name: 'Plan Profesional',
      price: 24999,
      currency: 'ARS',
      interval: 'month',
      features: [
        'Hasta 10 propiedades activas',
        'Sin comisión por reserva',
        'Soporte prioritario 24/7',
        'Panel de gestión avanzado',
        'Estadísticas detalladas',
        'Destacado en búsquedas',
      ],
      maxProperties: 10,
      isActive: true,
      recommended: true,
      order: 2,
    },
    {
      id: 'enterprise',
      name: 'Plan Empresarial',
      price: 49999,
      currency: 'ARS',
      interval: 'month',
      features: ['Propiedades ilimitadas', 'Sin comisión por reserva', 'Soporte dedicado'],
      maxProperties: -1,
      isActive: true,
      recommended: false,
      order: 3,
    },
  ]

  // --- platform settings (single row 'general', D3) ---
  const platformSettings = {
    id: 'general',
    platformName: 'AlquiLibres',
    contactEmail: 'info@alquilibres.com',
    supportPhone: '+54 9 11 1234-5678',
    commissionRate: 0,
    emailNotifications: true,
    whatsappNotifications: true,
    requireEmailVerification: false,
    moderateProperties: false,
  }

  // --- demo reservations (D10) + notification rows (API-04 semantics) ---
  function snapshot(prop) {
    return {
      id: prop.id,
      title: prop.title,
      city: prop.locationCity,
      image: prop.mainImage ?? (prop.images && prop.images[0]) ?? null,
    }
  }

  const res1Prop = propertiesById.get('1') // Casa Familiar con Parrilla y Pileta
  const res2Prop = propertiesById.get('2') // Departamento Céntrico con Vista al Mar

  const reservations = [
    {
      id: 'res-1',
      propertyId: res1Prop.id,
      ownerId: res1Prop.ownerId,
      guestId: userIds.guest,
      property: snapshot(res1Prop),
      guestName: mockGuestUser.displayName,
      guestEmail: mockGuestUser.email,
      ownerName: res1Prop.ownerName,
      ownerEmail: res1Prop.ownerEmail,
      checkIn: new Date('2026-01-10T14:00:00.000Z'),
      checkOut: new Date('2026-01-14T10:00:00.000Z'),
      nights: 4,
      guests: 6,
      basePrice: res1Prop.pricingBasePrice,
      cleaningFee: res1Prop.pricingCleaningFee,
      total: 4 * res1Prop.pricingBasePrice + res1Prop.pricingCleaningFee,
      message: 'Hola! Me interesa esta propiedad para la segunda semana de enero. ¿Está disponible?',
      status: 'pending',
      createdAt: new Date('2025-11-20T10:00:00.000Z'),
    },
    {
      id: 'res-2',
      propertyId: res2Prop.id,
      ownerId: res2Prop.ownerId,
      guestId: userIds.guest,
      property: snapshot(res2Prop),
      guestName: mockGuestUser.displayName,
      guestEmail: mockGuestUser.email,
      ownerName: res2Prop.ownerName,
      ownerEmail: res2Prop.ownerEmail,
      checkIn: new Date('2026-02-05T14:00:00.000Z'),
      checkOut: new Date('2026-02-08T10:00:00.000Z'),
      nights: 3,
      guests: 2,
      basePrice: res2Prop.pricingBasePrice,
      cleaningFee: res2Prop.pricingCleaningFee,
      total: 3 * res2Prop.pricingBasePrice + res2Prop.pricingCleaningFee,
      message: 'Reserva confirmada por el propietario.',
      status: 'confirmed',
      confirmedAt: new Date('2025-11-25T09:00:00.000Z'),
      createdAt: new Date('2025-11-20T11:00:00.000Z'),
    },
  ]

  // API-04: reservation create notifies the owner; confirm notifies the guest.
  const notifications = [
    {
      id: 'notif-res-1',
      userId: res1Prop.ownerId,
      type: 'reservation',
      title: 'Nueva solicitud de reserva',
      body: `Nueva solicitud de reserva para "${res1Prop.title}".`,
      data: { propertyId: res1Prop.id, reservationId: 'res-1', actionUrl: `/owner/reservations` },
      priority: 'normal',
      createdAt: reservations[0].createdAt,
    },
    {
      id: 'notif-res-2',
      userId: userIds.guest,
      type: 'reservation',
      title: 'Reserva confirmada',
      body: `Tu reserva en "${res2Prop.title}" fue confirmada.`,
      data: { propertyId: res2Prop.id, reservationId: 'res-2', actionUrl: `/reservations` },
      priority: 'normal',
      createdAt: reservations[1].confirmedAt,
    },
  ]

  return {
    users,
    properties,
    plans,
    platformSettings,
    reviews,
    messages,
    reservations,
    notifications,
  }
}
