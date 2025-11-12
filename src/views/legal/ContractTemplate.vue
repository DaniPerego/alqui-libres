<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>Modelo de Contrato de Alquiler Temporario</h1>
        <p class="last-updated">Última actualización: 12 de noviembre de 2025</p>
        <div class="info-banner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <strong>Importante:</strong> Este es un modelo sugerido. Le recomendamos adaptar el contrato 
            a su situación específica y consultar con un abogado para asegurar que cumple con todas las 
            regulaciones locales aplicables.
          </div>
        </div>
      </div>

      <div class="legal-content contract-template">
        <div class="action-buttons">
          <button @click="downloadContract" class="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar PDF
          </button>
          <button @click="copyContract" class="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copiar Texto
          </button>
        </div>

        <div class="contract-document">
          <h2 class="contract-title">CONTRATO DE ALQUILER TEMPORARIO</h2>
          
          <section>
            <p class="contract-intro">
              En la ciudad de <span class="field">[CIUDAD]</span>, a los <span class="field">[DÍA]</span> 
              días del mes de <span class="field">[MES]</span> de <span class="field">[AÑO]</span>, 
              entre las partes que se detallan a continuación:
            </p>
          </section>

          <section>
            <h3>PARTE LOCADORA (Propietario)</h3>
            <p>
              <strong>Nombre y Apellido:</strong> <span class="field">[NOMBRE COMPLETO PROPIETARIO]</span><br>
              <strong>DNI/CUIL:</strong> <span class="field">[DOCUMENTO]</span><br>
              <strong>Domicilio:</strong> <span class="field">[DOMICILIO PROPIETARIO]</span><br>
              <strong>Teléfono:</strong> <span class="field">[TELÉFONO]</span><br>
              <strong>Email:</strong> <span class="field">[EMAIL]</span>
            </p>
            <p>En adelante denominada "EL LOCADOR"</p>
          </section>

          <section>
            <h3>PARTE LOCATARIA (Inquilino)</h3>
            <p>
              <strong>Nombre y Apellido:</strong> <span class="field">[NOMBRE COMPLETO INQUILINO]</span><br>
              <strong>DNI/CUIL:</strong> <span class="field">[DOCUMENTO]</span><br>
              <strong>Domicilio:</strong> <span class="field">[DOMICILIO INQUILINO]</span><br>
              <strong>Teléfono:</strong> <span class="field">[TELÉFONO]</span><br>
              <strong>Email:</strong> <span class="field">[EMAIL]</span>
            </p>
            <p>En adelante denominada "EL LOCATARIO"</p>
          </section>

          <section>
            <h3>PRIMERA: OBJETO DEL CONTRATO</h3>
            <p>
              EL LOCADOR da en locación temporaria al LOCATARIO el inmueble ubicado en:
            </p>
            <p>
              <strong>Dirección:</strong> <span class="field">[DIRECCIÓN COMPLETA DE LA PROPIEDAD]</span><br>
              <strong>Tipo de propiedad:</strong> <span class="field">[Casa/Departamento/Cabaña/etc.]</span><br>
              <strong>Características:</strong> <span class="field">[Cantidad de habitaciones, baños, capacidad, etc.]</span>
            </p>
            <p>
              El inmueble se destina exclusivamente para uso de vivienda temporal con fines turísticos/recreativos.
            </p>
          </section>

          <section>
            <h3>SEGUNDA: PLAZO</h3>
            <p>
              El plazo de locación será desde el día <span class="field">[FECHA CHECK-IN]</span> 
              a las <span class="field">[HORA]</span> hasta el día <span class="field">[FECHA CHECK-OUT]</span> 
              a las <span class="field">[HORA]</span>, totalizando <span class="field">[CANTIDAD]</span> noches.
            </p>
            <p>
              El LOCATARIO se compromete a desocupar el inmueble en la fecha y hora establecida, 
              dejándolo en las mismas condiciones en que lo recibió.
            </p>
          </section>

          <section>
            <h3>TERCERA: PRECIO Y FORMA DE PAGO</h3>
            <p>
              El precio total del alquiler asciende a la suma de <span class="field">$[MONTO]</span> 
              (<span class="field">[MONTO EN LETRAS]</span>), que incluye:
            </p>
            <ul>
              <li>Alquiler por <span class="field">[X]</span> noches: <span class="field">$[SUBTOTAL]</span></li>
              <li>Limpieza final: <span class="field">$[LIMPIEZA]</span></li>
              <li>Otros conceptos: <span class="field">[DETALLAR SI APLICA]</span></li>
            </ul>
            <p>
              <strong>Seña:</strong> Se ha abonado en concepto de seña la suma de <span class="field">$[SEÑA]</span> 
              en fecha <span class="field">[FECHA SEÑA]</span>.
            </p>
            <p>
              <strong>Saldo:</strong> El saldo de <span class="field">$[SALDO]</span> deberá abonarse 
              <span class="field">[al check-in/antes del check-in/según acordado]</span>.
            </p>
            <p>
              <strong>Forma de pago:</strong> <span class="field">[Efectivo/Transferencia bancaria/MercadoPago/etc.]</span>
            </p>
          </section>

          <section>
            <h3>CUARTA: DEPÓSITO EN GARANTÍA</h3>
            <p>
              El LOCATARIO entrega en este acto la suma de <span class="field">$[DEPÓSITO]</span> 
              en concepto de depósito en garantía, que será devuelto al finalizar el contrato, 
              previa verificación del buen estado del inmueble y sus contenidos.
            </p>
            <p>
              El depósito podrá retenerse total o parcialmente en caso de:
            </p>
            <ul>
              <li>Daños al inmueble o muebles</li>
              <li>Faltantes de elementos inventariados</li>
              <li>Gastos extraordinarios de limpieza</li>
              <li>Incumplimiento de normas establecidas</li>
            </ul>
          </section>

          <section>
            <h3>QUINTA: SERVICIOS INCLUIDOS</h3>
            <p>El alquiler incluye los siguientes servicios:</p>
            <ul>
              <li><span class="field">[WiFi]</span></li>
              <li><span class="field">[Agua corriente]</span></li>
              <li><span class="field">[Electricidad]</span></li>
              <li><span class="field">[Gas]</span></li>
              <li><span class="field">[Ropa de cama y toallas]</span></li>
              <li><span class="field">[Otros servicios incluidos]</span></li>
            </ul>
            <p>
              <strong>Servicios NO incluidos:</strong> <span class="field">[Detallar qué no está incluido]</span>
            </p>
          </section>

          <section>
            <h3>SEXTA: USO DEL INMUEBLE</h3>
            <p>
              <strong>Capacidad máxima:</strong> <span class="field">[NÚMERO]</span> personas.
            </p>
            <p>El LOCATARIO se compromete a:</p>
            <ul>
              <li>Utilizar el inmueble exclusivamente para el fin acordado</li>
              <li>No subarrendar ni ceder el uso a terceros</li>
              <li>No superar la capacidad máxima permitida</li>
              <li>Mantener el orden y limpieza durante su estadía</li>
              <li>No realizar modificaciones o alteraciones al inmueble</li>
              <li>Respetar las normas de convivencia y reglamentos del edificio/barrio</li>
              <li>Hacer uso racional de los servicios y cuidar los bienes muebles</li>
            </ul>
          </section>

          <section>
            <h3>SÉPTIMA: PROHIBICIONES ESPECIALES</h3>
            <ul>
              <li><strong>Mascotas:</strong> <span class="field">[Permitidas/No permitidas - Condiciones]</span></li>
              <li><strong>Fumar:</strong> <span class="field">[Permitido/Prohibido - Dónde]</span></li>
              <li><strong>Fiestas/Eventos:</strong> <span class="field">[Permitidos/Prohibidos - Condiciones]</span></li>
              <li><strong>Ruidos molestos:</strong> Prohibidos entre las 23:00 y 08:00 hrs</li>
              <li><strong>Visitas:</strong> <span class="field">[Política sobre visitantes]</span></li>
            </ul>
          </section>

          <section>
            <h3>OCTAVA: ENTREGA Y DEVOLUCIÓN</h3>
            <p>
              Al momento del check-in se realizará un inventario del estado del inmueble y sus contenidos, 
              que será firmado por ambas partes. Al check-out se verificará que todo se encuentre en las 
              mismas condiciones.
            </p>
            <p>
              <strong>Check-in:</strong> <span class="field">[FECHA Y HORA]</span> en <span class="field">[LUGAR/MODALIDAD]</span><br>
              <strong>Check-out:</strong> <span class="field">[FECHA Y HORA]</span>
            </p>
            <p>
              <strong>Llaves:</strong> Se entregan <span class="field">[CANTIDAD]</span> juegos de llaves 
              que deberán devolverse completos. La pérdida tendrá un cargo de <span class="field">$[MONTO]</span>.
            </p>
          </section>

          <section>
            <h3>NOVENA: RESPONSABILIDADES DEL LOCADOR</h3>
            <p>EL LOCADOR se compromete a:</p>
            <ul>
              <li>Entregar el inmueble en perfectas condiciones de habitabilidad y limpieza</li>
              <li>Garantizar el funcionamiento de todos los servicios e instalaciones</li>
              <li>Proporcionar asistencia en caso de emergencias o desperfectos</li>
              <li>Respetar la privacidad del LOCATARIO durante su estadía</li>
              <li>Mantener la disponibilidad de contacto durante todo el período</li>
            </ul>
            <p>
              <strong>Contacto de emergencia:</strong> <span class="field">[TELÉFONO 24HS]</span>
            </p>
          </section>

          <section>
            <h3>DÉCIMA: RESPONSABILIDADES DEL LOCATARIO</h3>
            <p>EL LOCATARIO será responsable por:</p>
            <ul>
              <li>Daños causados al inmueble, muebles o instalaciones por uso indebido</li>
              <li>Pérdida o daño de elementos inventariados</li>
              <li>Reparación de roturas o desperfectos causados por su acción u omisión</li>
              <li>Multas o sanciones derivadas del incumplimiento de reglamentos</li>
            </ul>
            <p>
              El LOCATARIO deberá notificar inmediatamente cualquier daño o desperfecto que ocurra 
              durante su estadía.
            </p>
          </section>

          <section>
            <h3>DÉCIMA PRIMERA: CANCELACIÓN</h3>
            <p>
              <strong>Por parte del LOCATARIO:</strong>
            </p>
            <ul>
              <li>Con más de <span class="field">[X]</span> días de anticipación: Reembolso del <span class="field">[%]</span></li>
              <li>Con menos de <span class="field">[X]</span> días: Reembolso del <span class="field">[%]</span></li>
              <li>Sin aviso: Sin reembolso</li>
            </ul>
            <p>
              <strong>Por parte del LOCADOR:</strong> En caso de cancelación por parte del LOCADOR, 
              este deberá devolver el 100% del dinero abonado más una compensación del 
              <span class="field">[%]</span> del valor total.
            </p>
          </section>

          <section>
            <h3>DÉCIMA SEGUNDA: FUERZA MAYOR</h3>
            <p>
              Ninguna de las partes será responsable por incumplimientos derivados de casos fortuitos 
              o de fuerza mayor (catástrofes naturales, pandemias, restricciones gubernamentales, etc.). 
              En estos casos se evaluará la devolución proporcional o reprogramación según corresponda.
            </p>
          </section>

          <section>
            <h3>DÉCIMA TERCERA: PRIVACIDAD Y DATOS</h3>
            <p>
              Ambas partes se comprometen a mantener la confidencialidad de los datos personales 
              intercambiados, utilizándolos exclusivamente para la ejecución de este contrato, 
              en cumplimiento de la Ley 25.326 de Protección de Datos Personales.
            </p>
          </section>

          <section>
            <h3>DÉCIMA CUARTA: JURISDICCIÓN</h3>
            <p>
              Para cualquier controversia que surja de la interpretación o cumplimiento del presente 
              contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de 
              <span class="field">[JURISDICCIÓN]</span>, con renuncia expresa a cualquier otro fuero 
              que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h3>DÉCIMA QUINTA: ACEPTACIÓN</h3>
            <p>
              Leído el presente contrato y aceptados todos sus términos, las partes firman de conformidad 
              en <span class="field">[CANTIDAD]</span> ejemplares de un mismo tenor y a un solo efecto.
            </p>
          </section>

          <div class="signatures">
            <div class="signature-block">
              <div class="signature-line"></div>
              <p><strong>Firma del LOCADOR</strong></p>
              <p>Aclaración: <span class="field">[NOMBRE]</span></p>
              <p>DNI: <span class="field">[NÚMERO]</span></p>
            </div>

            <div class="signature-block">
              <div class="signature-line"></div>
              <p><strong>Firma del LOCATARIO</strong></p>
              <p>Aclaración: <span class="field">[NOMBRE]</span></p>
              <p>DNI: <span class="field">[NÚMERO]</span></p>
            </div>
          </div>
        </div>
      </div>

      <div class="legal-footer">
        <router-link to="/" class="btn-secondary">Volver al Inicio</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  window.scrollTo(0, 0)
})

