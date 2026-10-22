# 🚀 Inicio Rápido - Testing Alquí Libres

## ⚡ Empezar Ahora

1. **Levantar el servidor de desarrollo:** `npm run dev`
2. **Abrir en el navegador:** http://localhost:5173
3. **Abrir la consola:** F12 o Ctrl+Shift+I para ver errores

## 🎯 Tests Prioritarios (15 minutos)

### 1️⃣ Filtros Hiper-Locales (Feature Diferenciador) - 3 min

- Ir a `/buscar`
- Click "Filtros Avanzados"
- Seleccionar "Carbón" en Tipo de Parrilla
- Verificar: 2 propiedades mostradas

**¿Por qué es importante?**
Este es el diferenciador clave vs Airbnb/Booking. Ninguna otra plataforma tiene filtros tan específicos para alquileres locales.

---

### 2️⃣ Calculadora de Ahorro (Feature Competitivo) - 4 min

- Login con `huesped@alquilibres.com` / `guest123`
- Ir a `/panel/suscripcion`
- Cambiar a 10 reservas/mes × $100/noche
- Verificar cálculos:
  - Airbnb (15%): ~$150/mes
  - Booking (18%): ~$180/mes
  - Ahorro anual destacado

**¿Por qué es importante?**
Muestra el ROI claro de la suscripción vs comisiones. Es el argumento de venta principal.

---

### 3️⃣ Login y Dashboard - 3 min

- Ir a `/login`
- Email: `huesped@alquilibres.com`
- Password: `guest123`
- Click "Iniciar Sesión"
- Verificar redirección a `/panel`
- Verificar estadísticas: 3 propiedades, 2 mensajes

---

### 4️⃣ CRUD de Propiedades - 3 min

- Estando logueado, ir a `/panel/propiedades`
- Click "Agregar Nueva Propiedad"
- Verificar sección "CARACTERÍSTICAS LOCALES" destacada
- Completar formulario
- Verificar validaciones

---

### 5️⃣ Responsive Mobile - 2 min

- F12 → Toggle device toolbar (Ctrl+Shift+M)
- Seleccionar iPhone 12 Pro (390px)
- Verificar:
  - Navegación hamburger
  - Cards apilan en 1 columna
  - Sin scroll horizontal
  - Botones fáciles de clickear

---

## 📋 Checklist Rápido

Marca las funcionalidades que probaste:

**Diferenciadores Competitivos:**
- [ ] Filtros hiper-locales (parrilla + parking)
- [ ] Calculadora de ahorro vs comisiones
- [ ] Precio transparente sin comisiones

**Funcionalidad Core:**
- [ ] Login/Logout
- [ ] Dashboard con estadísticas
- [ ] Búsqueda con filtros
- [ ] CRUD de propiedades
- [ ] Sistema de mensajes
- [ ] Detalle de propiedad

**UX/UI:**
- [ ] Responsive mobile/tablet/desktop
- [ ] Navegación fluida
- [ ] Diseño consistente
- [ ] Loading states
- [ ] Mensajes de error claros

---

## 🎨 Puntos Visuales a Verificar

### Banner Demo (Top)
```
🧪 Modo de Prueba: Usando datos de ejemplo
   Login: huesped@alquilibres.com / guest123
```

### Hero Homepage
```
Alquileres Temporarios
Sin Comisiones
[Formulario de búsqueda inline]
```

### Búsqueda - Filtros Avanzados
```
▼ Filtros Avanzados
  Tipo de Parrilla: [SELECT] ← DESTACADO
  Tamaño Estacionamiento: [SELECT] ← DESTACADO
```

### Suscripción - Calculadora
```
💰 Calculadora de Ahorro
   Reservas mensuales: [10]
   Precio promedio: [$100]

   VS Airbnb (15%): $150/mes
   VS Booking (18%): $180/mes

   AHORRO ANUAL: $XXX ← GRANDE Y DESTACADO
```

---

## 🐛 Si Encuentras un Bug

1. **Tomar screenshot**
2. **Anotar pasos para reproducir**
3. **Verificar en consola (F12) si hay errores rojos**
4. **Documentar en:** `TESTING-RESULTS.md`

---

## 📊 Criterios de Éxito

✅ **PASS:** Todas las funcionalidades trabajan como se espera
⚠️ **WARN:** Funciona pero tiene issues menores de UX
❌ **FAIL:** No funciona o tiene bugs críticos

---

## 🎯 Objetivo del Testing

Validar que:
1. Los **diferenciadores competitivos** están claros y funcionan
2. El **flujo completo** de propietario funciona (desde registro hasta gestión)
3. La **experiencia responsive** es buena en todos los dispositivos
4. **No hay errores** críticos que bloqueen el uso

---

## ⏭️ Después del Testing

Si todo funciona bien:
1. Revisar variables de entorno en producción
2. Verificar token de Vercel Blob para subida de imágenes
3. Integrar pasarela de pago
4. Deploy a producción

---

**Tiempo estimado total:** 15-20 minutos
**Prioridad:** Testear diferenciadores competitivos primero
**Documentación completa:** Ver `TESTING.md` y `TEST-PLAN.md`

---

## 💡 Tips

- Usa **Vue DevTools** para inspeccionar componentes y stores
- El banner demo se puede cerrar con la ×
- Los datos se resetean al recargar (es normal, es mock data)
- Si algo no funciona, verifica la consola (F12) para errores

---

**¡Happy Testing! 🚀**
