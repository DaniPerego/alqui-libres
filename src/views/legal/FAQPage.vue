<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>Preguntas Frecuentes (FAQ)</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>General</h2>

          <h3>¿Qué es AlquiLibres?</h3>
          <p>
            AlquiLibres es una plataforma hiper-local de alquileres temporarios que conecta propietarios
            con huéspedes sin cobrar comisiones por reserva. Funcionamos con un modelo de suscripción fija
            mensual para propietarios.
          </p>

          <h3>¿Cómo se diferencia de Airbnb o Booking?</h3>
          <p>
            A diferencia de otras plataformas, en AlquiLibres no pagás comisión por cada reserva. Los
            propietarios pagan una suscripción fija mensual y se quedan con el 100% del valor del alquiler.
            Además, nuestra plataforma está enfocada en alquileres hiper-locales, facilitando la conexión
            en comunidades específicas.
          </p>

          <h3>¿Es seguro alquilar a través de AlquiLibres?</h3>
          <p>
            AlquiLibres verifica la identidad de los propietarios y proporciona un sistema de reputación
            basado en reseñas de usuarios verificados. Siempre recomendamos comunicarte a través de nuestra
            plataforma y utilizar el modelo de contrato sugerido para formalizar cada reserva.
          </p>
        </section>

        <section>
          <h2>Para Huéspedes</h2>

          <h3>¿Cómo busco un alojamiento?</h3>
          <p>
            Podés buscar alojamiento desde la página principal o usando la sección de búsqueda.
            Filtrá por ubicación, fechas, precio y características específicas como "apto mascotas"
            o "piscina".
          </p>

          <h3>¿Necesito registrarme para reservar?</h3>
          <p>
            Sí, necesitás crear una cuenta para poder solicitar una reserva. El registro es gratuito
            y solo requiere tu email y una contraseña.
          </p>

          <h3>¿Cómo realizo una reserva?</h3>
          <p>
            Una vez que encontrás una propiedad que te guste, hacé clic en "Reservar", completá las
            fechas y enviá la solicitud. El propietario recibirá una notificación y podrá confirmar
            o rechazar tu solicitud. Una vez confirmada, el trato se realiza directamente entre
            ambas partes.
          </p>

          <h3>¿Puedo cancelar una reserva?</h3>
          <p>
            Las políticas de cancelación son establecidas por cada propietario. Te recomendamos
            acordar los términos de cancelación antes de confirmar la reserva. AlquiLibres no procesa
            pagos, por lo que cualquier reembolso debe gestionarse directamente con el propietario.
          </p>

          <h3>¿Cómo me comunico con el propietario?</h3>
          <p>
            Una vez que estés registrado, vas a poder ver los datos de contacto del propietario en la
            página de la propiedad. También podés usar el sistema de mensajería interna desde tu panel
            de usuario.
          </p>
        </section>

        <section>
          <h2>Para Propietarios</h2>

          <h3>¿Cuánto cuesta publicar una propiedad?</h3>
          <p>
            Necesitás una suscripción activa para publicar propiedades. Ofrecemos tres planes:
            <strong>Básico</strong> ($29.99/mes - hasta 3 propiedades), <strong>Pro</strong>
            ($49.99/mes - hasta 10 propiedades) y <strong>Enterprise</strong> ($99.99/mes -
            propiedades ilimitadas). Sin comisiones por reserva.
          </p>

          <h3>¿Cómo recibo los pagos de los huéspedes?</h3>
          <p>
            Los pagos se realizan directamente entre el propietario y el huésped. AlquiLibres no
            interviene en las transacciones financieras. Podés acordar con tu huésped el método de
            pago que prefieras.
          </p>

          <h3>¿Puedo cancelar mi suscripción en cualquier momento?</h3>
          <p>
            Sí, podés cancelar tu suscripción desde tu panel de control. El acceso a las funcionalidades
            continuará hasta el final del período pagado. No se realizan reembolsos por períodos parciales.
          </p>

          <h3>¿Qué pasa si no consigo inquilinos?</h3>
          <p>
            AlquiLibres te da las herramientas para destacar tu propiedad, pero el éxito depende de
            factores como precio, ubicación y calidad de las fotos. Te recomendamos mantener tu
            perfil actualizado, responder rápido a las consultas y usar fotos de buena calidad para
            aumentar tus posibilidades.
          </p>
        </section>

        <section>
          <h2>Suscripción y Pagos</h2>

          <h3>¿Qué métodos de pago aceptan?</h3>
          <p>
            Aceptamos pagos con tarjeta de crédito, débito y MercadoPago. Procesamos los pagos de
            forma segura a través de MercadoPago.
          </p>

          <h3>¿La suscripción se renueva automáticamente?</h3>
          <p>
            Sí, las suscripciones se renuevan automáticamente cada mes. Podés cancelar la renovación
            desde tu panel de control en cualquier momento.
          </p>

          <h3>¿Hay algún período de prueba gratuito?</h3>
          <p>
            Actualmente ofrecemos un período de prueba de 7 días gratis para nuevos propietarios,
            sin compromiso de suscripción.
          </p>
        </section>

        <section>
          <h2>Cuenta y Seguridad</h2>

          <h3>¿Cómo elimino mi cuenta?</h3>
          <p>
            Podés cerrar tu cuenta desde la sección "Perfil" en tu panel de control. Tené en cuenta
            que esta acción es irreversible y perderás el acceso a todas tus propiedades y datos.
          </p>

          <h3>¿Cómo protegen mis datos personales?</h3>
          <p>
            Utilizamos cifrado SSL, autenticación segura y seguimos las mejores prácticas de seguridad.
            Para más detalles, consultá nuestra <router-link to="/privacidad">Política de Privacidad</router-link>.
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
