// api/db-migrate-once.js
//
// TEMPORARY maintenance endpoint (same pattern as the seed/purge ones).
// Applies the idempotent `Message.reply` column addition to the production
// database, which is unreachable from local machines because DATABASE_URL is
// a Vercel sensitive env var.
//
// Auth: admin JWT + explicit `confirm: "MIGRATE"`. The SQL is idempotent
// (ADD COLUMN IF NOT EXISTS), so re-running is safe. DELETE THIS FILE after.
import { prisma } from '../api-handlers/lib/prisma.js'
import { asyncRoute, readJsonBody, sendJson, HttpError } from '../api-handlers/lib/http.js'
import { requireAuth, requireRole } from '../api-handlers/lib/auth.js'

export const config = { runtime: 'nodejs' }

export default asyncRoute(async (req, res) => {
  if (req.method !== 'POST') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }

  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  const body = await readJsonBody(req)
  if (body?.confirm !== 'MIGRATE') {
    throw new HttpError('VALIDATION', 'confirm must be "MIGRATE"', 400)
  }

  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "reply" TEXT'
  )

  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Message' AND column_name = 'reply'`
  )

  return sendJson(res, 200, {
    migrated: rows.length === 1,
    column: rows[0]?.column_name ?? null,
  })
})
