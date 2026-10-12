// tests/integration/helpers/auth.js
//
// Signs REAL HS256 JWTs with the same contract the api-handlers verify
// (api-handlers/lib/auth.js): payload { sub, email, role }, secret from
// process.env.JWT_SECRET (set deterministically in tests/setup.js).
// Tests attach the returned headers so requests exercise the real
// requireAuth/jwt.verify path instead of a mocked one.
import jwt from 'jsonwebtoken'

export function makeAuthToken({ uid = 'uid-1', role = 'owner', email = 'user@test.com' } = {}) {
  const secret = process.env.JWT_SECRET || 'alqui-libres-dev-secret-change-in-production'
  return jwt.sign({ sub: uid, email, role }, secret, { expiresIn: '1h' })
}

export function makeAuthHeaders(user) {
  return { authorization: `Bearer ${makeAuthToken(user)}` }
}
