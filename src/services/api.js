import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const TOKEN_KEY = 'alqui_libres_token'

function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
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

export function isApiAvailable() {
  return true
}
