// api/users.js
//
// AUTH-02/03, API-02 — user collection endpoint.
//   GET  admin: list users with role/isActive filters + pagination.
//   POST two modes, both requiring a valid JWT (getAuthUser -> 401):
//     - Self materialize (register flow, AUTH-03): no users row exists yet,
//       so the full requireAuth guard (which 403s on missing rows) cannot be
//       used. Creates the row with role=owner; 409 when the row already
//       exists.
//     - Admin create (service role): creates the Supabase auth user +
//       platform row, temp password returned once; duplicate email -> 409.
import { randomBytes } from 'node:crypto'
import { prisma } from './lib/prisma.js'
import { HttpError, asyncRoute, readJsonBody, parsePagination, buildMeta } from './lib/http.js'
import { getAuthUser, getAdminClient, requireAuth, requireRole } from './lib/auth.js'

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
    // JWT verification only — a missing users row is exactly the case the
    // self-materialize branch handles (401 on missing/invalid token).
    const { userId, user: supaUser } = await getAuthUser(req)
    const body = await readJsonBody(req)
    const existing = await prisma.user.findUnique({ where: { id: userId } })

    if (existing) {
      // Existing row + non-admin: the self-materialize path already ran for
      // this user (register flow). A repeated POST is a duplicate -> 409.
      if (existing.role !== 'admin') {
        throw new HttpError('CONFLICT', 'User already exists', 409)
      }
      // Admin create (service role): only admins may create other users.
      const email = body.email
      if (!email) {
        throw new HttpError('VALIDATION', 'Missing required field: email', 400)
      }
      const displayName = body.displayName || email.split('@')[0]
      const role = body.role || 'owner'
      if (!ROLES.includes(role)) {
        throw new HttpError('VALIDATION', 'Invalid role', 400)
      }
      const generatedPassword = body.password || randomBytes(9).toString('base64url')
      const { data: createdUser, error } = await getAdminClient().auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
      })
      if (error) {
        if (/already registered|duplicate/i.test(error.message || '')) {
          throw new HttpError('CONFLICT', 'Email is already registered', 409)
        }
        throw new HttpError('VALIDATION', error.message, 400)
      }
      // UserResponse shape: { data: { user }, error } — the id lives in data.user.
      const supaUserId = createdUser?.user?.id
      if (!supaUserId) {
        throw new HttpError('INTERNAL', 'Supabase did not return a user id', 500)
      }
      const user = await prisma.user.create({
        data: {
          id: supaUserId,
          email,
          displayName,
          role,
          isActive: body.isActive !== false,
        },
      })
      return res.status(201).json({ user, tempPassword: generatedPassword })
    }

    // Self materialize after supabase signUp (AUTH-03 register flow).
    // The users row is created with role=owner per the design auth flow.
    const displayName = body.displayName || supaUser.user_metadata?.displayName || 'Usuario'
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: supaUser.email,
        displayName,
        role: 'owner',
      },
    })
    return res.status(201).json({ user })
  }

  throw new HttpError('METHOD', 'Method not allowed', 405)
})
