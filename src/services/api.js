import { useAuthStore } from '@/stores/auth'

// Offline demo rule for the whole SPA:
//
// The localStorage / mockData fallbacks in services and stores exist ONLY so
// the app can run as a static SPA with no backend at all (e.g. local preview
// or Vercel deploys without DATABASE_URL). They MUST NOT be presented as real
// data when the API is reachable but failing.
//
// Rule: a service/store may fall back to localStorage or mock data ONLY when
//   1. the request failed with code NETWORK_ERROR (fetch threw or no response),
//   2. AND the app is explicitly in demo/offline mode (VITE_DEMO_MODE=true).
//
// Any other failure (4xx, 5xx, UNAUTHORIZED, etc.) must surface an explicit
// error to the user and leave the affected list empty / untouched.
//
// Auth keeps its own offline demo fallback (src/stores/auth.js) and is
// intentionally excluded from this rule because login is the entry point
// into demo mode.

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true'
}

export function getAuthToken() {
  return useAuthStore().sessionToken
}

function statusToCode(status) {
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 405) return 'METHOD'
  if (status === 409) return 'CONFLICT'
  if (status >= 500) return 'INTERNAL'
  return 'UNKNOWN'
}

async function parseJson(response) {
  try {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function buildUrl(path, params) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  let url = `${API_BASE}${normalizedPath}`

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString()
    url += `?${query}`
  }

  return url
}

async function request(method, path, body = null, options = {}) {
  const { public: isPublic = false } = options
  const token = getAuthToken()

  if (!isPublic && !token) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No session' }
    }
  }

  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const hasBody = body !== null && method !== 'GET' && method !== 'DELETE'
  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  const init = {
    method,
    headers
  }

  if (hasBody) {
    init.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(buildUrl(path, options?.params), init)

    if (!response.ok) {
      const payload = await parseJson(response)
      const code = payload?.error?.code || statusToCode(response.status)
      const message = payload?.error?.message || response.statusText || 'Request failed'
      return { success: false, error: { code, message } }
    }

    const data = await parseJson(response)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network error. Please try again.' }
    }
  }
}

/**
 * Unwrap a list response into an array.
 *
 * Collection endpoints return a paginated envelope `{ data: [...], meta: {...} }`,
 * while offline/demo fallbacks and some legacy handlers return a bare array.
 * This helper accepts either shape and always returns an array so consumers can
 * safely call `.map()` without crashing on the envelope object.
 */
export function toList(result) {
  if (!result) return []
  if (Array.isArray(result)) return result
  if (Array.isArray(result.data)) return result.data
  return []
}

export async function apiGet(path, params, options) {
  return request('GET', path, null, { ...options, params })
}

export async function apiPost(path, body, options) {
  return request('POST', path, body, options)
}

export async function apiPatch(path, body, options) {
  return request('PATCH', path, body, options)
}

export async function apiPut(path, body, options) {
  return request('PUT', path, body, options)
}

export async function apiDelete(path, options) {
  return request('DELETE', path, null, options)
}
