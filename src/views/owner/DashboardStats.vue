<template>
  <div class="dashboard-stats">
    <h1>Estadísticas e Ingresos</h1>
    <section>
      <h2>Resumen General</h2>
      <div class="stats-grid">
        <div>
          <strong>Ganancias Totales:</strong>
          <span>{{ totalIncome | currency }}</span>
        </div>
        <div>
          <strong>Ocupación Promedio:</strong>
          <span>{{ avgOccupancy }}%</span>
        </div>
        <div>
          <strong>Reservas Totales:</strong>
          <span>{{ totalReservations }}</span>
        </div>
      </div>
    </section>
    <section>
      <h2>Gráficos de Ocupación</h2>
      <!-- Aquí irá el gráfico de ocupación mensual -->
      <div v-if="monthlyData.length">
        <!-- Componente de gráfico (ej: Chart.js) -->
      </div>
      <div v-else>
        <em>No hay datos suficientes para mostrar el gráfico.</em>
      </div>
    </section>
    <section>
      <h2>Comparativas y Exportación</h2>
      <button @click="exportReport">Exportar PDF/Excel</button>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOwnerStats } from '@/services/ownerStats';
import { useAuthStore } from '@/stores/auth';

const totalIncome = ref(0);
const avgOccupancy = ref(0);
const totalReservations = ref(0);
const monthlyData = ref([]);

onMounted(async () => {
  const auth = useAuthStore();
  const ownerId = auth.userId;
  if (!ownerId) return;
  const stats = await getOwnerStats(ownerId);
  totalIncome.value = stats.totalIncome;
  avgOccupancy.value = stats.avgOccupancy;
  totalReservations.value = stats.totalReservations;
  monthlyData.value = stats.monthlyData;
});

function exportReport() {
  alert('Funcionalidad de exportación próximamente');
}
</script>

<style scoped>
.dashboard-stats {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.stats-grid {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}
.stats-grid > div {
  background: #f5f5f5;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
section {
  margin-bottom: 2rem;
}
</style>
