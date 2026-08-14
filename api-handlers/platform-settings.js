// api/platform-settings.js
//
// API-01, D3 — single-row platform settings resource (model PlatformSettings,
// table platform_settings, id 'general'). Admin-only GET/PATCH.
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from './lib/http.js'
import { requireAuth, requireRole } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

const EDITABLE = ['platformName', 'contactEmail', 'supportPhone', 'commissionRate',
  'emailNotifications', 'whatsappNotifications', 'requireEmailVerification', 'moderateProperties']

export default asyncRoute(async (req, res) => {
  const authed = await requireAuth(req, res)
  if (!authed) return
  const roleOk = requireRole('admin')(req, res)
  if (!roleOk) return

  if (req.method === 'GET') {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'general' } })
    if (!settings) {
      throw new HttpError('NOT_FOUND', 'Platform settings not found', 404)
    }
    return res.status(200).json(settings)
  }

  if (req.method === 'PATCH') {
    const body = await readJsonBody(req)
    const data = {}
    for (const key of EDITABLE) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (data.commissionRate !== undefined) {
      const rate = Number(data.commissionRate)
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        throw new HttpError('VALIDATION', 'commissionRate must be between 0 and 100', 400)
      }
      data.commissionRate = rate
    }
    data.updatedBy = req.auth.userId
    let settings
    try {
      settings = await prisma.platformSettings.update({ where: { id: 'general' }, data })
    } catch {
      throw new HttpError('NOT_FOUND', 'Platform settings not found', 404)
    }
    return res.status(200).json(settings)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
