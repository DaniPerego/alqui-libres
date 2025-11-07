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
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="mobile-menu-btn">
          <span class="mobile-menu-icon">☰</span>
        </button>
      </div>
      
      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <router-link to="/buscar" class="mobile-link" @click="mobileMenuOpen = false">Buscar</router-link>
        
        <template v-if="!authStore.isAuthenticated">
          <router-link to="/login" class="mobile-link" @click="mobileMenuOpen = false">Iniciar Sesión</router-link>
          <router-link to="/registro" class="mobile-link" @click="mobileMenuOpen = false">Publicar Propiedad</router-link>
        </template>
        
        <template v-else>
          <router-link to="/panel" class="mobile-link" @click="mobileMenuOpen = false">Mi Panel</router-link>
          <button @click="handleLogout" class="mobile-link">Cerrar Sesión</button>
        </template>
      </div>
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

.mobile-menu-btn {
  display: block;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-700);
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--gray-200);
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-link {
  color: var(--gray-700);
  text-decoration: none;
  font-weight: 500;
  padding: var(--spacing-sm) 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.mobile-link:hover {
  color: var(--primary-color);
}
</style>
