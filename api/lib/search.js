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

// Raw ILIKE search over title/locationCity with an is_active filter.
// `prisma` is injected so tests can assert on the generated SQL/params
// without a database (phase 7 covers the live integration case).
// Column/table names follow the Prisma schema (no @@map): "Property",
// "locationCity", "isActive", "createdAt".
export function searchProperties(prisma, { q, limit = 20, offset = 0, isActive = true } = {}) {
  const pattern = `%${escapeLike(q)}%`
  return prisma.$queryRaw(
    Prisma.sql`SELECT * FROM "Property"
      WHERE (title ILIKE '%' || ${pattern} || '%' ESCAPE '\\'
             OR "locationCity" ILIKE '%' || ${pattern} || '%' ESCAPE '\\')
        AND "isActive" = ${isActive}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}`
  )
}
