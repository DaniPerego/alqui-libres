import { getOwnerReservations } from '@/services/reservations'

export async function getOwnerStats(ownerId) {
  const reservations = await getOwnerReservations(ownerId)
  let totalIncome = 0
  let totalNights = 0
  let totalReservations = reservations.length
  let monthlyData = {}
  let occupiedDays = 0
  let totalDays = 0
  let propertyStats = {}

  reservations.forEach(res => {
    if (res.status === 'confirmed') {
      totalIncome += res.total || 0
      totalNights += res.nights || 0

      const month = res.checkIn
        ? new Date(res.checkIn).toLocaleString('default', { month: 'short', year: 'numeric' })
        : 'Sin fecha'
      if (!monthlyData[month]) monthlyData[month] = { income: 0, reservations: 0, nights: 0 }
      monthlyData[month].income += res.total || 0
      monthlyData[month].reservations += 1
      monthlyData[month].nights += res.nights || 0

      const propId = res.propertyId || 'unknown'
      if (!propertyStats[propId]) propertyStats[propId] = { id: propId, title: res.property?.title || 'Propiedad', income: 0, reservations: 0, nights: 0 }
      propertyStats[propId].income += res.total || 0
      propertyStats[propId].reservations += 1
      propertyStats[propId].nights += res.nights || 0
    }

    if (res.checkIn && res.checkOut) {
      const checkIn = new Date(res.checkIn)
      const checkOut = new Date(res.checkOut)
      const days = (checkOut - checkIn) / (1000 * 60 * 60 * 24)
      totalDays += days
      if (res.status === 'confirmed') {
        occupiedDays += days
      }
    }
  })

  const avgOccupancy = totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0

  const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }))
  const propertyArray = Object.values(propertyStats)

  return {
    totalIncome,
    avgOccupancy,
    totalReservations,
    totalNights,
    monthlyData: monthlyArray,
    propertyStats: propertyArray
  }
}
