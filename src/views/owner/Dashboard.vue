<template>
  <div class="dashboard">
    <template v-if="$auth?.user?.role !== 'guest'">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link to="/panel" class="sidebar-link" exact>
            <span class="sidebar-icon">📊</span>
            Inicio
          </router-link>
          <router-link to="/panel/propiedades" class="sidebar-link">
            <span class="sidebar-icon">🏠</span>
            Mis Propiedades
          </router-link>
          <router-link to="/panel/reservas" class="sidebar-link">
            <span class="sidebar-icon">📅</span>
            Reservas
          </router-link>
          <router-link to="/panel/mensajes" class="sidebar-link">
            <span class="sidebar-icon">💬</span>
            Mensajes
          </router-link>
          <router-link to="/panel/perfil" class="sidebar-link">
            <span class="sidebar-icon">👤</span>
            Mi Perfil
          </router-link>
          <router-link to="/panel/suscripcion" class="sidebar-link">
            <span class="sidebar-icon">💳</span>
            Mi Suscripción
          </router-link>
          <router-link to="/panel/estadisticas" class="sidebar-link">
            <span class="sidebar-icon">📈</span>
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
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--gray-700);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.sidebar-link:hover {
  background-color: var(--gray-100);
  color: var(--primary-color);
}

.sidebar-link.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.sidebar-icon {
  font-size: 1.25rem;
}

.dashboard-content {
  min-width: 0;
}

@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }
}
</style>
