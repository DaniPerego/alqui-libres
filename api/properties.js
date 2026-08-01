// api/properties.js
//
// API-01/02/03/04 — Property collection endpoint.
//   GET  public list (active only) with q (ILIKE title+city), city,
//        propertyType, rentalType, guests and offset pagination; admin uses
//        ?scope=all for the moderation list (any status).
//   POST owner/admin creates a property; ownerId is forced from the JWT
//        subject (AUTH-02); status is pending when moderateProperties is
//        enabled, otherwise active (design D2 / platform settings).
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth, requireRole } from './lib/auth.js'
import { searchProperties, countSearchProperties } from './lib/search.js'

export const config = { runtime: 'nodejs' }

const PROPERTY_TYPES = ['casa', 'departamento', 'cabana', 'habitacion', 'otro']
const RENTAL_TYPES = ['temporario', 'anual']
const STATUSES = ['pending', 'active', 'inactive', 'rejected']

function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new HttpError('VALIDATION', `Invalid ${label}: ${value}`, 400)
  }
  return value
}

// Prisma where for the structured (non-q) list path. Public lists force
// active-only and ignore the status param; moderation lists (admin) allow it.
function buildWhere(query, { activeOnly = false } = {}) {
  const where = {}
  if (activeOnly) where.isActive = true
  else if (query.status) where.status = enumValue(query.status, STATUSES, 'status')
  if (query.city) where.locationCity = query.city
  if (query.propertyType) where.propertyType = enumValue(query.propertyType, PROPERTY_TYPES, 'propertyType')
  if (query.rentalType) where.rentalType = enumValue(query.rentalType, RENTAL_TYPES, 'rentalType')
  if (query.guests) {
    const guests = Number.parseInt(query.guests, 10)
    if (!Number.isInteger(guests) || guests < 1) {
      throw new HttpError('VALIDATION', 'guests must be a positive integer', 400)
    }
    where.capacityGuests = { gte: guests }
  }
  return where
}

// Structured filters forwarded to the raw ILIKE search when q is present.
function rawFilters(query) {
  const filters = {}
  if (query.city) filters.city = query.city
  if (query.propertyType) filters.propertyType = enumValue(query.propertyType, PROPERTY_TYPES, 'propertyType')
  if (query.rentalType) filters.rentalType = enumValue(query.rentalType, RENTAL_TYPES, 'rentalType')
  if (query.guests) {
    const guests = Number.parseInt(query.guests, 10)
    if (!Number.isInteger(guests) || guests < 1) {
      throw new HttpError('VALIDATION', 'guests must be a positive integer', 400)
    }
    filters.minGuests = guests
  }
  return filters
}

// Validates and normalizes a property create payload.
function parsePropertyBody(body) {
  const required = ['title', 'description', 'propertyType', 'locationCity', 'locationState',
    'capacityGuests', 'capacityBedrooms', 'capacityBeds', 'capacityBathrooms', 'pricingBasePrice']
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      throw new HttpError('VALIDATION', `Missing required field: ${key}`, 400)
    }
  }
  const data = {}
  data.title = String(body.title).trim()
  data.description = String(body.description).trim()
  data.propertyType = enumValue(body.propertyType, PROPERTY_TYPES, 'propertyType')
  data.rentalType = enumValue(body.rentalType ?? 'temporario', RENTAL_TYPES, 'rentalType')
  data.locationCity = String(body.locationCity).trim()
  data.locationState = String(body.locationState).trim()
  data.locationCountry = body.locationCountry || 'Argentina'
  if (body.locationPostalCode !== undefined) data.locationPostalCode = String(body.locationPostalCode)
  if (body.locationCoordinates !== undefined) data.locationCoordinates = body.locationCoordinates
  for (const key of ['capacityGuests', 'capacityBedrooms', 'capacityBeds', 'capacityBathrooms']) {
    const value = Number.parseInt(body[key], 10)
    if (!Number.isInteger(value) || value < 1) {
      throw new HttpError('VALIDATION', `${key} must be a positive integer`, 400)
    }
    data[key] = value
  }
  const basePrice = Number(body.pricingBasePrice)
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new HttpError('VALIDATION', 'pricingBasePrice must be a non-negative number', 400)
  }
  data.pricingBasePrice = basePrice
  if (body.pricingCleaningFee !== undefined) {
    const fee = Number(body.pricingCleaningFee)
    if (!Number.isFinite(fee) || fee < 0) {
      throw new HttpError('VALIDATION', 'pricingCleaningFee must be a non-negative number', 400)
    }
    data.pricingCleaningFee = fee
  }
  if (body.pricingCurrency) data.pricingCurrency = String(body.pricingCurrency)
  if (body.pricingWeeklyDiscount !== undefined) data.pricingWeeklyDiscount = Number(body.pricingWeeklyDiscount)
  if (body.pricingMonthlyDiscount !== undefined) data.pricingMonthlyDiscount = Number(body.pricingMonthlyDiscount)
  if (body.mainImage !== undefined) data.mainImage = body.mainImage
  if (Array.isArray(body.images)) data.images = body.images.map(String)
  if (body.localFeatures !== undefined) data.localFeatures = body.localFeatures
  if (Array.isArray(body.amenities)) data.amenities = body.amenities.map(String)
  if (body.availability !== undefined) data.availability = body.availability
  if (body.houseRules !== undefined) data.houseRules = body.houseRules
  return data
}

export default asyncRoute(async (req, res) => {
  if (req.method === 'GET') {
    const { page, limit } = parsePagination(req.query)

    // Admin moderation list: all properties, optional status filter.
    if (req.query.scope === 'all') {
      const authed = await requireAuth(req, res)
      if (!authed) return
      const roleOk = requireRole('admin')(req, res)
      if (!roleOk) return
      const where = buildWhere(req.query, { activeOnly: false })
      const total = await prisma.property.count({ where })
      const rows = await prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
      return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
    }

    // Public listing — active only (AUTH-04 free guest browsing).
    const where = buildWhere(req.query, { activeOnly: true })
    if (req.query.q) {
      const filters = rawFilters(req.query)
      const [rows, countRows] = await Promise.all([
        searchProperties(prisma, { q: req.query.q, limit, offset: (page - 1) * limit, isActive: true, filters }),
        countSearchProperties(prisma, { q: req.query.q, isActive: true, filters }),
      ])
      const total = countRows?.[0]?.count ?? rows.length
      return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
    }
    const total = await prisma.property.count({ where })
    const rows = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
  }

  if (req.method === 'POST') {
    // POST — create property. OwnerId forced from token subject (AUTH-02).
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('owner', 'admin')(req, res)
    if (!roleOk) return
    const body = await readJsonBody(req)
    const data = parsePropertyBody(body)
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'general' } })
    const moderate = settings?.moderateProperties ?? false
    if (moderate) {
      data.status = 'pending'
      data.isActive = false
    } else {
      data.status = 'active'
      data.isActive = true
    }
    const property = await prisma.property.create({
      data: {
        ...data,
        ownerId: req.auth.userId,
        ownerName: req.auth.user.displayName,
        ownerEmail: req.auth.user.email,
      },
    })
    return res.status(201).json(property)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
