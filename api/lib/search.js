// api/lib/search.js
//
// API-03 / D5 — case-insensitive contains search on title + locationCity.
// Prisma's `contains` does NOT escape `%`/`_` (they act as wildcards), so a
// user searching for a literal "100%" would match everything. We escape the
// wildcards ourselves and use $queryRaw with `ESCAPE '\'`.
import { Prisma } from '@prisma/client'

// Escapes LIKE wildcards so user input matches literally:
//   \  ->  \\   %  ->  \%   _  ->  \_
// Backslash MUST be escaped first (order matters).
export function escapeLike(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

// Builds the WHERE clause for the raw search. Structured filters (city,
// propertyType, rentalType, minGuests) are combined with AND against the
// escaped ILIKE pattern. `Prisma.join` keeps the parameter placeholders
// numbered by Prisma itself.
function buildSearchWhere(q, isActive, filters = {}) {
  const pattern = `%${escapeLike(q)}%`
  const parts = [
    Prisma.sql`(title ILIKE '%' || ${pattern} || '%' ESCAPE '\\'
       OR "locationCity" ILIKE '%' || ${pattern} || '%' ESCAPE '\\')`,
    Prisma.sql`"isActive" = ${isActive}`,
  ]
  if (filters.city) parts.push(Prisma.sql`"locationCity" = ${filters.city}`)
  if (filters.propertyType) parts.push(Prisma.sql`"propertyType" = ${filters.propertyType}`)
  if (filters.rentalType) parts.push(Prisma.sql`"rentalType" = ${filters.rentalType}`)
  if (filters.minGuests) parts.push(Prisma.sql`"capacityGuests" >= ${filters.minGuests}`)
  return Prisma.join(parts, ' AND ')
}

// Raw ILIKE search over title/locationCity with an is_active filter.
// `prisma` is injected so tests can assert on the generated SQL/params
// without a database (phase 7 covers the live integration case).
// Column/table names follow the Prisma schema (no @@map): "Property",
// "locationCity", "isActive", "createdAt".
export function searchProperties(prisma, { q, limit = 20, offset = 0, isActive = true, filters = {} } = {}) {
  return prisma.$queryRaw(
    Prisma.sql`SELECT * FROM "Property"
      WHERE ${buildSearchWhere(q, isActive, filters)}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}`
  )
}

// Count for the same raw search (used to build pagination meta). `::int`
// keeps Prisma from returning a BigInt for COUNT(*).
export function countSearchProperties(prisma, { q, isActive = true, filters = {} } = {}) {
  return prisma.$queryRaw(
    Prisma.sql`SELECT COUNT(*)::int AS count FROM "Property"
      WHERE ${buildSearchWhere(q, isActive, filters)}`
  )
}
