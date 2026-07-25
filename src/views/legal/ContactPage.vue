<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>Contacto</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>Estamos para ayudarte</h2>
          <p>
            Si tenés consultas, sugerencias o necesitás asistencia, no dudes en contactarnos.
            Respondemos a la brevedad.
          </p>
        </section>

        <section>
          <h2>Información de Contacto</h2>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:hola@alquilibres.com">hola@alquilibres.com</a></li>
            <li><strong>Soporte:</strong> <a href="mailto:soporte@alquilibres.com">soporte@alquilibres.com</a></li>
            <li><strong>Legal:</strong> <a href="mailto:legal@alquilibres.com">legal@alquilibres.com</a></li>
            <li><strong>Ubicación:</strong> Córdoba, Argentina</li>
          </ul>
        </section>

        <section>
          <h2>Horarios de Atención</h2>
          <ul>
            <li><strong>Lunes a viernes:</strong> 9:00 a 18:00 (GMT-3)</li>
            <li><strong>Sábados:</strong> 10:00 a 14:00 (GMT-3)</li>
            <li><strong>Domingos:</strong> Cerrado</li>
          </ul>
        </section>

        <section>
          <h2>Canales Disponibles</h2>
          <ul>
            <li><strong>Email:</strong> Respondemos en menos de 24 horas hábiles</li>
            <li><strong>WhatsApp:</strong> Disponible próximamente</li>
            <li><strong>Redes sociales:</strong> Encontranos en Facebook, Instagram y LinkedIn</li>
          </ul>
        </section>

        <section>
          <h2>¿Tenés un problema técnico?</h2>
          <p>
            Si encontraste un error en la plataforma o tenés problemas para usar alguna
            funcionalidad, escribinos a <a href="mailto:soporte@alquilibres.com">soporte@alquilibres.com</a>
            con una descripción detallada del problema y lo resolveremos a la brevedad.
          </p>
        </section>
      </div>

      <div class="legal-footer">
        <router-link to="/" class="btn-secondary">Volver al Inicio</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
onMounted(() => { window.scrollTo(0, 0) })
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 4rem;
}
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}
.legal-header {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}
.legal-header h1 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.last-updated {
  color: #6b7280;
  font-size: 0.875rem;
}
.legal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  line-height: 1.7;
}
.legal-content section {
  margin-bottom: 2rem;
}
.legal-content section:last-child {
  margin-bottom: 0;
}
.legal-content h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.legal-content p {
  color: #4b5563;
  margin-bottom: 1rem;
}
.legal-content ul {
  color: #4b5563;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}
.legal-content li {
  margin-bottom: 0.5rem;
}
.legal-content strong {
  color: #1f2937;
  font-weight: 600;
}
.legal-content a {
  color: #2563eb;
  text-decoration: underline;
}
.legal-content a:hover {
  color: #1d4ed8;
}
.legal-footer {
  margin-top: 2rem;
  text-align: center;
}
.btn-secondary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #6b7280;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.btn-secondary:hover {
  background-color: #4b5563;
}
@media (max-width: 768px) {
  .legal-header,
  .legal-content {
    padding: 1.5rem;
  }
  .legal-header h1 {
    font-size: 1.5rem;
  }
  .legal-content h2 {
    font-size: 1.25rem;
  }
}
</style>
