<template>
  <div class="dashboard-stats">
    <h1>Estadísticas e Ingresos</h1>

    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Ganancias Totales</span>
        <span class="kpi-value">{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Reservas</span>
        <span class="kpi-value">{{ totalReservations }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Ocupación Promedio</span>
        <span class="kpi-value">{{ avgOccupancy }}%</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Noches Reservadas</span>
        <span class="kpi-value">{{ totalNights }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stats-card income-chart">
        <h2>Ingresos Mensuales</h2>
        <div v-if="monthlyData.length" class="bar-chart">
          <div class="bar-group" v-for="item in monthlyData" :key="item.month">
            <div class="bar-label">{{ item.month }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ height: getBarHeight(item.income) + '%' }"
                :title="formatCurrency(item.income)"
              ></div>
            </div>
            <div class="bar-value">{{ formatCurrency(item.income) }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Aún no hay datos de ingresos. Las ganancias aparecerán cuando tengas reservas confirmadas.</p>
        </div>
      </div>

      <div class="stats-card occupancy-chart">
        <h2>Reservas por Mes</h2>
        <div v-if="monthlyData.length" class="bar-chart">
          <div class="bar-group" v-for="item in monthlyData" :key="item.month">
            <div class="bar-label">{{ item.month }}</div>
            <div class="bar-track">
              <div
                class="bar-fill fill-secondary"
                :style="{ height: getReservationBarHeight(item.reservations) + '%' }"
                :title="item.reservations + ' reservas'"
              ></div>
            </div>
            <div class="bar-value">{{ item.reservations }} res.</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Las reservas mensuales se mostrarán aquí cuando tengas actividad.</p>
        </div>
      </div>
    </div>

    <div class="stats-card property-breakdown">
      <h2>Ingresos por Propiedad</h2>
      <div v-if="propertyStats.length" class="property-table">
        <div class="table-header">
          <span>Propiedad</span>
          <span>Reservas</span>
          <span>Noches</span>
          <span>Ingresos</span>
        </div>
        <div class="table-row" v-for="prop in propertyStats" :key="prop.id">
          <span class="prop-name">{{ prop.title }}</span>
          <span>{{ prop.reservations }}</span>
          <span>{{ prop.nights }}</span>
          <span class="prop-income">{{ formatCurrency(prop.income) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Los ingresos por propiedad se mostrarán cuando tengas reservas confirmadas.</p>
      </div>
    </div>

    <div class="export-section">
      <button class="btn-export" @click="exportReport">
        Exportar Reporte
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOwnerStats } from '@/services/ownerStats'
import { useAuthStore } from '@/stores/auth'

const totalIncome = ref(0)
const avgOccupancy = ref(0)
const totalReservations = ref(0)
const totalNights = ref(0)
const monthlyData = ref([])
const propertyStats = ref([])

function formatCurrency(value) {
  return '$' + Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getBarHeight(income) {
  const maxIncome = Math.max(...monthlyData.value.map(d => d.income), 1)
  return Math.max((income / maxIncome) * 100, 4)
}

function getReservationBarHeight(count) {
  const maxCount = Math.max(...monthlyData.value.map(d => d.reservations), 1)
  return Math.max((count / maxCount) * 100, 4)
}

onMounted(async () => {
  const auth = useAuthStore()
  const ownerId = auth.userId
  if (!ownerId) return
  const stats = await getOwnerStats(ownerId)
  totalIncome.value = stats.totalIncome
  avgOccupancy.value = stats.avgOccupancy
  totalReservations.value = stats.totalReservations
  totalNights.value = stats.totalNights
  monthlyData.value = stats.monthlyData
  propertyStats.value = stats.propertyStats || []
})

function exportReport() {
  const csvRows = []
  csvRows.push('Mes,Ingresos,Reservas,Noches')
  monthlyData.value.forEach(d => {
    csvRows.push(`${d.month},${d.income},${d.reservations},${d.nights}`)
  })
  csvRows.push('')
  csvRows.push('Propiedad,Reservas,Noches,Ingresos')
  propertyStats.value.forEach(p => {
    csvRows.push(`${p.title},${p.reservations},${p.nights},${p.income}`)
  })
  const csv = csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `reporte-ingresos-${new Date().toISOString().slice(0, 7)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.dashboard-stats {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}
h1 {
  font-size: 1.75rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
}
h2 {
  font-size: 1.125rem;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.kpi-card {
  background: white;
  padding: 1.25rem;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
}
.kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.stats-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  height: 220px;
  padding-top: 1rem;
}
.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.bar-label {
  font-size: 0.65rem;
  color: #6b7280;
  text-align: center;
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.bar-track {
  width: 100%;
  max-width: 40px;
  height: 140px;
  background: #f3f4f6;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: height 0.6s ease;
  min-height: 4px;
}
.bar-fill.fill-secondary {
  background: linear-gradient(180deg, #10b981, #059669);
}
.bar-value {
  font-size: 0.65rem;
  color: #374151;
  font-weight: 600;
  margin-top: 0.25rem;
  white-space: nowrap;
}
.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
}
.property-breakdown {
  margin-bottom: 1.5rem;
}
.property-table {
  font-size: 0.875rem;
}
.table-header, .table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
}
.table-header {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}
.prop-name {
  font-weight: 500;
  color: #1f2937;
}
.prop-income {
  font-weight: 600;
  color: #059669;
}
.export-section {
  text-align: right;
}
.btn-export {
  padding: 0.625rem 1.25rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-export:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .dashboard-stats {
    padding: 1rem;
  }
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .bar-label, .bar-value {
    font-size: 0.55rem;
  }
}
</style>
