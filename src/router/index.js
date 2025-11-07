import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'AlquiLibres - Alquileres Sin Comisiones' }
  },
  {
    path: '/buscar',
    name: 'search',
    component: Search,
    meta: { title: 'Buscar Alojamiento' }
  },
  {
    path: '/propiedad/:id',
    name: 'property-detail',
    component: PropertyDetail,
    meta: { title: 'Detalle de Propiedad' }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Iniciar Sesión', guest: true }
  },
  {
    path: '/registro',
    name: 'register',
    component: Register,
    meta: { title: 'Registrarse', guest: true }
  },
  {
    path: '/panel',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: 'Panel de Control', requiresAuth: true },
    redirect: { name: 'my-properties' },
    children: [
      {
        path: 'propiedades',
        name: 'my-properties',
        component: MyProperties,
        meta: { title: 'Mis Propiedades', requiresAuth: true }
      },
      {
        path: 'propiedades/nueva',
        name: 'new-property',
        component: PropertyEditor,
        meta: { title: 'Nueva Propiedad', requiresAuth: true }
      },
      {
        path: 'propiedades/:id/editar',
        name: 'edit-property',
        component: PropertyEditor,
        meta: { title: 'Editar Propiedad', requiresAuth: true }
      },
      {
        path: 'mensajes',
        name: 'messages',
        component: Messages,
        meta: { title: 'Mensajes', requiresAuth: true }
      },
      {
        path: 'suscripcion',
        name: 'subscription',
        component: Subscription,
        meta: { title: 'Mi Suscripción', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard para proteger rutas
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Actualizar título de la página
  document.title = to.meta.title || 'AlquiLibres'
  
  // Esperar a que se cargue el estado de autenticación
  if (!authStore.initialized) {
    await authStore.checkAuth()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuest = to.matched.some(record => record.meta.guest)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (isGuest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
