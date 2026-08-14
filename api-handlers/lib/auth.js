// api/lib/auth.js
//
// AUTH-01 / AUTH-02 / D7 — JWT middleware.
//   1. Bearer token -> supabase.auth.getUser(token) (service-role client);
//      missing/invalid/expired -> 401.
//   2. Role resolved from the users table by token subject PER REQUEST;
//      JWT role claims are never trusted (D7). No row or inactive -> 403.
//   3. Attaches req.auth = { userId, role, user } and provides
//      requireRole(...roles) guards for routes.
import { createClient } from '@supabase/supabase-js'
import { prisma } from './prisma.js'
import { HttpError, sendError } from './http.js'

let adminClient = null

export function getAdminClient() {
  if (!adminClient) {
    const url = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      throw new HttpError('INTERNAL', 'Supabase server-side configuration missing', 500)
    }
    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}

export function extractBearer(req) {
  const header = req.headers?.authorization || ''
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token
}

// Verifies the JWT against Supabase. Throws HttpError 401 on missing/invalid/
// expired tokens.
export async function getAuthUser(req) {
  const token = extractBearer(req)
  if (!token) {
    throw new HttpError('UNAUTHORIZED', 'Authentication required', 401)
  }
  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error || !data?.user) {
    throw new HttpError('UNAUTHORIZED', 'Invalid or expired token', 401)
  }
  return { userId: data.user.id, user: data.user }
}

// Middleware: (req, res, next). On success attaches req.auth and calls next.
// On failure writes the error response (401/403) and returns false.
export async function requireAuth(req, res, next) {
  try {
    const { userId, user } = await getAuthUser(req)
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!dbUser) {
      // AUTH-02 edge: token valid but no platform user row
      throw new HttpError('FORBIDDEN', 'User is not registered on the platform', 403)
    }
    if (!dbUser.isActive) {
      throw new HttpError('FORBIDDEN', 'User account is inactive', 403)
    }
    req.auth = { userId, role: dbUser.role, user: dbUser } // D7: role from DB
    return next ? next() : true
  } catch (err) {
    if (res && res.status) {
      sendError(res, err)
      return false
    }
    throw err
  }
}

// Guard: requireRole('admin') / requireRole('owner', 'admin') — runs AFTER
// requireAuth so req.auth is populated. 401 if missing auth, 403 if role
// not allowed.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req?.auth) {
      const err = new HttpError('UNAUTHORIZED', 'Authentication required', 401)
      if (res?.status) return sendError(res, err)
      throw err
    }
    if (!roles.includes(req.auth.role)) {
      const err = new HttpError('FORBIDDEN', `Requires role: ${roles.join(' or ')}`, 403)
      if (res?.status) return sendError(res, err)
      throw err
    }
    return next ? next() : true
  }
}
