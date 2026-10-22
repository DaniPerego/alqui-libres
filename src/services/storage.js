const API_BASE = '/api'

async function uploadToApi(file, type) {
  const formData = new FormData()
  formData.append('file', file)

  const headers = {}
  if (type === 'profile') {
    headers['x-upload-type'] = 'profile'
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Upload failed' } }))
    throw new Error(body.error?.message || `Upload failed (HTTP ${res.status})`)
  }

  const data = await res.json()
  if (!data.url) {
    throw new Error('Upload response did not contain a file URL')
  }
  return data.url
}

async function deleteFromApi(url) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return

  const res = await fetch(`${API_BASE}/upload/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Delete failed' } }))
    throw new Error(body.error?.message || `Delete failed (HTTP ${res.status})`)
  }
}

export async function uploadPropertyImage(file, _userId, _propertyId, onProgress) {
  // Progress is not available for a single-shot fetch upload; report
  // completion once the request finishes.
  if (onProgress) onProgress(100)
  return uploadToApi(file, 'property')
}

export async function uploadProfileImage(file, _userId, onProgress) {
  if (onProgress) onProgress(100)
  return uploadToApi(file, 'profile')
}

export async function deleteStorageImage(url) {
  try {
    await deleteFromApi(url)
  } catch (err) {
    console.error('Error deleting stored image:', err.message)
    throw err
  }
}
