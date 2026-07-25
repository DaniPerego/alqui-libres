import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/config/firebase'

const isStorageAvailable = () => {
  return !!storage
}

export function uploadPropertyImage(file, userId, propertyId, onProgress) {
  if (!isStorageAvailable()) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e.target.error)
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const storageRef = ref(storage, `properties/${userId}/${propertyId}/${filename}`)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

export function uploadProfileImage(file, userId, onProgress) {
  if (!isStorageAvailable()) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e.target.error)
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `profile.${ext}`
  const storageRef = ref(storage, `users/${userId}/profile/${filename}`)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

export async function deleteStorageImage(url) {
  if (!isStorageAvailable() || !url || url.startsWith('data:')) return

  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    if (error.code !== 'storage/object-not-found') {
      console.warn('Error al eliminar imagen:', error)
    }
  }
}
