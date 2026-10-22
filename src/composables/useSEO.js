import { watch } from 'vue'
import { useRoute } from 'vue-router'

// Must match the production deployment domain.
export const SITE_URL = 'https://alqui-libres.vercel.app'

const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-192.png`

/**
 * Composable to update meta tags dynamically based on the current route.
 */
export function useSEO() {
  const route = useRoute()

  const updateMetaTags = (meta) => {
    // Actualizar título
    if (meta.title) {
      document.title = meta.title
      updateMetaTag('og:title', meta.title)
      updateMetaTag('twitter:title', meta.title)
    }

    // Actualizar descripción
    if (meta.description) {
      updateMetaTag('description', meta.description)
      updateMetaTag('og:description', meta.description)
      updateMetaTag('twitter:description', meta.description)
    }

    // Actualizar URL canónica
    if (meta.url) {
      updateCanonicalUrl(meta.url)
      updateMetaTag('og:url', meta.url)
      updateMetaTag('twitter:url', meta.url)
    }

    // Actualizar imagen
    if (meta.image) {
      updateMetaTag('og:image', meta.image)
      updateMetaTag('twitter:image', meta.image)
    }

    // Actualizar keywords
    if (meta.keywords) {
      updateMetaTag('keywords', meta.keywords)
    }

    // Actualizar tipo (Open Graph)
    if (meta.type) {
      updateMetaTag('og:type', meta.type)
    }
  }

  const updateMetaTag = (name, content) => {
    // Search existing meta by name or property.
    let element = document.querySelector(`meta[name="${name}"]`) ||
                  document.querySelector(`meta[property="${name}"]`)

    if (!element) {
      element = document.createElement('meta')
      // Open Graph uses `property`; Twitter and standard tags use `name`.
      const isProperty = name.startsWith('og:')
      if (isProperty) {
        element.setAttribute('property', name)
      } else {
        element.setAttribute('name', name)
      }
      document.head.appendChild(element)
    }

    element.setAttribute('content', content)
  }

  const updateCanonicalUrl = (url) => {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', url)
  }

  const addStructuredData = (data) => {
    // Remover script anterior si existe
    const existingScript = document.querySelector('script[data-dynamic-ld]')
    if (existingScript) {
      existingScript.remove()
    }

    // Agregar nuevo script con datos estructurados
    const script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-dynamic-ld', 'true')
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  // Observar cambios de ruta
  watch(
    () => route.meta,
    (meta) => {
      if (meta && Object.keys(meta).length > 0) {
        updateMetaTags(meta)
      }
    },
    { immediate: true }
  )

  return {
    updateMetaTags,
    addStructuredData
  }
}

/**
 * Converts a relative asset path into an absolute URL using the production domain.
 */
export function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return DEFAULT_OG_IMAGE
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_URL}${path}`
}

/**
 * Builds a complete SEO meta object for a property detail page.
 */
export function buildPropertyMeta(property) {
  const title = property?.title ? `${property.title} | AlquiLibres` : 'AlquiLibres'
  const rawDescription = property?.description || ''
  const description = rawDescription.trim().slice(0, 160) ||
    `${title}. Alquiler temporario en ${property?.location?.city || 'Argentina'}.`

  const rawImage = property?.images?.[0] || property?.mainImage || ''
  const imageBase = toAbsoluteUrl(rawImage)
  const image = imageBase.includes('?')
    ? `${imageBase}&w=1200&h=630&fit=crop`
    : `${imageBase}?w=1200&h=630&fit=crop`

  const url = `${SITE_URL}/propiedad/${property?.id}`

  const keywords = [
    property?.propertyType,
    property?.location?.city,
    `alquiler ${property?.rentalType || 'temporario'}`,
    ...(property?.amenities || [])
  ].filter(Boolean).join(', ')

  return { title, description, url, image, keywords, type: 'product' }
}

/**
 * Generates Schema.org structured data for a property.
 */
export function generatePropertySchema(property) {
  const images = Array.isArray(property?.images) && property.images.length > 0
    ? property.images
    : [property?.mainImage].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: property?.title,
    description: property?.description,
    image: images.map(toAbsoluteUrl),
    address: {
      '@type': 'PostalAddress',
      addressLocality: property?.location?.city,
      addressRegion: property?.location?.state,
      addressCountry: property?.location?.country || 'AR'
    },
    geo: property?.location?.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: property.location.coordinates.lat,
      longitude: property.location.coordinates.lng
    } : undefined,
    numberOfRooms: property?.capacity?.bedrooms,
    occupancy: {
      '@type': 'QuantitativeValue',
      value: property?.capacity?.guests
    },
    amenityFeature: property?.amenities?.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true
    })),
    priceRange: property?.pricing ? `${property.pricing.currency} ${property.pricing.basePrice}` : undefined,
    url: `${SITE_URL}/propiedad/${property?.id}`,
    aggregateRating: property?.rating ? {
      '@type': 'AggregateRating',
      ratingValue: property.rating,
      reviewCount: property.reviewCount || 0,
      bestRating: 5,
      worstRating: 1
    } : undefined
  }
}

/**
 * Predefined metadata for static routes.
 */
export const routeMetadata = {
  home: {
    title: 'AlquiLibres - Alquileres Temporarios Sin Comisiones | Suscripción Fija',
    description: 'Publica tus propiedades sin comisiones por reserva. Suscripción fija mensual vs 15-25% de Airbnb/Booking. Filtros hiperlocales únicos.',
    keywords: 'alquiler temporario, sin comisiones, alquiler vacacional, cabañas, departamentos',
    url: `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE
  },
  search: {
    title: 'Buscar Alojamiento | AlquiLibres',
    description: 'Encuentra el alojamiento perfecto con nuestros filtros hiperlocales: tipo de parrilla, tamaño de estacionamiento y más.',
    keywords: 'buscar alojamiento, casas vacacionales, parrilla, estacionamiento',
    url: `${SITE_URL}/buscar`,
    image: DEFAULT_OG_IMAGE
  },
  login: {
    title: 'Iniciar Sesión | AlquiLibres',
    description: 'Accede a tu cuenta de AlquiLibres para gestionar tus propiedades sin comisiones.',
    url: `${SITE_URL}/login`,
    image: DEFAULT_OG_IMAGE
  },
  register: {
    title: 'Registrarse | AlquiLibres',
    description: 'Crea tu cuenta y comienza a publicar propiedades sin comisiones por reserva.',
    url: `${SITE_URL}/registro`,
    image: DEFAULT_OG_IMAGE
  },
  dashboard: {
    title: 'Mi Panel | AlquiLibres',
    description: 'Gestiona tus propiedades, reservas y suscripción.',
    url: `${SITE_URL}/panel`,
    image: DEFAULT_OG_IMAGE
  }
}
