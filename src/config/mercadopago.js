// MercadoPago Configuration
// Credenciales de Sandbox para desarrollo

export const MP_CONFIG = {
  publicKey: 'APP_USR-e797b136-e88f-40a6-a422-cc18768131b2',
  accessToken: 'APP_USR-7686970647125276-111210-3643592b55b1584615af4adedce3c983-2984640010',
  mode: 'sandbox', // 'sandbox' o 'production'
  webhookUrl: '' // Opcional: para notificaciones IPN
}

// Inicializar configuración en localStorage
export const initMercadoPagoConfig = () => {
  try {
    // FORZAR reemplazo de configuración (para desarrollo)
    localStorage.setItem('paymentSettings', JSON.stringify(MP_CONFIG))
    console.log('✅ MercadoPago configurado con credenciales de sandbox')
    console.log('🔑 Public Key:', MP_CONFIG.publicKey.substring(0, 20) + '...')
  } catch (error) {
    console.error('Error inicializando MercadoPago config:', error)
  }
}
