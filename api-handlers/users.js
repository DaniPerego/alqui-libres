// api/users.js
//
// AUTH-02/03, API-02 — user collection endpoint.
//   GET  admin: list users with role/isActive filters + pagination.
//   POST admin create: creates a platform user with bcrypt password,
//       temp password returned once; duplicate email -> 409.
import { randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { requireAuth, requireRole } from './lib/auth.js'

export const config = { runtime: 'nodejs' }

const ROLES = ['guest', 'owner', 'admin']

export default asyncRoute(async (req, res) => {
  if (req.method === 'GET') {
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('admin')(req, res)
    if (!roleOk) return
    const { page, limit } = parsePagination(req.query)
    const where = {}
    if (req.query.role) {
      if (!ROLES.includes(req.query.role)) {
        throw new HttpError('VALIDATION', 'Invalid role', 400)
      }
      where.role = req.query.role
    }
    if (req.query.isActive === 'true') where.isActive = true
    else if (req.query.isActive === 'false') where.isActive = false
    const total = await prisma.user.count({ where })
    const rows = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return res.status(200).json({ data: rows, meta: buildMeta({ page, limit, total }) })
  }

  if (req.method === 'POST') {
    // Admin create: only admins may create other users via the platform.
    const authed = await requireAuth(req, res)
    if (!authed) return
    const roleOk = requireRole('admin')(req, res)
    if (!roleOk) return

    const body = await readJsonBody(req)
    const email = body.email
    if (!email) {
      throw new HttpError('VALIDATION', 'Missing required field: email', 400)
    }
    const displayName = body.displayName || email.split('@')[0]
    const role = body.role || 'owner'
    if (!ROLES.includes(role)) {
      throw new HttpError('VALIDATION', 'Invalid role', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new HttpError('CONFLICT', 'Email already registered', 409)
    }

    const generatedPassword = body.password || randomBytes(9).toString('base64url')
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)
    const id = randomUUID()

    const user = await prisma.user.create({
      data: {
        id,
        email,
        password: hashedPassword,
        displayName,
        role,
        isActive: body.isActive !== false,
      },
    })

    // Return temp password once — client must show it to the new user.
    const { password: _, ...safeUser } = user
    return res.status(201).json({ user: safeUser, tempPassword: generatedPassword })
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
