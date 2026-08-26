<template>
  <header class="header">
    <nav class="container">
      <div class="nav-wrapper">
        <router-link to="/" class="logo">
          <span class="pdl-logo pdl-logo-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
              <rect x="4" y="4" width="11" height="11" rx="2" fill="#2563eb" opacity="0.08"/>
              <rect x="17" y="4" width="11" height="11" rx="2" fill="#2563eb" opacity="0.06"/>
              <rect x="4" y="17" width="11" height="11" rx="2" fill="#2563eb" opacity="0.04"/>
              <rect x="17" y="17" width="11" height="11" rx="2" fill="#2563eb" opacity="0.02"/>
              <path d="M16 5L5 14h3v11h6v-7h4v7h6V14h3L16 5z" fill="#2563eb" stroke="#2563eb" stroke-width="0.5" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="logo-text">AlquiLibres</span>
        </router-link>
        
        <div class="nav-links">
          <router-link to="/buscar" class="nav-link">{{ t('nav.search') }}</router-link>
          
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="nav-link">{{ t('nav.login') }}</router-link>
            <router-link to="/registro" class="btn btn-primary btn-sm">{{ t('nav.publish') }}</router-link>
          </template>
          
          <template v-else>
            <router-link v-if="authStore.user?.role === 'admin'" to="/admin" class="nav-link admin-link">
              <Crown :size="18" /> {{ t('nav.admin') }}
            </router-link>
            <router-link v-if="authStore.user?.role === 'guest'" to="/panel/perfil" class="nav-link">{{ t('nav.myProfile') }}</router-link>
            <router-link v-else-if="authStore.user?.role !== 'admin'" to="/panel" class="nav-link">{{ t('nav.myPanel') }}</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">{{ t('nav.logout') }}</button>
          </template>

          <div class="lang-selector">
            <button @click="switchLang('es')" :class="{ active: locale === 'es' }">ES</button>
            <button @click="switchLang('en')" :class="{ active: locale === 'en' }">EN</button>
            <button @click="switchLang('pt')" :class="{ active: locale === 'pt' }">PT</button>
          </div>
        </div>
        
        <!-- Mobile menu button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="mobile-menu-btn" :class="{ active: mobileMenuOpen }">
          <Menu v-if="!mobileMenuOpen" :size="24" />
          <X v-else :size="24" />
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
              <span class="pdl-logo pdl-logo-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                  <rect x="4" y="4" width="11" height="11" rx="2" fill="rgba(255,255,255,0.3)"/>
                  <rect x="17" y="4" width="11" height="11" rx="2" fill="rgba(255,255,255,0.2)"/>
                  <rect x="4" y="17" width="11" height="11" rx="2" fill="rgba(255,255,255,0.1)"/>
                  <rect x="17" y="17" width="11" height="11" rx="2" fill="rgba(255,255,255,0.05)"/>
                  <path d="M16 5L5 14h3v11h6v-7h4v7h6V14h3L16 5z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>AlquiLibres</span>
            </div>
            <button @click="mobileMenuOpen = false" class="close-btn">
              <X :size="20" />
            </button>
          </div>
          
          <nav class="mobile-nav">
            <router-link to="/buscar" class="mobile-link" @click="mobileMenuOpen = false">
              <Search :size="18" />
              <span>{{ t('nav.search') }}</span>
            </router-link>
            
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/login" class="mobile-link" @click="mobileMenuOpen = false">
                <User :size="18" />
                <span>{{ t('nav.login') }}</span>
              </router-link>
              <router-link to="/registro" class="mobile-link highlight" @click="mobileMenuOpen = false">
                <Sparkles :size="18" />
                <span>{{ t('nav.publish') }}</span>
              </router-link>
            </template>
            
            <template v-else>
              <div class="user-section">
                <div class="user-info">
                  <div class="user-avatar">{{ authStore.user?.email?.charAt(0).toUpperCase() }}</div>
                  <div class="user-details">
                    <span class="user-email">{{ authStore.user?.email }}</span>
                    <span v-if="authStore.user?.role === 'admin'" class="user-role">{{ t('nav.admin') }}</span>
                  </div>
                </div>
              </div>
              
              <router-link v-if="authStore.user?.role === 'admin'" to="/admin" class="mobile-link admin-link-mobile" @click="mobileMenuOpen = false">
                <Crown :size="18" />
                <span>{{ t('nav.admin') }}</span>
              </router-link>
              
              <router-link v-if="authStore.user?.role === 'guest'" to="/panel/perfil" class="mobile-link" @click="mobileMenuOpen = false">
                <User :size="18" />
                <span>{{ t('nav.myProfile') }}</span>
              </router-link>
              <router-link v-else-if="authStore.user?.role !== 'admin'" to="/panel" class="mobile-link" @click="mobileMenuOpen = false">
                <LayoutDashboard :size="18" />
                <span>{{ t('nav.myPanel') }}</span>
              </router-link>
              <router-link v-if="authStore.user?.role === 'owner'" to="/panel/propiedades" class="mobile-link" @click="mobileMenuOpen = false">
                <Building :size="18" />
                <span>{{ t('nav.myProperties') }}</span>
              </router-link>
              <router-link v-if="authStore.user?.role === 'owner'" to="/panel/mensajes" class="mobile-link" @click="mobileMenuOpen = false">
                <MessageSquare :size="18" />
                <span>{{ t('nav.messages') }}</span>
              </router-link>
              <router-link v-if="authStore.user?.role === 'owner'" to="/panel/suscripcion" class="mobile-link" @click="mobileMenuOpen = false">
                <CreditCard :size="18" />
                <span>{{ t('nav.subscription') }}</span>
              </router-link>
              
              <div class="divider"></div>

              <div class="mobile-lang-selector">
                <button @click="switchLang('es')" :class="{ active: locale === 'es' }">ES</button>
                <button @click="switchLang('en')" :class="{ active: locale === 'en' }">EN</button>
                <button @click="switchLang('pt')" :class="{ active: locale === 'pt' }">PT</button>
              </div>
              
              <button @click="handleLogout" class="mobile-link logout">
                <LogOut :size="18" />
                <span>{{ t('nav.logout') }}</span>
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
import { useI18n } from 'vue-i18n'
import { Search, User, Crown, LayoutDashboard, LogOut, Menu, X, Plus, MessageSquare, CreditCard, Building, Sparkles } from '@lucide/vue'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const switchLang = (lang) => {
  locale.value = lang
  localStorage.setItem('alquilibres-locale', lang)
}

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

.admin-link {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 700;
}

.admin-link:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white !important;
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
  color: var(--gray-700);
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

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-email {
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.625rem;
  color: #f59e0b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-link-mobile {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e !important;
  font-weight: 700;
  border-left: 3px solid #f59e0b !important;
}

.admin-link-mobile:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
}

.divider {
  height: 1px;
  background: var(--gray-200);
  margin: var(--spacing-md) var(--spacing-lg);
}

.lang-selector {
  display: none;
  align-items: center;
  gap: 2px;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 2px;
}

@media (min-width: 768px) {
  .lang-selector {
    display: flex;
  }
}

.lang-selector button {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;
}

.lang-selector button.active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mobile-lang-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-lg);
}

.mobile-lang-selector button {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-lang-selector button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
</style>
