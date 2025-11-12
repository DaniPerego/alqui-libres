import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { routeMetadata } from '@/composables/useSEO'

// Importar vistas lazy loading para optimización
const Home = () => import('@/views/Home.vue')
const Search = () => import('@/views/Search.vue')
const PropertyDetail = () => import('@/views/PropertyDetail.vue')
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')

// Panel del Locatario
const Dashboard = () => import('@/views/owner/Dashboard.vue')
const MyProperties = () => import('@/views/owner/MyProperties.vue')
const PropertyEditor = () => import('@/views/owner/PropertyEditor.vue')
const Messages = () => import('@/views/owner/Messages.vue')
const Subscription = () => import('@/views/owner/Subscription.vue')

// Panel de Administración
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const AdminUsers = () => import('@/views/admin/AdminUsers.vue')
const AdminProperties = () => import('@/views/admin/AdminProperties.vue')
const AdminPlans = () => import('@/views/admin/AdminPlans.vue')

// Páginas Legales
const TermsConditions = () => import('@/views/legal/TermsConditions.vue')
const PrivacyPolicy = () => import('@/views/legal/PrivacyPolicy.vue')
const ContractTemplate = () => import('@/views/legal/ContractTemplate.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { 
      ...routeMetadata.home,
      title: 'AlquiLibres - Alquileres Sin Comisiones'
    }
  },
  {
    path: '/buscar',
    name: 'search',
    component: Search,
    meta: { 
      ...routeMetadata.search,
      title: 'Buscar Alojamiento'
    }
  },
  {
    path: '/propiedad/:id',
    name: 'property-detail',
    component: PropertyDetail,
    meta: { 
      title: 'Detalle de Propiedad',
      type: 'product' // Para Open Graph
    }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { 
      ...routeMetadata.login,
      title: 'Iniciar Sesión', 
      guest: true 
    }
  },
  {
    path: '/registro',
    name: 'register',
    component: Register,
    meta: { 
      ...routeMetadata.register,
      title: 'Registrarse', 
      guest: true 
    }
  },
  {
    path: '/panel',
    name: 'dashboard',
    component: Dashboard,
    meta: { 
      ...routeMetadata.dashboard,
      title: 'Panel de Control', 
      requiresAuth: true 
    },
    redirect: { name: 'my-properties' },
    children: [
      {
        path: 'propiedades',
        name: 'my-properties',
        component: MyProperties,
        meta: { 
          title: 'Mis Propiedades | AlquiLibres',
          description: 'Administra tus propiedades publicadas en AlquiLibres',
          requiresAuth: true 
        }
      },
      {
        path: 'propiedades/nueva',
        name: 'new-property',
        component: PropertyEditor,
        meta: { 
          title: 'Nueva Propiedad | AlquiLibres',
          description: 'Publica una nueva propiedad en AlquiLibres sin comisiones',
          requiresAuth: true 
        }
      },
      {
        path: 'propiedades/:id/editar',
        name: 'edit-property',
        component: PropertyEditor,
        meta: { 
          title: 'Editar Propiedad | AlquiLibres',
          description: 'Modifica los detalles de tu propiedad',
          requiresAuth: true 
        }
      },
      {
        path: 'mensajes',
        name: 'messages',
        component: Messages,
        meta: { 
          title: 'Mensajes | AlquiLibres',
          description: 'Gestiona tus conversaciones con huéspedes',
          requiresAuth: true 
        }
      },
      {
        path: 'suscripcion',
        name: 'subscription',
        component: Subscription,
        meta: { 
          title: 'Mi Suscripción | AlquiLibres',
          description: 'Administra tu plan de suscripción mensual',
          requiresAuth: true 
        }
      },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('@/views/owner/Checkout.vue'),
        meta: { 
          title: 'Checkout | AlquiLibres',
          description: 'Completa tu suscripción',
          requiresAuth: true 
        }
      },
      {
        path: 'payment-result',
        name: 'payment-result',
        component: () => import('@/views/owner/PaymentResult.vue'),
        meta: { 
          title: 'Resultado del Pago | AlquiLibres',
          description: 'Estado de tu pago',
          requiresAuth: true 
        }
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    redirect: { name: 'admin-dashboard' },
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { 
          title: 'Admin Dashboard | AlquiLibres',
          description: 'Panel de administración de AlquiLibres',
          requiresAuth: true, 
          requiresAdmin: true 
        }
      },
      {
        path: 'usuarios',
        name: 'admin-users',
        component: AdminUsers,
        meta: { 
          title: 'Gestión de Usuarios | Admin',
          description: 'Administrar usuarios de la plataforma',
          requiresAuth: true, 
          requiresAdmin: true 
        }
      },
      {
        path: 'propiedades',
        name: 'admin-properties',
        component: AdminProperties,
        meta: { 
          title: 'Gestión de Propiedades | Admin',
          description: 'Moderar y administrar propiedades publicadas',
          requiresAuth: true, 
          requiresAdmin: true 
        }
      },
      {
        path: 'planes',
        name: 'admin-plans',
        component: AdminPlans,
        meta: { 
          title: 'Gestión de Planes | Admin',
          description: 'Configurar planes de suscripción',
          requiresAuth: true, 
          requiresAdmin: true 
        }
      },
      {
        path: 'pagos',
        name: 'admin-payments',
        component: () => import('@/views/admin/AdminPaymentSettings.vue'),
        meta: { 
          title: 'Configuración de Pagos | Admin',
          description: 'Configurar integración con MercadoPago',
          requiresAuth: true, 
          requiresAdmin: true 
        }
      }
    ]
  },
  {
    path: '/terminos',
    name: 'terms',
    component: TermsConditions,
    meta: {
      title: 'Términos y Condiciones | AlquiLibres',
      description: 'Términos y condiciones de uso de la plataforma AlquiLibres',
      url: 'https://alquilibres.com/terminos',
      keywords: 'términos, condiciones, legal, contrato'
    }
  },
  {
    path: '/privacidad',
    name: 'privacy',
    component: PrivacyPolicy,
    meta: {
      title: 'Política de Privacidad | AlquiLibres',
      description: 'Política de privacidad y protección de datos personales de AlquiLibres',
      url: 'https://alquilibres.com/privacidad',
      keywords: 'privacidad, protección de datos, GDPR, datos personales'
    }
  },
  {
    path: '/contrato',
    name: 'contract',
    component: ContractTemplate,
    meta: {
      title: 'Modelo de Contrato | AlquiLibres',
      description: 'Modelo de contrato de alquiler temporario sugerido por AlquiLibres',
      url: 'https://alquilibres.com/contrato',
      keywords: 'contrato, alquiler temporario, modelo, legal'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard para proteger rutas y actualizar SEO
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Actualizar título de la página
  document.title = to.meta.title || 'AlquiLibres'
  
  // Actualizar meta tags dinámicos
  if (to.meta.description) {
    updateMetaTag('description', to.meta.description)
    updateMetaTag('og:description', to.meta.description)
    updateMetaTag('twitter:description', to.meta.description)
  }
  
  if (to.meta.url) {
    const fullUrl = to.meta.url
    updateMetaTag('og:url', fullUrl)
    updateMetaTag('twitter:url', fullUrl)
    updateCanonicalUrl(fullUrl)
  } else {
    // Generar URL desde la ruta actual
    const baseUrl = 'https://alquilibres.com'
    const fullUrl = baseUrl + to.fullPath
    updateMetaTag('og:url', fullUrl)
    updateMetaTag('twitter:url', fullUrl)
    updateCanonicalUrl(fullUrl)
  }
  
  if (to.meta.keywords) {
    updateMetaTag('keywords', to.meta.keywords)
  }
  
  if (to.meta.type) {
    updateMetaTag('og:type', to.meta.type)
  } else {
    updateMetaTag('og:type', 'website')
  }
  
  // Esperar a que se cargue el estado de autenticación
  if (!authStore.initialized) {
    await authStore.checkAuth()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isGuest = to.matched.some(record => record.meta.guest)
  
  // Check authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Check admin access
  if (requiresAdmin && authStore.user?.role !== 'admin') {
    alert('⛔ Acceso denegado. Se requieren permisos de administrador.')
    next({ name: 'home' })
    return
  }
  
  if (isGuest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

// Helper functions para actualizar meta tags
function updateMetaTag(name, content) {
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

function updateCanonicalUrl(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

export default router
