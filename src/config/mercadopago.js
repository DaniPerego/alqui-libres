// MercadoPago Configuration
// Reads credentials from environment variables. When no public key is
// configured, the app stays in demo mode and no real key is stored in source.
//
// The access token is SERVER-ONLY (process.env.MP_ACCESS_TOKEN) and is never
// read here: VITE_ variables are inlined into the public bundle, so a token
// here would leak to every browser. The frontend only needs the public key.

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || ''
const webhookUrl = import.meta.env.VITE_MP_WEBHOOK_URL || ''

const PLACEHOLDER_PATTERNS = ['your', 'placeholder', 'example', 'xxx', 'abc']
const isPlaceholder = (value) => {
  if (!value) return true
  const lower = String(value).toLowerCase()
  return PLACEHOLDER_PATTERNS.some(pattern => lower.includes(pattern))
}

const isDemo = !publicKey || isPlaceholder(publicKey)

export const MP_CONFIG = {
  publicKey,
  mode: isDemo ? 'demo' : (import.meta.env.VITE_MP_MODE || 'sandbox'),
  isDemo,
  webhookUrl
}

// Inicializar configuración en localStorage
export const initMercadoPagoConfig = () => {
  try {
    if (MP_CONFIG.isDemo) {
      localStorage.setItem('paymentSettings', JSON.stringify(MP_CONFIG))
      console.log('🧪 MercadoPago en modo demo')
      return
    }

    localStorage.setItem('paymentSettings', JSON.stringify(MP_CONFIG))
    console.log('✅ MercadoPago configurado')
  } catch (error) {
    console.error('Error inicializando MercadoPago config:', error)
  }
}
