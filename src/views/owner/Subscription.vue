<template>
  <div class="subscription-page">
    <div class="page-header">
      <h1 class="page-title">Mi Suscripción</h1>
    </div>
    
    <!-- Estado Actual de la Suscripción -->
    <div class="subscription-status card">
      <div class="status-header">
        <div>
          <h2 class="status-title">Plan {{ currentPlan }}</h2>
          <p class="status-subtitle">Estado: <span class="status-badge active">Activo</span></p>
        </div>
        <div class="status-price">
          <span class="price-amount">${{ planPrice }}</span>
          <span class="price-period">/mes</span>
        </div>
      </div>
      
      <div class="status-details">
        <div class="detail-item">
          <span class="detail-label">Fecha de inicio:</span>
          <span class="detail-value">1 de Noviembre, 2025</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Próxima renovación:</span>
          <span class="detail-value">1 de Diciembre, 2025</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Método de pago:</span>
          <span class="detail-value">Tarjeta •••• 4242</span>
        </div>
      </div>
      
      <div class="status-actions">
        <button class="btn btn-secondary">Cambiar Método de Pago</button>
        <button class="btn btn-danger">Cancelar Suscripción</button>
      </div>
    </div>
    
    <!-- Beneficios del Plan Actual -->
    <div class="plan-benefits card">
      <h3 class="section-title">Beneficios de tu Plan</h3>
      <ul class="benefits-list">
        <li class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Publicaciones ilimitadas de propiedades</span>
        </li>
        <li class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>0% de comisión en todas las reservas</span>
        </li>
        <li class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Sincronización de calendario (iCal)</span>
        </li>
        <li class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Sistema de mensajería con huéspedes</span>
        </li>
        <li class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Soporte prioritario</span>
        </li>
      </ul>
    </div>
    
    <!-- Comparación con Plataformas Tradicionales -->
    <div class="comparison card">
      <h3 class="section-title">💰 Ahorro vs Plataformas Tradicionales</h3>
      <p class="comparison-description">
        Comparativa de costos basada en 10 reservas de $100/noche (promedio)
      </p>
      
      <div class="comparison-grid">
        <div class="comparison-card competitor">
          <h4>Airbnb / Booking</h4>
          <div class="comparison-stats">
            <div class="stat">
              <span class="stat-label">Comisión promedio:</span>
              <span class="stat-value danger">15-25%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Costo en 10 reservas:</span>
              <span class="stat-value danger">$150 - $250</span>
            </div>
          </div>
        </div>
        
        <div class="comparison-card us">
          <h4>AlquiLibres</h4>
          <div class="comparison-stats">
            <div class="stat">
              <span class="stat-label">Suscripción mensual:</span>
              <span class="stat-value success">${{ planPrice }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Costo en 10 reservas:</span>
              <span class="stat-value success">${{ planPrice }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="savings-highlight">
        <span class="savings-icon">💵</span>
        <span class="savings-text">
          Ahorras entre ${{ 150 - planPrice }} y ${{ 250 - planPrice }} con solo 10 reservas al mes
        </span>
      </div>
    </div>

    <!-- Calculadora de Ahorro Interactiva -->
    <div class="calculator card">
      <h3 class="section-title">🧮 Calculadora de Ahorro</h3>
      <p class="calculator-description">
        Descubre cuánto puedes ahorrar con AlquiLibres vs plataformas tradicionales
      </p>

      <div class="calculator-inputs">
        <div class="input-group">
          <label for="monthly-bookings" class="label">Reservas mensuales</label>
          <input 
            id="monthly-bookings"
            v-model.number="calculator.monthlyBookings" 
            type="number" 
            min="1"
            max="100"
            class="input"
            @input="calculateSavings"
          />
        </div>

        <div class="input-group">
          <label for="avg-price" class="label">Precio promedio por noche ($)</label>
          <input 
            id="avg-price"
            v-model.number="calculator.avgPrice" 
            type="number" 
            min="10"
            step="10"
            class="input"
            @input="calculateSavings"
          />
        </div>
      </div>

      <div class="calculator-results">
        <div class="result-row">
          <div class="result-platform airbnb">
            <div class="platform-header">
              <h4>Airbnb</h4>
              <span class="commission-badge">15% comisión</span>
            </div>
            <div class="platform-cost">
              <span class="cost-label">Costo mensual:</span>
              <span class="cost-value danger">${{ calculatedCosts.airbnb }}</span>
            </div>
          </div>

          <div class="result-platform booking">
            <div class="platform-header">
              <h4>Booking.com</h4>
              <span class="commission-badge">18% comisión</span>
            </div>
            <div class="platform-cost">
              <span class="cost-label">Costo mensual:</span>
              <span class="cost-value danger">${{ calculatedCosts.booking }}</span>
            </div>
          </div>

          <div class="result-platform alquilubres">
            <div class="platform-header">
              <h4>AlquiLibres</h4>
              <span class="subscription-badge">Suscripción fija</span>
            </div>
            <div class="platform-cost">
              <span class="cost-label">Costo mensual:</span>
              <span class="cost-value success">${{ planPrice }}</span>
            </div>
          </div>
        </div>

        <div class="annual-savings">
          <div class="savings-card">
            <span class="savings-label">Ahorro anual vs Airbnb:</span>
            <span class="savings-amount success">${{ calculatedSavings.vsAirbnb }}</span>
          </div>
          <div class="savings-card">
            <span class="savings-label">Ahorro anual vs Booking:</span>
            <span class="savings-amount success">${{ calculatedSavings.vsBooking }}</span>
          </div>
        </div>

        <div class="calculator-summary">
          <p class="summary-text">
            Con <strong>{{ calculator.monthlyBookings }} reservas</strong> de 
            <strong>${{ calculator.avgPrice }}</strong> por noche, ahorras hasta 
            <strong class="highlight">${{ calculatedSavings.vsBooking }}</strong> al año
          </p>
        </div>
      </div>
    </div>
    
    <!-- Planes Disponibles -->
    <div class="available-plans">
      <h3 class="section-title">Otros Planes Disponibles</h3>
      
      <div class="plans-grid">
        <div class="plan-card card">
          <h4 class="plan-name">Básico</h4>
          <div class="plan-price">
            <span class="price-amount">$29</span>
            <span class="price-period">/mes</span>
          </div>
          <ul class="plan-features">
            <li>Hasta 3 propiedades</li>
            <li>0% comisión</li>
            <li>Soporte por email</li>
          </ul>
          <button class="btn btn-secondary">Cambiar a este Plan</button>
        </div>
        
        <div class="plan-card card featured">
          <div class="plan-badge">Más Popular</div>
          <h4 class="plan-name">Premium</h4>
          <div class="plan-price">
            <span class="price-amount">$49</span>
            <span class="price-period">/mes</span>
          </div>
          <ul class="plan-features">
            <li>Propiedades ilimitadas</li>
            <li>0% comisión</li>
            <li>Soporte prioritario</li>
            <li>Calendario sincronizado</li>
          </ul>
          <button class="btn btn-primary">Plan Actual</button>
        </div>
        
        <div class="plan-card card">
          <h4 class="plan-name">Enterprise</h4>
          <div class="plan-price">
            <span class="price-amount">$99</span>
            <span class="price-period">/mes</span>
          </div>
          <ul class="plan-features">
            <li>Todo de Premium +</li>
            <li>Cuenta manager dedicado</li>
            <li>Herramientas avanzadas</li>
            <li>API access</li>
          </ul>
          <button class="btn btn-secondary">Cambiar a este Plan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const currentPlan = ref('Premium')
const planPrice = ref(49)

// Calculadora de ahorro
const calculator = reactive({
  monthlyBookings: 10,
  avgPrice: 100
})

const calculatedCosts = computed(() => {
  const revenue = calculator.monthlyBookings * calculator.avgPrice
  return {
    airbnb: Math.round(revenue * 0.15),
    booking: Math.round(revenue * 0.18)
  }
})

const calculatedSavings = computed(() => {
  const annualAirbnb = (calculatedCosts.value.airbnb - planPrice.value) * 12
  const annualBooking = (calculatedCosts.value.booking - planPrice.value) * 12
  return {
    vsAirbnb: Math.max(0, annualAirbnb),
    vsBooking: Math.max(0, annualBooking)
  }
})

const calculateSavings = () => {
  // La reactividad se encarga automáticamente
  console.log('💰 Calculando ahorros...', {
    reservas: calculator.monthlyBookings,
    precio: calculator.avgPrice,
    costoAirbnb: calculatedCosts.value.airbnb,
    costoBooking: calculatedCosts.value.booking,
    ahorroAnualAirbnb: calculatedSavings.value.vsAirbnb,
    ahorroAnualBooking: calculatedSavings.value.vsBooking
  })
}
</script>

<style scoped>
.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.subscription-status {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.status-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-900);
}

.status-subtitle {
  color: var(--gray-600);
}

.status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.active {
  background-color: var(--secondary-color);
  color: white;
}

.status-price {
  text-align: right;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.price-period {
  font-size: 1rem;
  color: var(--gray-600);
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-label {
  color: var(--gray-600);
}

.detail-value {
  font-weight: 600;
  color: var(--gray-900);
}

.status-actions {
  display: flex;
  gap: var(--spacing-md);
}

.plan-benefits {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--gray-900);
}

.benefits-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 1rem;
}

.benefit-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--secondary-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.comparison {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
}

.comparison-description {
  color: var(--gray-600);
  margin-bottom: var(--spacing-lg);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.comparison-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: white;
}

.comparison-card h4 {
  font-size: 1.125rem;
  margin-bottom: var(--spacing-md);
}

.comparison-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-value.danger {
  color: var(--danger-color);
}

.stat-value.success {
  color: var(--secondary-color);
}

.savings-highlight {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: #d1fae5;
  border-radius: var(--radius-md);
  border: 2px solid var(--secondary-color);
}

.savings-icon {
  font-size: 2rem;
}

.savings-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.available-plans {
  margin-top: var(--spacing-2xl);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

.plan-card {
  padding: var(--spacing-xl);
  position: relative;
  transition: transform var(--transition-base);
}

.plan-card:hover {
  transform: translateY(-5px);
}

.plan-card.featured {
  border: 2px solid var(--primary-color);
}

.plan-badge {
  position: absolute;
  top: -12px;
  right: var(--spacing-lg);
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.plan-price {
  margin-bottom: var(--spacing-lg);
}

.plan-features {
  list-style: none;
  margin-bottom: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.plan-features li {
  padding-left: var(--spacing-lg);
  position: relative;
}

.plan-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--secondary-color);
  font-weight: 700;
}

/* Calculadora de Ahorro */
.calculator {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
  border: 2px solid var(--primary-color);
}

.calculator-description {
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.calculator-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
}

.calculator-inputs .input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.calculator-inputs .label {
  font-weight: 600;
  color: var(--gray-700);
}

.calculator-inputs .input {
  font-size: 1.125rem;
  padding: var(--spacing-md);
  border: 2px solid var(--gray-300);
  transition: border-color 0.2s;
}

.calculator-inputs .input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.calculator-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.result-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.result-platform {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: white;
  border: 2px solid var(--gray-200);
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-platform:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-platform.alquilubres {
  border-color: var(--secondary-color);
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--gray-200);
}

.platform-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.commission-badge {
  background: #fee;
  color: var(--danger-color);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.subscription-badge {
  background: #e6f7ee;
  color: var(--secondary-color);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.platform-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-label {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.cost-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.cost-value.danger {
  color: var(--danger-color);
}

.cost-value.success {
  color: var(--secondary-color);
}

.annual-savings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
}

.savings-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #e6f7ee 0%, #f0fdf4 100%);
  border: 1px solid var(--secondary-color);
}

.savings-label {
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
}

.savings-amount {
  font-size: 2rem;
  font-weight: 700;
}

.savings-amount.success {
  color: var(--secondary-color);
}

.calculator-summary {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%);
  border-radius: var(--radius-lg);
  text-align: center;
}

.summary-text {
  color: white;
  font-size: 1.125rem;
  line-height: 1.6;
}

.summary-text strong {
  font-weight: 700;
}

.summary-text .highlight {
  font-size: 1.5rem;
  color: #fbbf24;
}

@media (max-width: 768px) {
  .status-header {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .status-actions {
    flex-direction: column;
  }
  
  .status-actions .btn {
    width: 100%;
  }

  .calculator-inputs {
    grid-template-columns: 1fr;
  }

  .result-row {
    grid-template-columns: 1fr;
  }

  .annual-savings {
    grid-template-columns: 1fr;
  }

  .cost-value {
    font-size: 1.5rem;
  }

  .savings-amount {
    font-size: 1.5rem;
  }

  .summary-text {
    font-size: 1rem;
  }

  .summary-text .highlight {
    font-size: 1.25rem;
  }
}
</style>
