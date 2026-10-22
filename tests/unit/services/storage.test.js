// tests/unit/services/storage.test.js
//
// Unit tests for src/services/storage.js — upload/delete helpers must attach
// the same Authorization header used by src/services/api.js.
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({ sessionToken: 'mock-token' }))
}))

import { useAuthStore } from '@/stores/auth'
import {
  uploadPropertyImage,
  uploadProfileImage,
  deleteStorageImage
} from '@/services/storage.js'

describe('src/services/storage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ url: 'https://blob/1.jpg' }), { status: 200 }))
    )
    useAuthStore.mockReturnValue({ sessionToken: 'mock-token' })
  })

  it('uploadPropertyImage sends the Authorization header', async () => {
    const file = new Blob(['fake-image'], { type: 'image/jpeg' })

    const url = await uploadPropertyImage(file)

    const [, init] = fetch.mock.calls[0]
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer mock-token'
    })
    expect(init.headers['x-upload-type']).toBeUndefined()
    expect(url).toBe('https://blob/1.jpg')
  })

  it('uploadProfileImage sends Authorization and x-upload-type headers', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://blob/avatar.jpg' }), { status: 200 })
    )
    const file = new Blob(['fake-avatar'], { type: 'image/jpeg' })

    await uploadProfileImage(file)

    const [, init] = fetch.mock.calls[0]
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer mock-token',
      'x-upload-type': 'profile'
    })
  })

  it('deleteStorageImage sends the Authorization header', async () => {
    await deleteStorageImage('https://blob/1.jpg')

    const [, init] = fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-token'
    })
    expect(init.body).toBe(JSON.stringify({ url: 'https://blob/1.jpg' }))
  })

  it('deleteStorageImage skips data: and blob: URLs without calling fetch', async () => {
    await deleteStorageImage('data:image/png;base64,abc')
    await deleteStorageImage('blob:https://example.com/uuid')

    expect(fetch).not.toHaveBeenCalled()
  })
})
