// api/properties/[id]/availability.js
//
// GET — returns blocked dates and booked ranges for a property.
//   Blocked dates come from two sources:
//     1. Dates covered by reservations with status pending or confirmed
//     2. Manual blocked dates stored in property.availability.blockedDates
import { prisma } from '../../lib/prisma.js'
import { HttpError, asyncRoute } from '../../lib/http.js'

export const config = { runtime: 'nodejs' }

function dateRangeStrings(start, end) {
  const dates = []
  const current = new Date(start)
  const last = new Date(end)
  while (current < last) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'GET') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing property id', 400)
  }

  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) {
    throw new HttpError('NOT_FOUND', 'Property not found', 404)
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: id,
      status: { in: ['pending', 'confirmed'] },
    },
    select: {
      checkIn: true,
      checkOut: true,
      status: true,
    },
  })

  const bookedRanges = reservations.map((r) => ({
    checkIn: r.checkIn.toISOString().split('T')[0],
    checkOut: r.checkOut.toISOString().split('T')[0],
    status: r.status,
  }))

  const blockedFromReservations = []
  for (const r of reservations) {
    blockedFromReservations.push(...dateRangeStrings(r.checkIn, r.checkOut))
  }

  const manualBlocked = Array.isArray(property.availability?.blockedDates)
    ? property.availability.blockedDates
    : []

  const blockedDates = [...new Set([...blockedFromReservations, ...manualBlocked])].sort()

  return res.status(200).json({ blockedDates, bookedRanges })
})
