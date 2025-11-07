<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">AlquiLibres</h3>
          <p class="footer-text">
            Plataforma hiper-local de alquileres temporarios sin comisiones por reserva.
            Suscripción fija para propietarios.
          </p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">Para Propietarios</h4>
          <ul class="footer-links">
            <li><router-link to="/registro">Publicar Propiedad</router-link></li>
            <li><router-link to="/panel">Panel de Control</router-link></li>
            <li><a href="#planes">Planes y Precios</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">Para Huéspedes</h4>
          <ul class="footer-links">
            <li><router-link to="/buscar">Buscar Alojamiento</router-link></li>
            <li><a href="#como-funciona">¿Cómo Funciona?</a></li>
            <li><a href="#confianza">Sistema de Confianza</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">Soporte</h4>
          <ul class="footer-links">
            <li><a href="#ayuda">Centro de Ayuda</a></li>
            <li><a href="#contacto">Contacto</a></li>
            <li><a href="#terminos">Términos y Condiciones</a></li>
            <li><a href="#privacidad">Política de Privacidad</a></li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2025 AlquiLibres. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--gray-900);
  color: var(--gray-300);
  padding: var(--spacing-2xl) 0 var(--spacing-lg);
  margin-top: var(--spacing-2xl);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.footer-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.footer-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.footer-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--gray-400);
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-links a {
  color: var(--gray-400);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  border-top: 1px solid var(--gray-800);
  padding-top: var(--spacing-lg);
  text-align: center;
  font-size: 0.875rem;
  color: var(--gray-500);
}
</style>
