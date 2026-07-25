<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>Política de Cookies</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>1. ¿Qué son las Cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador
            para recordar tus preferencias, mejorar tu experiencia de navegación y ayudarnos a
            entender cómo usas nuestra plataforma.
          </p>
        </section>

        <section>
          <h2>2. Tipos de Cookies que Utilizamos</h2>

          <h3>2.1 Cookies Esenciales</h3>
          <p>
            Necesarias para el funcionamiento básico de la plataforma. Permiten la autenticación,
            la navegación segura y el acceso a áreas protegidas. Sin estas cookies, la plataforma
            no puede funcionar correctamente.
          </p>

          <h3>2.2 Cookies de Preferencias</h3>
          <p>
            Permiten recordar tus preferencias, como el idioma seleccionado, la región y tus
            configuraciones de búsqueda para ofrecerte una experiencia personalizada.
          </p>

          <h3>2.3 Cookies de Rendimiento</h3>
          <p>
            Nos ayudan a entender cómo los usuarios interactúan con la plataforma, qué secciones
            son más populares y cómo podemos mejorar. Utilizamos esta información para optimizar
            el rendimiento y la usabilidad.
          </p>

          <h3>2.4 Cookies de Funcionalidad</h3>
          <p>
            Permiten recordar las elecciones que hacés (como nombre de usuario, búsquedas recientes)
            para brindarte una experiencia mejorada y más personal.
          </p>
        </section>

        <section>
          <h2>3. Cookies de Terceros</h2>
          <p>
            Podemos utilizar servicios de terceros que también pueden establecer cookies en tu
            navegador:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> Para analizar el tráfico y uso de la plataforma</li>
            <li><strong>MercadoPago:</strong> Para procesar pagos de suscripciones</li>
            <li><strong>Redes sociales:</strong> Para compartir contenido y medir alcance</li>
          </ul>
          <p>
            Estos terceros tienen sus propias políticas de cookies y privacidad. Te recomendamos
            revisarlas para entender cómo manejan tus datos.
          </p>
        </section>

        <section>
          <h2>4. Duración de las Cookies</h2>
          <ul>
            <li><strong>Cookies de sesión:</strong> Se eliminan automáticamente cuando cerrás el navegador</li>
            <li><strong>Cookies persistentes:</strong> Permanecen en tu dispositivo hasta que las eliminás o hasta que expiran (generalmente entre 1 y 12 meses)</li>
          </ul>
        </section>

        <section>
          <h2>5. Cómo Controlar las Cookies</h2>
          <p>
            Podés gestionar las cookies desde la configuración de tu navegador. La mayoría de los
            navegadores te permiten:
          </p>
          <ul>
            <li>Ver qué cookies tiene almacenadas un sitio web</li>
            <li>Eliminar cookies individuales o todas las cookies</li>
            <li>Bloquear cookies de sitios específicos o de todos los sitios</li>
            <li>Configurar notificaciones antes de aceptar cookies</li>
          </ul>
          <p>
            Tené en cuenta que si bloqueás las cookies esenciales, algunas funcionalidades de la
            plataforma pueden no estar disponibles.
          </p>
        </section>

        <section>
          <h2>6. Enlaces a Configuración de Navegadores</h2>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
            <li><a href="https://help.opera.com/en/latest/web-preferences/#cookies" target="_blank" rel="noopener">Opera</a></li>
          </ul>
        </section>

        <section>
          <h2>7. Cambios en la Política de Cookies</h2>
          <p>
            Podemos actualizar esta política de cookies periódicamente. Te notificaremos sobre
            cambios significativos a través de la plataforma o por email. Te recomendamos revisar
            esta página regularmente.
          </p>
        </section>

        <section>
          <h2>8. Contacto</h2>
          <p>
            Si tenés preguntas sobre nuestra política de cookies, contactanos a:
            <a href="mailto:legal@alquilibres.com">legal@alquilibres.com</a>
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
.legal-content h3 {
  color: #374151;
  font-size: 1.125rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
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
