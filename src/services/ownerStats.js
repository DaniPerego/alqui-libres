// Servicio para obtener estadísticas del propietario
import { getOwnerReservations } from '@/services/reservations'
import { useAuthStore } from '@/stores/auth'

export async function getOwnerStats(ownerId) {
  // Obtener todas las reservas del propietario
  const reservations = await getOwnerReservations(ownerId)
  let totalIncome = 0
  let totalNights = 0
  let totalReservations = reservations.length
  let monthlyData = {}
  let occupiedDays = 0
  let totalDays = 0

  reservations.forEach(res => {
    if (res.status === 'confirmed') {
      totalIncome += res.total || 0
      totalNights += res.nights || 0
      // Agrupar por mes
      const month = res.checkIn ? new Date(res.checkIn).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Sin fecha'
      if (!monthlyData[month]) monthlyData[month] = { income: 0, reservations: 0, nights: 0 }
      monthlyData[month].income += res.total || 0
      monthlyData[month].reservations += 1
      monthlyData[month].nights += res.nights || 0
      // Ocupación
      if (res.checkIn && res.checkOut) {
        const checkIn = new Date(res.checkIn)
        const checkOut = new Date(res.checkOut)
        const days = (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        occupiedDays += days
      }
    }
    // Calcular días totales del periodo (opcional, para ocupación)
    if (res.checkIn && res.checkOut) {
      const checkIn = new Date(res.checkIn)
      const checkOut = new Date(res.checkOut)
      const days = (checkOut - checkIn) / (1000 * 60 * 60 * 24)
      totalDays += days
    }
  })

  // Ocupación promedio
  const avgOccupancy = totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0

  // Convertir monthlyData a array para gráficos
  const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }))

  return {
    totalIncome,
    avgOccupancy,
    totalReservations,
    monthlyData: monthlyArray
  }
}
