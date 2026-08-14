// api/users/me.js
//
// AUTH-02/03 — own profile.
//   GET   returns the current user row (role resolved from DB, D7).
//   PATCH updates displayName/bio/city/photoURL/contact fields; role and
//         isActive are admin-controlled and rejected with 403 (API-02).
import { prisma } from '../lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody } from '../lib/http.js'
import { requireAuth } from '../lib/auth.js'

export const config = { runtime: 'nodejs' }

const EDITABLE = new Set(['displayName', 'bio', 'city', 'photoURL', 'contactoPrincipal', 'contactoSecundario', 'redesSociales'])
const FORBIDDEN = new Set(['role', 'isActive'])

export default asyncRoute(async (req, res) => {
  const authed = await requireAuth(req, res)
  if (!authed) return

  if (req.method === 'GET') {
    return res.status(200).json(req.auth.user)
  }

  if (req.method === 'PATCH') {
    const body = await readJsonBody(req)
    for (const key of FORBIDDEN) {
      if (body[key] !== undefined) {
        throw new HttpError('FORBIDDEN', `Field cannot be changed: ${key}`, 403)
      }
    }
    const data = {}
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue
      if (!EDITABLE.has(key)) {
        throw new HttpError('VALIDATION', `Field not editable: ${key}`, 400)
      }
      data[key] = value
    }
    const updated = await prisma.user.update({ where: { id: req.auth.userId }, data })
    return res.status(200).json(updated)
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
