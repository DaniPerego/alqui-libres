// TEMPORARY one-shot seed endpoint — DELETE AFTER USE.
//
// The production DATABASE_URL is a Vercel "sensitive" env var: it only exists
// inside serverless functions and can never be read from a local machine. This
// endpoint runs prisma/seed.js inside the platform, guarded by a one-time
// bearer token. Remove this file (and redeploy) immediately after seeding.
import { main as runSeed } from '../prisma/seed.js'

const TOKEN = 'b37318f7f1c5157914d4e279a7485ae73180988c6c5812b2'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD', message: 'POST only' } })
  }
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } })
  }
  try {
    await runSeed()
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[seed-once] failed:', err)
    return res.status(500).json({ ok: false, error: String(err?.message ?? err) })
  }
}
