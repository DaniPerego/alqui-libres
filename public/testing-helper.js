// Utilidades para testing en la consola del navegador

window.alquiTest = {
  // Información general
  info() {
    console.log('%c📋 Información de Testing', 'color: #2563eb; font-size: 16px; font-weight: bold;')
    console.log('URL Base:', window.location.origin)
    console.log('Ruta Actual:', window.location.pathname)
    console.log('Modo:', 'Mock Data (Sin Firebase)')
    console.log('\n%c🔑 Credenciales Demo:', 'color: #10b981; font-size: 14px; font-weight: bold;')
    console.log('Email: demo@alquilubres.com')
    console.log('Password: demo123')
  },

  // Navegar a rutas importantes
  nav: {
    home: () => window.location.href = '/',
    search: () => window.location.href = '/buscar',
    login: () => window.location.href = '/login',
    register: () => window.location.href = '/registro',
    dashboard: () => window.location.href = '/panel',
    properties: () => window.location.href = '/panel/propiedades',
    messages: () => window.location.href = '/panel/mensajes',
    subscription: () => window.location.href = '/panel/suscripcion',
    property: (id = '1') => window.location.href = `/propiedad/${id}`
  },

  // Datos mock disponibles
  data: {
    properties: 4,
    messages: 3,
    reviews: 4,
    user: {
      email: 'demo@alquilubres.com',
      uid: 'user123',
      displayName: 'Usuario Demo'
    }
  },

  // Casos de prueba rápidos
  tests: {
    loginDemo() {
      console.log('%c🧪 Test: Login Demo', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Ir a /login')
      console.log('2. Email: demo@alquilubres.com')
      console.log('3. Password: demo123')
      console.log('4. Click "Iniciar Sesión"')
      console.log('✅ Resultado esperado: Redirección a /panel')
    },

    filterGrill() {
      console.log('%c🧪 Test: Filtro de Parrilla', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Ir a /buscar')
      console.log('2. Click "Filtros Avanzados"')
      console.log('3. Seleccionar "Carbón" en Tipo de Parrilla')
      console.log('✅ Resultado esperado: 2 propiedades')
    },

    filterParking() {
      console.log('%c🧪 Test: Filtro de Estacionamiento', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Ir a /buscar')
      console.log('2. Click "Filtros Avanzados"')
      console.log('3. Seleccionar "Grande" en Tamaño de Estacionamiento')
      console.log('✅ Resultado esperado: 1 propiedad')
    },

    calculator() {
      console.log('%c🧪 Test: Calculadora de Ahorro', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Login y ir a /panel/suscripcion')
      console.log('2. Cambiar "Reservas mensuales" a 10')
      console.log('3. Cambiar "Precio promedio" a $100')
      console.log('✅ Resultado esperado:')
      console.log('   - Airbnb (15%): ~$150/mes')
      console.log('   - Booking (18%): ~$180/mes')
      console.log('   - Ahorro significativo mostrado')
    },

    crud() {
      console.log('%c🧪 Test: CRUD de Propiedades', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Login y ir a /panel/propiedades')
      console.log('2. Click "Agregar Nueva Propiedad"')
      console.log('3. Verificar sección "CARACTERÍSTICAS LOCALES" destacada')
      console.log('4. Llenar formulario y guardar')
      console.log('✅ Resultado esperado: Formulario completo y usable')
    },

    responsive() {
      console.log('%c🧪 Test: Responsive Design', 'color: #f59e0b; font-size: 14px;')
      console.log('1. Abrir DevTools (F12)')
      console.log('2. Toggle device toolbar (Ctrl+Shift+M)')
      console.log('3. Probar dimensiones:')
      console.log('   - Mobile: 375px')
      console.log('   - Tablet: 768px')
      console.log('   - Desktop: 1920px')
      console.log('✅ Resultado esperado: Layout adaptable sin scroll horizontal')
    }
  },

  // Verificar estado de stores
  checkStores() {
    console.log('%c📦 Estado de Stores', 'color: #8b5cf6; font-size: 14px; font-weight: bold;')
    
    try {
      const authStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps[0]?.appContext?.config?.globalProperties?.$pinia
      if (authStore) {
        console.log('✅ Pinia store disponible')
        console.log('Usa Vue DevTools para inspeccionar stores en detalle')
      } else {
        console.log('ℹ️ Stores disponibles (usa Vue DevTools para ver detalles)')
      }
    } catch (e) {
      console.log('ℹ️ Instala Vue DevTools para inspeccionar stores')
    }
  },

  // Listar todas las rutas disponibles
  routes() {
    console.log('%c🗺️ Rutas Disponibles', 'color: #06b6d4; font-size: 14px; font-weight: bold;')
    console.log('\n📍 Públicas:')
    console.log('  / ........................... Homepage')
    console.log('  /buscar ..................... Búsqueda de propiedades')
    console.log('  /propiedad/:id .............. Detalle de propiedad')
    console.log('  /login ...................... Login')
    console.log('  /registro ................... Registro')
    
    console.log('\n🔒 Privadas (requieren login):')
    console.log('  /panel ...................... Dashboard')
    console.log('  /panel/propiedades .......... Listado de propiedades')
    console.log('  /panel/propiedades/nueva .... Crear propiedad')
    console.log('  /panel/propiedades/editar/:id  Editar propiedad')
    console.log('  /panel/mensajes ............. Mensajes de consultas')
    console.log('  /panel/suscripcion .......... Planes y calculadora')
  },

  // Verificar features clave
  features() {
    console.log('%c⭐ Features Clave a Verificar', 'color: #ec4899; font-size: 14px; font-weight: bold;')
    console.log('\n1. 🎯 Filtros Hiper-Locales (/buscar)')
    console.log('   - Tipo de parrilla: sin, eléctrica, gas, carbón')
    console.log('   - Tamaño parking: sin, pequeña, mediana, grande')
    
    console.log('\n2. 💰 Calculadora de Ahorro (/panel/suscripcion)')
    console.log('   - Compara vs Airbnb (15% comisión)')
    console.log('   - Compara vs Booking (18% comisión)')
    console.log('   - Muestra ahorro anual')
    
    console.log('\n3. 💎 Precio Transparente (/propiedad/:id)')
    console.log('   - Desglose claro de costos')
    console.log('   - Sin comisiones ocultas')
    
    console.log('\n4. 📝 CRUD Completo (/panel/propiedades)')
    console.log('   - Crear, editar, eliminar propiedades')
    console.log('   - Sección características locales destacada')
    
    console.log('\n5. 💬 Sistema de Mensajes (/panel/mensajes)')
    console.log('   - Consultas de huéspedes')
    console.log('   - Plantillas de respuesta rápida')
  },

  // Ayuda
  help() {
    console.log('%c📚 Comandos Disponibles', 'color: #2563eb; font-size: 16px; font-weight: bold;')
    console.log('\nalquiTest.info() ............ Información general')
    console.log('alquiTest.routes() .......... Lista de rutas')
    console.log('alquiTest.features() ........ Features clave')
    console.log('alquiTest.tests ............. Casos de prueba')
    console.log('alquiTest.nav ............... Navegación rápida')
    console.log('alquiTest.checkStores() ..... Estado de stores')
    console.log('alquiTest.data .............. Datos mock disponibles')
    
    console.log('\n%c📖 Ejemplos:', 'color: #10b981; font-size: 14px;')
    console.log('alquiTest.nav.login() ....... Ir a página de login')
    console.log('alquiTest.tests.loginDemo() . Ver test de login')
    console.log('alquiTest.tests.calculator()  Ver test de calculadora')
  }
}

// Mensaje de bienvenida
console.log('%c🎉 Testing Helper cargado!', 'color: #10b981; font-size: 14px; font-weight: bold;')
console.log('Escribe %calquiTest.help()%c para ver comandos disponibles', 'color: #2563eb; font-weight: bold;', '')
console.log('Escribe %calquiTest.info()%c para información de testing', 'color: #2563eb; font-weight: bold;', '')
