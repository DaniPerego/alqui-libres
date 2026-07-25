import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/config/firebase'

const API_BASE = '/api'

const isFirebaseStorageAvailable = () => !!storage

async function uploadViaVercelBlob(file, type) {
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
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return data.url
}

async function deleteViaVercelBlob(url) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return

  await fetch(`${API_BASE}/upload/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
}

async function uploadViaFirebase(file, userId, propertyId, onProgress) {
  if (!isFirebaseStorageAvailable()) {
    return fallbackToBase64(file)
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const folder = propertyId ? `properties/${userId}/${propertyId}` : `users/${userId}/profile`
  const filename = propertyId
    ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    : `profile.${ext}`
  const storageRef = ref(storage, `${folder}/${filename}`)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

function fallbackToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e.target.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadPropertyImage(file, userId, propertyId, onProgress) {
  try {
    return await uploadViaVercelBlob(file, 'property')
  } catch (vercelError) {
    console.warn('Vercel Blob no disponible, usando Firebase Storage:', vercelError.message)
    try {
      return await uploadViaFirebase(file, userId, propertyId, onProgress)
    } catch (firebaseError) {
      console.warn('Firebase Storage no disponible, usando fallback base64:', firebaseError.message)
      return fallbackToBase64(file)
    }
  }
}

export async function uploadProfileImage(file, userId, onProgress) {
  try {
    return await uploadViaVercelBlob(file, 'profile')
  } catch (vercelError) {
    console.warn('Vercel Blob no disponible, usando Firebase Storage:', vercelError.message)
    try {
      return await uploadViaFirebase(file, userId, null, onProgress)
    } catch (firebaseError) {
      console.warn('Firebase Storage no disponible, usando fallback base64:', firebaseError.message)
      return fallbackToBase64(file)
    }
  }
}

export async function deleteStorageImage(url) {
  try {
    await deleteViaVercelBlob(url)
  } catch {
    try {
      if (isFirebaseStorageAvailable() && url && !url.startsWith('data:')) {
        const storageRef = ref(storage, url)
        await deleteObject(storageRef)
      }
    } catch {}
  }
}