const downloadContract = () => {
  alert('Función de descarga en desarrollo. Próximamente podrás descargar el contrato en formato PDF.')
}

const copyContract = () => {
  const contractText = document.querySelector('.contract-document').innerText
  navigator.clipboard.writeText(contractText).then(() => {
    alert('✓ Contrato copiado al portapapeles')
  }).catch(() => {
    alert('✗ Error al copiar. Por favor, selecciona y copia manualmente.')
  })
}
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 4rem;
}

.container {
  max-width: 900px;
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
  margin-bottom: 1rem;
}

.info-banner {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  margin-top: 1rem;
}

.info-banner svg {
  width: 24px;
  height: 24px;
  color: #f59e0b;
  flex-shrink: 0;
}

.info-banner strong {
  color: #92400e;
}

.legal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.action-buttons button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-buttons button svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  text-decoration: none;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.contract-document {
  border: 1px solid #e5e7eb;
  padding: 3rem 2rem;
  background: #fefefe;
  line-height: 1.8;
}

.contract-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  text-decoration: underline;
}

.contract-intro {
  text-align: justify;
  margin-bottom: 2rem;
}

.contract-document section {
  margin-bottom: 2rem;
}

.contract-document h3 {
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.contract-document p {
  color: #374151;
  margin-bottom: 1rem;
  text-align: justify;
}

.contract-document ul {
  margin-left: 2rem;
  margin-bottom: 1rem;
}

.contract-document li {
  color: #374151;
  margin-bottom: 0.5rem;
}

.field {
  display: inline-block;
  min-width: 100px;
  padding: 0.125rem 0.5rem;
  background-color: #fef3c7;
  border-bottom: 1px solid #fbbf24;
  font-style: italic;
  color: #92400e;
}

.signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-top: 4rem;
}

.signature-block {
  text-align: center;
}

.signature-line {
  height: 80px;
  border-bottom: 2px solid #1f2937;
  margin-bottom: 1rem;
}

.signature-block p {
  margin-bottom: 0.5rem;
  text-align: center;
}

.legal-footer {
  margin-top: 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .legal-header,
  .legal-content {
    padding: 1.5rem;
  }

  .contract-document {
    padding: 2rem 1rem;
  }

  .legal-header h1 {
    font-size: 1.5rem;
  }

  .signatures {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }
}

@media print {
  .legal-header,
  .action-buttons,
  .legal-footer {
    display: none;
  }

  .legal-page {
    background: white;
  }

  .contract-document {
    border: none;
    box-shadow: none;
  }
}
</style>
