import { watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Composable para actualizar meta tags dinámicamente
 * según la ruta actual
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
    // Buscar por name o property
    let element = document.querySelector(`meta[name="${name}"]`) || 
                  document.querySelector(`meta[property="${name}"]`)
    
    if (!element) {
      element = document.createElement('meta')
      const isProperty = name.includes(':')
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
 * Helper para generar structured data de propiedades
 */
export function generatePropertySchema(property) {
  const baseUrl = 'https://alquilibres.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: property.title,
    description: property.description,
    image: property.images || [property.mainImage],
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location?.city,
      addressRegion: property.location?.state,
      addressCountry: property.location?.country || 'AR'
    },
    geo: property.location?.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: property.location.coordinates.lat,
      longitude: property.location.coordinates.lng
    } : undefined,
    numberOfRooms: property.capacity?.bedrooms,
    occupancy: {
      '@type': 'QuantitativeValue',
      value: property.capacity?.guests
    },
    amenityFeature: property.amenities?.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true
    })),
    priceRange: property.pricing ? `${property.pricing.currency} ${property.pricing.basePrice}` : undefined,
    url: `${baseUrl}/propiedad/${property.id}`,
    aggregateRating: property.rating ? {
      '@type': 'AggregateRating',
      ratingValue: property.rating,
      reviewCount: property.reviewCount || 0,
      bestRating: 5,
      worstRating: 1
    } : undefined
  }
}

/**
 * Metadatos predefinidos por ruta
 */
export const routeMetadata = {
  home: {
    title: 'AlquiLibres - Alquileres Temporarios Sin Comisiones | Suscripción Fija',
    description: 'Publica tus propiedades sin comisiones por reserva. Suscripción fija mensual vs 15-25% de Airbnb/Booking. Filtros hiperlocales únicos.',
    keywords: 'alquiler temporario, sin comisiones, alquiler vacacional, cabañas, departamentos',
    url: 'https://alquilibres.com/',
    image: 'https://alquilibres.com/og-image.jpg'
  },
  search: {
    title: 'Buscar Alojamiento | AlquiLibres',
    description: 'Encuentra el alojamiento perfecto con nuestros filtros hiperlocales: tipo de parrilla, tamaño de estacionamiento y más.',
    keywords: 'buscar alojamiento, casas vacacionales, parrilla, estacionamiento',
    url: 'https://alquilibres.com/buscar',
    image: 'https://alquilibres.com/og-search.jpg'
  },
  login: {
    title: 'Iniciar Sesión | AlquiLibres',
    description: 'Accede a tu cuenta de AlquiLibres para gestionar tus propiedades sin comisiones.',
    url: 'https://alquilibres.com/login'
  },
  register: {
    title: 'Registrarse | AlquiLibres',
    description: 'Crea tu cuenta y comienza a publicar propiedades sin comisiones por reserva.',
    url: 'https://alquilibres.com/registro'
  },
  dashboard: {
    title: 'Mi Panel | AlquiLibres',
    description: 'Gestiona tus propiedades, reservas y suscripción.',
    url: 'https://alquilibres.com/panel'
  }
}
