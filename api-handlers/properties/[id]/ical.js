// api-handlers/properties/[id]/ical.js
//
// iCal subscription management for a property.
//   POST   /api/properties/:id/ical/sync — owner/admin: fetch an external
//          calendar, parse it, and store availability.ical.
//   DELETE /api/properties/:id/ical       — owner/admin: remove the stored
//          subscription while preserving manual blockedDates.
import { prisma } from '../../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../../lib/http.js'
import { requireAuth, requireRole } from '../../lib/auth.js'
import { fetchIcal, parseIcal, expandIcalEventsToDays } from '../../lib/ical.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing property id', 400)
  }

  if (req.method === 'POST') {
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('owner', 'admin')(req, res)
    if (!roleOk) return

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }
    if (req.auth.role !== 'admin' && property.ownerId !== req.auth.userId) {
      throw new HttpError('FORBIDDEN', 'You can only manage your own properties', 403)
    }

    const body = await readJsonBody(req)
    if (!body.url || typeof body.url !== 'string') {
      throw new HttpError('VALIDATION', 'Missing required field: url', 400)
    }

    const text = await fetchIcal(body.url)
    const events = parseIcal(text)
    const syncedAt = new Date().toISOString()
    const ical = { url: body.url, events, syncedAt, eventCount: events.length }

    const availability = { ...(property.availability || {}), ical }
    await prisma.property.update({ where: { id }, data: { availability } })

    const blockedDays = [...new Set(expandIcalEventsToDays(events))].sort()
    return res.status(200).json({
      url: body.url,
      syncedAt,
      eventCount: events.length,
      blockedDays,
    })
  }

  if (req.method === 'DELETE') {
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('owner', 'admin')(req, res)
    if (!roleOk) return

    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }
    if (req.auth.role !== 'admin' && property.ownerId !== req.auth.userId) {
      throw new HttpError('FORBIDDEN', 'You can only manage your own properties', 403)
    }

    if (!property.availability?.ical) {
      return res.status(200).json({ removed: false })
    }

    const availability = { ...property.availability }
    delete availability.ical
    await prisma.property.update({ where: { id }, data: { availability } })
    return res.status(200).json({ removed: true })
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
