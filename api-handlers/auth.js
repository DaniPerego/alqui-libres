import { prisma } from './lib/prisma.js'
import { HttpError, sendError, sendJson, readJsonBody, sanitizeUser } from './lib/http.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'alqui-libres-dev-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const body = await readJsonBody(req)
      const path = req.query?.action || 'login'

      if (path === 'register') {
        return await handleRegister(req, res, body)
      }
      if (path === 'login') {
        return await handleLogin(req, res, body)
      }
      if (path === 'me') {
        return await handleMe(req, res)
      }
      if (path === 'change-password') {
        return await handleChangePassword(req, res, body)
      }
      if (path === 'reset-password') {
        return await handleResetPassword(req, res, body)
      }

      return sendError(res, new HttpError('NOT_FOUND', 'Unknown auth action', 404))
    }

    if (req.method === 'GET') {
      return await handleMe(req, res)
    }

    return sendError(res, new HttpError('METHOD', 'Method not allowed', 405))
  } catch (err) {
    sendError(res, err)
  }
}

async function handleRegister(req, res, body) {
  const { email, password, displayName } = body || {}

  if (!email || !password || !displayName) {
    throw new HttpError('VALIDATION', 'Email, password, and displayName are required', 400)
  }

  if (password.length < 6) {
    throw new HttpError('VALIDATION', 'Password must be at least 6 characters', 400)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new HttpError('CONFLICT', 'Email already registered', 409)
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const id = randomUUID()

  const user = await prisma.user.create({
    data: {
      id,
      email,
      displayName,
      password: hashedPassword,
      role: 'owner',
      isActive: true,
      emailVerified: false
    }
  })

  const token = signToken(user)
  return sendJson(res, 201, { token, user: sanitizeUser(user) })
}

async function handleLogin(req, res, body) {
  const { email, password } = body || {}

  if (!email || !password) {
    throw new HttpError('VALIDATION', 'Email and password are required', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new HttpError('UNAUTHORIZED', 'Invalid credentials', 401)
  }

  if (!user.isActive) {
    throw new HttpError('FORBIDDEN', 'User account is inactive', 403)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new HttpError('UNAUTHORIZED', 'Invalid credentials', 401)
  }

  const token = signToken(user)
  return sendJson(res, 200, { token, user: sanitizeUser(user) })
}

async function handleMe(req, res) {
  const token = req.headers?.authorization?.split(' ')[1]
  if (!token) {
    throw new HttpError('UNAUTHORIZED', 'Authentication required', 401)
  }

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    throw new HttpError('UNAUTHORIZED', 'Invalid or expired token', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw new HttpError('NOT_FOUND', 'User not found', 404)
  }

  if (!user.isActive) {
    throw new HttpError('FORBIDDEN', 'User account is inactive', 403)
  }

  return sendJson(res, 200, sanitizeUser(user))
}

async function handleChangePassword(req, res, body) {
  const token = req.headers?.authorization?.split(' ')[1]
  if (!token) {
    throw new HttpError('UNAUTHORIZED', 'Authentication required', 401)
  }

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch {
    throw new HttpError('UNAUTHORIZED', 'Invalid or expired token', 401)
  }

  const { newPassword } = body || {}
  if (!newPassword || newPassword.length < 6) {
    throw new HttpError('VALIDATION', 'New password must be at least 6 characters', 400)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: payload.sub },
    data: { password: hashedPassword }
  })

  return sendJson(res, 200, { message: 'Password updated successfully' })
}

async function handleResetPassword(req, res, body) {
  const { email } = body || {}
  if (!email) {
    throw new HttpError('VALIDATION', 'Email is required', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendJson(res, 200, { message: 'If the email exists, a reset link has been sent' })
  }

  const tempPassword = 'temp' + Math.random().toString(36).slice(2, 8)
  const hashedPassword = await bcrypt.hash(tempPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  return sendJson(res, 200, { message: 'If the email exists, a reset link has been sent' })
}
