<template>
  <div class="dashboard">
    <template v-if="authStore.user?.role !== 'guest'">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link to="/panel" class="sidebar-link" exact>
            <span class="sidebar-icon"><LayoutDashboard :size="20" /></span>
            Inicio
          </router-link>
          <router-link to="/panel/propiedades" class="sidebar-link">
            <span class="sidebar-icon"><Home :size="20" /></span>
            Mis Propiedades
          </router-link>
          <router-link to="/panel/reservas" class="sidebar-link">
            <span class="sidebar-icon"><Calendar :size="20" /></span>
            Reservas
          </router-link>
          <router-link to="/panel/mensajes" class="sidebar-link">
            <span class="sidebar-icon"><MessageSquare :size="20" /></span>
            Mensajes
          </router-link>
          <router-link to="/panel/perfil" class="sidebar-link">
            <span class="sidebar-icon"><User :size="20" /></span>
            Mi Perfil
          </router-link>
          <router-link to="/panel/suscripcion" class="sidebar-link">
            <span class="sidebar-icon"><CreditCard :size="20" /></span>
            Mi Suscripción
          </router-link>
          <router-link to="/panel/resenas" class="sidebar-link">
            <span class="sidebar-icon"><Star :size="20" /></span>
            Reseñas
          </router-link>
          <router-link to="/panel/estadisticas" class="sidebar-link">
            <span class="sidebar-icon"><BarChart3 :size="20" /></span>
            Estadísticas
          </router-link>
        </nav>
      </aside>
      <main class="dashboard-content">
        <router-view />
      </main>
    </template>
    <template v-else>
      <main class="dashboard-content">
        <router-view />
      </main>
    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { LayoutDashboard, Home, Calendar, MessageSquare, User, CreditCard, Star, BarChart3 } from '@lucide/vue'

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: calc(100vh - 140px);
  gap: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.sidebar {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  height: fit-content;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 90px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--gray-700);
  font-weight: 500;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  background-color: var(--gray-100);
  color: var(--primary-color);
}

.sidebar-link.router-link-active {
  background-color: var(--primary-color);
  color: white;
  border-left-color: var(--secondary-color);
}

.sidebar-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  flex-shrink: 0;
}

.sidebar-link.router-link-active .sidebar-icon {
  background: rgba(255, 255, 255, 0.2);
}

.dashboard-content {
  min-width: 0;
}

@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
    padding: var(--spacing-md);
  }
  
  .sidebar {
    position: static;
    margin-bottom: var(--spacing-lg);
  }
  
  .sidebar-nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);
  }
  
  .sidebar-link {
    padding: var(--spacing-sm);
    font-size: 0.875rem;
    justify-content: center;
    text-align: center;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .sidebar-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
