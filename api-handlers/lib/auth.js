import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'
import { HttpError, sendError } from './http.js'

const JWT_SECRET = process.env.JWT_SECRET || 'alqui-libres-dev-secret-change-in-production'

export function extractBearer(req) {
  const header = req.headers?.authorization || ''
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token
}

export async function getAuthUser(req) {
  const token = extractBearer(req)
  if (!token) {
    throw new HttpError('UNAUTHORIZED', 'Authentication required', 401)
  }
  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    throw new HttpError('UNAUTHORIZED', 'Invalid or expired token', 401)
  }
  return { userId: payload.sub, user: payload }
}

export async function requireAuth(req, res, next) {
  try {
    const { userId } = await getAuthUser(req)
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!dbUser) {
      throw new HttpError('FORBIDDEN', 'User is not registered on the platform', 403)
    }
    if (!dbUser.isActive) {
      throw new HttpError('FORBIDDEN', 'User account is inactive', 403)
    }
    req.auth = { userId, role: dbUser.role, user: dbUser }
    return next ? next() : true
  } catch (err) {
    if (res && res.status) {
      sendError(res, err)
      return false
    }
    throw err
  }
}

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
