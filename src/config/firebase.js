import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Verificar si Firebase está configurado
// Cualquier valor placeholder (ejemplos de .env.example) cuenta como "no configurado"
const PLACEHOLDER_PATTERNS = [
  'tu_api_key',
  'your_api_key',
  'tu-proyecto',
  'your_project',
  'tu_proyecto',
  '123456789',
  'abc123',
  'tu_clave',
  'your_sender',
  'your_app'
]

function isPlaceholder(value) {
  return !value ||
    PLACEHOLDER_PATTERNS.some(pattern => String(value).includes(pattern))
}

const isFirebaseConfigured =
  !isPlaceholder(firebaseConfig.apiKey) &&
  !isPlaceholder(firebaseConfig.projectId) &&
  !isPlaceholder(firebaseConfig.authDomain) &&
  !isPlaceholder(firebaseConfig.appId)

let app = null
let auth = null
let db = null
let storage = null

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    console.log('✅ Firebase inicializado correctamente')
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase:', error.message)
    console.log('🧪 Cambiando a modo demo con datos de prueba')
  }
} else {
  console.log('🧪 Firebase no configurado - Usando modo demo con datos de prueba')
  console.log('📝 Para usar Firebase real, configura las variables en el archivo .env')
}

export { auth, db, storage }
export default app
