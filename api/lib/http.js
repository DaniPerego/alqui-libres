// api/lib/http.js
//
// HTTP error contract (design API section):
//   { "error": { "code", "message" } }
// Codes: VALIDATION (400) | UNAUTHORIZED (401) | FORBIDDEN (403) |
//        NOT_FOUND (404) | METHOD (405) | CONFLICT (409) | INTERNAL (500)
// Plus offset pagination helpers (D4): ?page=1&limit=20 (max 100).

export const ERROR_CODES = {
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD: 'METHOD',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
}

const STATUS_BY_CODE = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD: 405,
  CONFLICT: 409,
  INTERNAL: 500,
}

export class HttpError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status ?? STATUS_BY_CODE[code] ?? 500
  }
}

// Normalizes any thrown error into the API error contract. 5xx responses
// never leak internal details; the original error is logged instead.
export function sendError(res, err) {
  if (err instanceof HttpError) {
    const message = err.status >= 500 ? 'Internal server error' : err.message
    if (err.status >= 500) {
      console.error('[api] error:', err)
    }
    return res.status(err.status).json({ error: { code: err.code, message } })
  }
  console.error('[api] error:', err)
  return res.status(500).json({ error: { code: ERROR_CODES.INTERNAL, message: 'Internal server error' } })
}

export function sendJson(res, status, data) {
  return res.status(status).json(data)
}

// D4 — offset pagination. Non-numeric, zero, or negative values fall back to
// defaults; limit is capped at 100.
export function parsePagination(query = {}) {
  const rawPage = Number.parseInt(query.page, 10)
  const rawLimit = Number.parseInt(query.limit, 10)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20
  return { page, limit }
}

export function buildMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}
