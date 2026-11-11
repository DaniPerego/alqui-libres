// api-handlers/properties/[id]/calendar.js
//
// Public iCal feed for a property's busy periods.
//   GET /api/properties/:id/calendar — no auth; only active properties.
// Emits reservations (pending/confirmed), manual blockedDates, and imported
// iCal events as a single text/calendar payload.
import { prisma } from '../../lib/prisma.js'
import { HttpError, asyncRoute } from '../../lib/http.js'
import { serializeIcal, expandDateRange } from '../../lib/ical.js'

export const config = { runtime: 'nodejs' }

function addOneDay(dateString) {
  const d = new Date(`${dateString}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
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
  if (!property || property.status !== 'active' || !property.isActive) {
    throw new HttpError('NOT_FOUND', 'Property not found', 404)
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: id,
      status: { in: ['pending', 'confirmed'] },
    },
    select: { checkIn: true, checkOut: true },
  })

  const events = []

  for (const r of reservations) {
    events.push({
      start: r.checkIn.toISOString().split('T')[0],
      end: r.checkOut.toISOString().split('T')[0],
      summary: 'Reserved',
    })
  }

  const manualBlocked = Array.isArray(property.availability?.blockedDates)
    ? property.availability.blockedDates
    : []
  for (const d of manualBlocked) {
    events.push({ start: d, end: addOneDay(d), summary: 'Blocked' })
  }

  const icalEvents = Array.isArray(property.availability?.ical?.events)
    ? property.availability.ical.events
    : []
  events.push(...icalEvents)

  const calendar = serializeIcal({
    uid: `alquilibres-${id}@alquilibres.com`,
    title: property.title,
    events,
  })

  res.status(200)
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="alquilibres-${id}.ics"`)
  return res.end(calendar)
})
