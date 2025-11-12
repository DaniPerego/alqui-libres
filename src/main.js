import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { initMercadoPagoConfig } from './config/mercadopago'

// Inicializar configuración de MercadoPago
initMercadoPagoConfig()

// Mensaje de bienvenida en consola
console.log('%c🏠 Alquí Libres - Modo Testing', 'color: #2563eb; font-size: 20px; font-weight: bold;')
console.log('%c📋 Credenciales Demo:', 'color: #10b981; font-size: 14px; font-weight: bold;')
console.log('%c   Email: demo@alquilubres.com', 'color: #6b7280; font-size: 12px;')
console.log('%c   Password: demo123', 'color: #6b7280; font-size: 12px;')
console.log('%c🧪 Usando datos de prueba (mock data)', 'color: #f59e0b; font-size: 12px;')
console.log('%c💳 MercadoPago Sandbox configurado', 'color: #00a1e0; font-size: 12px;')
console.log('%c📚 Ver TESTING.md y TEST-PLAN.md para guía completa', 'color: #6b7280; font-size: 11px;')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
