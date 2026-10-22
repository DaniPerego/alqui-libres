import { del } from '@vercel/blob'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth, requireRole } from '../lib/auth.js'

export const config = {
  runtime: 'nodejs'
}

export default asyncRoute(async (req, res) => {
  if (req.method !== 'POST') {
    throw new HttpError('METHOD', 'Method not allowed', 405)
  }

  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('owner', 'admin')(req, res)
  if (!roleOk) return

  const body = await readJsonBody(req)
  const { url } = body

  if (!url) {
    throw new HttpError('VALIDATION', 'URL is required', 400)
  }

  try {
    await del(url)
  } catch (delError) {
    if (!delError.message?.includes('not found')) {
      throw delError
    }
  }

  return res.status(200).json({ success: true })
})
