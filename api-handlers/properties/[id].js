// api/properties/[id].js
//
// API-01/02 — property detail and owner/admin management.
//   GET    public: active properties; owner/admin may view any status
//          (inactive rows are 404 for everyone else).
//   PATCH  owner: editable listing fields (+ publish/unpublish via isActive);
//          admin: additionally status / reviewedAt / reviewedBy / rejectionReason.
//   DELETE owner/admin: 409 when the property has reservations, otherwise
//          cascades reviews and messages before deleting.
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth, requireRole, getAuthUser } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const PROPERTY_TYPES = ['casa', 'departamento', 'cabana', 'habitacion', 'otro']
const RENTAL_TYPES = ['temporario', 'anual']
const STATUSES = ['pending', 'active', 'inactive', 'rejected']

// Fields an owner may edit directly; status/moderation fields are admin-only.
const OWNER_EDITABLE = new Set([
  'title', 'description', 'propertyType', 'rentalType', 'mainImage', 'images',
  'locationCity', 'locationState', 'locationCountry', 'locationPostalCode', 'locationCoordinates',
  'capacityGuests', 'capacityBedrooms', 'capacityBeds', 'capacityBathrooms',
  'localFeatures', 'amenities', 'pricingBasePrice', 'pricingCleaningFee', 'pricingCurrency',
  'pricingWeeklyDiscount', 'pricingMonthlyDiscount', 'availability', 'houseRules',
  'isActive', 'featured',
])
const ADMIN_STATUS_FIELDS = new Set(['status', 'reviewedAt', 'reviewedBy', 'rejectionReason'])
const ADMIN_EDITABLE = new Set([...OWNER_EDITABLE, ...ADMIN_STATUS_FIELDS])

function validateEdits(data) {
  if (data.propertyType !== undefined && !PROPERTY_TYPES.includes(data.propertyType)) {
    throw new HttpError('VALIDATION', `Invalid propertyType: ${data.propertyType}`, 400)
  }
  if (data.rentalType !== undefined && !RENTAL_TYPES.includes(data.rentalType)) {
    throw new HttpError('VALIDATION', `Invalid rentalType: ${data.rentalType}`, 400)
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    throw new HttpError('VALIDATION', `Invalid status: ${data.status}`, 400)
  }
  for (const key of ['capacityGuests', 'capacityBedrooms', 'capacityBeds', 'capacityBathrooms']) {
    if (data[key] !== undefined) {
      const value = Number.parseInt(data[key], 10)
      if (!Number.isInteger(value) || value < 1) {
        throw new HttpError('VALIDATION', `${key} must be a positive integer`, 400)
      }
      data[key] = value
    }
  }
  for (const key of ['pricingBasePrice', 'pricingCleaningFee']) {
    if (data[key] !== undefined) {
      const value = Number(data[key])
      if (!Number.isFinite(value) || value < 0) {
        throw new HttpError('VALIDATION', `${key} must be a non-negative number`, 400)
      }
      data[key] = value
    }
  }
}

export default asyncRoute(async (req, res) => {
  const { id } = req.query
  if (!id) {
    throw new HttpError('VALIDATION', 'Missing property id', 400)
  }

  if (req.method === 'GET') {
    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) throw new HttpError('NOT_FOUND', 'Property not found', 404)
    if (property.isActive) return res.status(200).json(property)
    // Inactive: only the owner or an admin may view it; everyone else gets
    // 404 so inactive listings are not discoverable.
    let userId = null
    let role = null
    try {
      const auth = await getAuthUser(req)
      const dbUser = await prisma.user.findUnique({ where: { id: auth.userId } })
      if (dbUser?.isActive) {
        userId = auth.userId
        role = dbUser.role
      }
    } catch {
      // anonymous — falls through to 404
    }
    if (role !== 'admin' && userId !== property.ownerId) {
      throw new HttpError('NOT_FOUND', 'Property not found', 404)
    }
    return res.status(200).json(property)
  }

  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('owner', 'admin')(req, res)
  if (!roleOk) return

  if (req.method === 'PATCH') {
    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) throw new HttpError('NOT_FOUND', 'Property not found', 404)
    if (req.auth.role !== 'admin' && property.ownerId !== req.auth.userId) {
      // API-02 owner isolation: property of user A, user B updates it -> 403
      throw new HttpError('FORBIDDEN', 'You can only edit your own properties', 403)
    }
    const body = await readJsonBody(req)
    const isAdmin = req.auth.role === 'admin'
    const data = {}
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue
      if (isAdmin) {
        if (!ADMIN_EDITABLE.has(key)) {
          throw new HttpError('VALIDATION', `Field not editable: ${key}`, 400)
        }
        data[key] = value
      } else {
        if (ADMIN_STATUS_FIELDS.has(key)) {
          throw new HttpError('FORBIDDEN', 'Owner cannot change moderation fields', 403)
        }
        if (!OWNER_EDITABLE.has(key)) {
          throw new HttpError('VALIDATION', `Field not editable: ${key}`, 400)
        }
        data[key] = value
      }
    }
    validateEdits(data)
    // Moderation side effects: an admin status change toggles visibility and
    // records the reviewer (reviewedAt/reviewedBy).
    if (data.status !== undefined) {
      data.isActive = data.status === 'active'
      if (data.reviewedAt === undefined) data.reviewedAt = new Date()
      if (data.reviewedBy === undefined) data.reviewedBy = req.auth.userId
    }
    const updated = await prisma.property.update({ where: { id }, data })
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    const property = await prisma.property.findUnique({ where: { id } })
    if (!property) throw new HttpError('NOT_FOUND', 'Property not found', 404)
    if (req.auth.role !== 'admin' && property.ownerId !== req.auth.userId) {
      throw new HttpError('FORBIDDEN', 'You can only delete your own properties', 403)
    }
    const reservations = await prisma.reservation.count({ where: { propertyId: id } })
    if (reservations > 0) {
      throw new HttpError('CONFLICT', 'Property has reservations and cannot be deleted', 409)
    }
    await prisma.review.deleteMany({ where: { propertyId: id } })
    await prisma.message.deleteMany({ where: { propertyId: id } })
    await prisma.property.delete({ where: { id } })
    return res.status(200).json({ deleted: true, id })
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
