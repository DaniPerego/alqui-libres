// api/seed-once.js
//
// TEMPORARY maintenance endpoint (same pattern as the earlier purge
// endpoint). Runs the idempotent prisma/seed.js against the production
// database, which is unreachable from local machines because DATABASE_URL
// is a Vercel sensitive env var.
//
// Auth: admin JWT + explicit `confirm: "SEED"` so a stray call cannot
// mutate data. DELETE THIS FILE after the run.
import { main } from '../prisma/seed.js'
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
  if (body?.confirm !== 'SEED') {
    throw new HttpError('VALIDATION', 'confirm must be "SEED"', 400)
  }

  // Capture the seed's own progress lines so the caller gets evidence of
  // what actually ran, not just a status code.
  const logs = []
  const originalLog = console.log
  console.log = (...args) => {
    logs.push(args.join(' '))
    originalLog(...args)
  }
  try {
    await main()
  } finally {
    console.log = originalLog
  }

  return sendJson(res, 200, { seeded: true, logs })
})
