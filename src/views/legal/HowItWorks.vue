<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>¿Cómo Funciona?</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>Para Huéspedes</h2>

          <h3>1. Buscá tu alojamiento</h3>
          <p>
            Usá nuestra herramienta de búsqueda para encontrar propiedades filtradas por ubicación,
            fechas, precio y características hiper-locales como "apto mascotas", "piscina",
            "vista al lago" y muchas más.
          </p>

          <h3>2. Registrate gratis</h3>
          <p>
            Creá una cuenta con tu email. Es rápida, fácil y totalmente gratuita. No hay
            comisiones ni cargos ocultos para huéspedes.
          </p>

          <h3>3. Solicitá una reserva</h3>
          <p>
            Una vez que encontraste la propiedad ideal, hacé clic en "Reservar", seleccioná tus
            fechas y envía tu solicitud. El propietario recibirá una notificación automática.
          </p>

          <h3>4. Esperá la confirmación</h3>
          <p>
            El propietario revisará tu solicitud y la confirmará o rechazará. Si es confirmada,
            recibirás los datos de contacto del propietario para coordinar el pago y el check-in.
          </p>

          <h3>5. Disfrutá tu estadía</h3>
          <p>
            ¡Todo listo! Coordiná directamente con el propietario los detalles de tu llegada y
            disfrutá de tu alojamiento sin comisiones adicionales.
          </p>
        </section>

        <section>
          <h2>Para Propietarios</h2>

          <h3>1. Elegí tu plan</h3>
          <p>
            Seleccioná el plan de suscripción que mejor se adapte a tus necesidades:
            <strong>Básico</strong> (3 propiedades), <strong>Pro</strong> (10 propiedades) o
            <strong>Enterprise</strong> (ilimitadas). Pagás una tarifa fija mensual, sin comisiones
            por reserva.
          </p>

          <h3>2. Publicá tu propiedad</h3>
          <p>
            Completá el formulario con los detalles de tu propiedad: fotos, descripción, precio,
            disponibilidad y características. Mientras más completo sea tu perfil, más fácil será
            encontrar huéspedes.
          </p>

          <h3>3. Recibí solicitudes</h3>
          <p>
            Cuando un huésped esté interesado, enviará una solicitud de reserva. Vas a recibir una
            notificación y podrás aceptarla o rechazarla desde tu panel de control.
          </p>

          <h3>4. Contactá al huésped</h3>
          <p>
            Una vez que confirmás una reserva, ambas partes ven sus datos de contacto. Podés
            coordinar el pago, el check-in y cualquier detalle necesario directamente.
          </p>

          <h3>5. Recibí tu pago completo</h3>
          <p>
            Como no cobramos comisiones por reserva, te quedás con el 100% del valor acordado.
            El pago se realiza directamente entre vos y el huésped.
          </p>
        </section>

        <section>
          <h2>Modelo de Suscripción</h2>
          <p>
            A diferencia de otras plataformas que cobran entre 10% y 20% por cada reserva, en
            AlquiLibres los propietarios pagan una suscripción fija mensual:
          </p>
          <ul>
            <li><strong>Plan Básico:</strong> $29.99/mes - Hasta 3 propiedades</li>
            <li><strong>Plan Pro:</strong> $49.99/mes - Hasta 10 propiedades</li>
            <li><strong>Plan Enterprise:</strong> $99.99/mes - Propiedades ilimitadas</li>
          </ul>
          <p>
            Esto significa que si alquilás tu propiedad 10 veces al mes, pagás lo mismo que si
            la alquilás una sola vez. Mientras más reservas tengas, más ahorrás.
          </p>
        </section>

        <section>
          <h2>Preguntas Comunes</h2>

          <h3>¿Qué pasa si no encuentro huéspedes?</h3>
          <p>
            AlquiLibres te da visibilidad, pero el éxito depende de factores como precio,
            ubicación, calidad de fotos y descripción. Te recomendamos mantener tu perfil
            actualizado y responder rápido a las consultas.
          </p>

          <h3>¿Cómo manejo los pagos?</h3>
          <p>
            Los pagos se realizan directamente entre propietario y huésped. Podés usar el método
            que prefieras: transferencia bancaria, efectivo, MercadoPago, etc. AlquiLibres no
            interviene en las transacciones.
          </p>

          <h3>¿Hay un contrato de por medio?</h3>
          <p>
            Sí, ofrecemos un <router-link to="/contrato">modelo de contrato</router-link>
            sugerido que podés usar para formalizar cada reserva. Es recomendable para proteger
            a ambas partes.
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
