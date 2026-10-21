import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({ sessionToken: 'mock-token' }))
}))

import { useAuthStore } from '@/stores/auth'
import {
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  toList
} from '@/services/api.js'

describe('src/services/api', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    )
    useAuthStore.mockReturnValue({ sessionToken: 'mock-token' })
  })

  it('apiGet sends the Authorization header when a session token exists', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), { status: 200 })
    )

    const result = await apiGet('/properties')

    expect(fetch).toHaveBeenCalledWith(
      '/api/properties',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token'
        })
      })
    )
    expect(result).toEqual({ success: true, data: { id: 1 } })
  })

  it('apiGet omits Authorization for public endpoints without a token', async () => {
    useAuthStore.mockReturnValue({ sessionToken: null })
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ public: true }), { status: 200 })
    )

    const result = await apiGet('/public/health', undefined, { public: true })
    const [, init] = fetch.mock.calls[0]

    expect(init.headers.Authorization).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('returns UNAUTHORIZED without calling fetch when the endpoint requires auth and there is no token', async () => {
    useAuthStore.mockReturnValue({ sessionToken: null })

    const result = await apiGet('/properties')

    expect(fetch).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No session' }
    })
  })

  it('apiPost sets Content-Type and serializes the JSON body', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ created: 1 }), { status: 201 })
    )

    const result = await apiPost('/properties', { title: 'Casa' })

    expect(fetch).toHaveBeenCalledWith(
      '/api/properties',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        }),
        body: JSON.stringify({ title: 'Casa' })
      })
    )
    expect(result).toEqual({ success: true, data: { created: 1 } })
  })

  it('apiPatch and apiPut also set Content-Type', async () => {
    fetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await apiPatch('/properties/1', { price: 100 })
    const [, patchInit] = fetch.mock.calls[0]
    expect(patchInit.headers['Content-Type']).toBe('application/json')

    fetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await apiPut('/properties/1', { price: 200 })
    const [, putInit] = fetch.mock.calls[1]
    expect(putInit.headers['Content-Type']).toBe('application/json')
  })

  it('normalizes API error responses', async () => {
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: 'VALIDATION', message: 'Invalid field' } }),
        { status: 400 }
      )
    )

    const result = await apiGet('/properties')

    expect(result.success).toBe(false)
    expect(result.error).toEqual({ code: 'VALIDATION', message: 'Invalid field' })
  })

  it('maps unknown error status codes to a fallback code', async () => {
    fetch.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))

    const result = await apiGet('/properties')

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('INTERNAL')
  })

  it('handles network failures gracefully', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await apiGet('/properties')

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('NETWORK_ERROR')
  })
})

describe('toList', () => {
  it('unwraps the paginated API envelope { data: [...], meta: {...} }', () => {
    const envelope = { data: [{ id: 1 }, { id: 2 }], meta: { page: 1 } }
    expect(toList(envelope)).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('returns a bare array unchanged', () => {
    const bare = [{ id: 1 }, { id: 2 }]
    expect(toList(bare)).toEqual(bare)
  })

  it('returns an empty array for null, undefined, or missing data', () => {
    expect(toList(null)).toEqual([])
    expect(toList(undefined)).toEqual([])
    expect(toList({})).toEqual([])
    expect(toList({ meta: { page: 1 } })).toEqual([])
  })
})
