<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>Sobre Nosotros</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>Nuestra Historia</h2>
          <p>
            AlquiLibres nació en Córdoba, Argentina, con una idea simple: las plataformas de alquiler
            temporario cobran comisiones demasiado altas que terminan encareciendo el servicio tanto
            para propietarios como para huéspedes.
          </p>
          <p>
            Fundada en 2025, nuestra misión es democratizar el mercado de alquileres temporarios,
            ofreciendo una plataforma justa donde los propietarios paguen una tarifa fija mensual
            en lugar de un porcentaje por cada reserva.
          </p>
        </section>

        <section>
          <h2>Nuestra Misión</h2>
          <p>
            Empoderar a propietarios e inquilinos facilitando conexiones directas, transparentes
            y sin intermediarios costosos. Creemos en el valor de la comunidad y en el poder de
            las relaciones directas entre personas.
          </p>
        </section>

        <section>
          <h2>Nuestra Visión</h2>
          <p>
            Ser la plataforma líder de alquileres temporarios en Argentina y Latinoamérica,
            reconocida por nuestro modelo ético de negocio, nuestra innovación en búsquedas
            hiper-locales y nuestro compromiso con la comunidad.
          </p>
        </section>

        <section>
          <h2>Nuestros Valores</h2>
          <ul>
            <li><strong>Transparencia:</strong> Sin comisiones ocultas ni cargos sorpresa</li>
            <li><strong>Comunidad:</strong> Fomentamos conexiones genuinas entre personas</li>
            <li><strong>Innovación:</strong> Buscamos constantemente mejorar la experiencia</li>
            <li><strong>Equidad:</strong> Un modelo de negocio justo para todos</li>
            <li><strong>Confianza:</strong> Construimos un entorno seguro para cada transacción</li>
          </ul>
        </section>

        <section>
          <h2>¿Por qué AlquiLibres?</h2>
          <p>
            Porque creemos que alquilar no debería ser caro ni complicado. Nuestra plataforma
            ofrece:
          </p>
          <ul>
            <li><strong>Sin comisiones:</strong> Los propietarios pagan solo una suscripción fija</li>
            <li><strong>Búsqueda hiper-local:</strong> Encontrá exactamente lo que necesitás</li>
            <li><strong>Contacto directo:</strong> Comunicación sin intermediarios</li>
            <li><strong>Modelo de contrato:</strong> Te ayudamos a formalizar cada reserva</li>
          </ul>
        </section>

        <section>
          <h2>Equipo</h2>
          <p>
            Somos un equipo apasionado por la tecnología y el turismo, comprometidos con revolucionar
            la forma en que las personas alquilan propiedades temporarias. Creemos en el poder de las
            comunidades locales y trabajamos cada día para mejorar nuestra plataforma.
          </p>
        </section>

        <section>
          <h2>Contacto</h2>
          <p>
            ¿Tenés preguntas o sugerencias? Nos encantaría saber de vos:
          </p>
          <ul>
            <li><strong>Email:</strong> hola@alquilibres.com</li>
            <li><strong>Ubicación:</strong> Córdoba, Argentina</li>
          </ul>
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
