<template>
  <header class="header">
    <nav class="container">
      <div class="nav-wrapper">
        <router-link to="/" class="logo">
          <span class="logo-icon">🏠</span>
          <span class="logo-text">AlquiLibres</span>
        </router-link>
        
        <div class="nav-links">
          <router-link to="/buscar" class="nav-link">Buscar</router-link>
          
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="nav-link">Iniciar Sesión</router-link>
            <router-link to="/registro" class="btn btn-primary btn-sm">Publicar Propiedad</router-link>
          </template>
          
          <template v-else>
            <router-link to="/panel" class="nav-link">Mi Panel</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">Cerrar Sesión</button>
          </template>
        </div>
        
        <!-- Mobile menu button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="mobile-menu-btn" :class="{ active: mobileMenuOpen }">
          <span class="hamburger"></span>
        </button>
      </div>
      
      <!-- Mobile menu overlay -->
      <transition name="fade">
        <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>
      </transition>
      
      <!-- Mobile menu -->
      <transition name="slide">
        <div v-if="mobileMenuOpen" class="mobile-menu">
          <div class="mobile-header">
            <div class="mobile-logo">
              <span class="logo-icon">🏠</span>
              <span>AlquiLibres</span>
            </div>
            <button @click="mobileMenuOpen = false" class="close-btn">✕</button>
          </div>
          
          <nav class="mobile-nav">
            <router-link to="/buscar" class="mobile-link" @click="mobileMenuOpen = false">
              <span class="link-icon">🔍</span>
              <span>Buscar Propiedades</span>
            </router-link>
            
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/login" class="mobile-link" @click="mobileMenuOpen = false">
                <span class="link-icon">👤</span>
                <span>Iniciar Sesión</span>
              </router-link>
              <router-link to="/registro" class="mobile-link highlight" @click="mobileMenuOpen = false">
                <span class="link-icon">✨</span>
                <span>Publicar Propiedad</span>
              </router-link>
            </template>
            
            <template v-else>
              <div class="user-section">
                <div class="user-info">
                  <div class="user-avatar">{{ authStore.user?.email?.charAt(0).toUpperCase() }}</div>
                  <span class="user-email">{{ authStore.user?.email }}</span>
                </div>
              </div>
              
              <router-link to="/panel" class="mobile-link" @click="mobileMenuOpen = false">
                <span class="link-icon">📊</span>
                <span>Mi Panel</span>
              </router-link>
              <router-link to="/panel/propiedades" class="mobile-link" @click="mobileMenuOpen = false">
                <span class="link-icon">🏘️</span>
                <span>Mis Propiedades</span>
              </router-link>
              <router-link to="/panel/mensajes" class="mobile-link" @click="mobileMenuOpen = false">
                <span class="link-icon">💬</span>
                <span>Mensajes</span>
              </router-link>
              <router-link to="/panel/suscripcion" class="mobile-link" @click="mobileMenuOpen = false">
                <span class="link-icon">💳</span>
                <span>Suscripción</span>
              </router-link>
              
              <div class="divider"></div>
              
              <button @click="handleLogout" class="mobile-link logout">
                <span class="link-icon">🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </template>
          </nav>
        </div>
      </transition>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  z-index: 1000;
  height: 70px;
}

.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
  transition: transform var(--transition-fast);
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  display: none;
}

@media (min-width: 640px) {
  .logo-text {
    display: inline;
  }
}

.nav-links {
  display: none;
  align-items: center;
  gap: var(--spacing-lg);
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

.nav-link {
  color: var(--gray-700);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  position: relative;
  z-index: 1001;
}

.hamburger {
  width: 24px;
  height: 2px;
  background: var(--gray-700);
  border-radius: 2px;
  position: relative;
  transition: all 0.3s ease;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: var(--gray-700);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

.mobile-menu-btn.active .hamburger {
  background: transparent;
}

.mobile-menu-btn.active .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

.mobile-menu-btn.active .hamburger::after {
  transform: rotate(-45deg);
  top: 0;
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Menu */
.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 320px;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow-y: auto;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.mobile-nav {
  padding: var(--spacing-md) 0;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--gray-800);
  text-decoration: none;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.mobile-link:hover {
  background: var(--gray-50);
  border-left-color: var(--primary-color);
}

.mobile-link.router-link-active {
  background: #fef3f2;
  border-left-color: var(--primary-color);
  color: var(--primary-color);
}

.mobile-link.highlight {
  background: linear-gradient(135deg, #fef3f2 0%, #fff4ed 100%);
  color: var(--primary-color);
  font-weight: 600;
}

.mobile-link.logout {
  color: #dc2626;
}

.mobile-link.logout:hover {
  background: #fee;
  border-left-color: #dc2626;
}

.link-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
}

.user-section {
  padding: var(--spacing-md) 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  margin: 0 var(--spacing-lg);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
}

.user-email {
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  height: 1px;
  background: var(--gray-200);
  margin: var(--spacing-md) var(--spacing-lg);
}
</style>
