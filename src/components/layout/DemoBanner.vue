<template>
  <div v-if="isDemo" class="demo-banner">
    <div class="demo-content">
      <span class="demo-icon">🧪</span>
      <p class="demo-text">
        <strong>Modo de Prueba:</strong> 
        Usando datos de ejemplo. 
        <span class="demo-credentials">
          <strong>Huésped:</strong> <code>huesped@alquilibres.com</code> / <code>guest123</code>
          <span class="separator">|</span>
          <strong>Propietario:</strong> <code>usuario@alquilibres.com</code> / <code>user123</code>
        </span>
      </p>
      <button @click="dismiss" class="demo-close" aria-label="Cerrar banner">
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDemo = ref(false)

onMounted(() => {
  // Mostrar banner en entornos de prueba; el usuario puede cerrarlo.
  isDemo.value = true

  // No mostrar si el usuario ya lo cerró
  if (localStorage.getItem('demoBannerDismissed')) {
    isDemo.value = false
  }
})

const dismiss = () => {
  isDemo.value = false
  localStorage.setItem('demoBannerDismissed', 'true')
}
</script>

<style scoped>
.demo-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.demo-text {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.demo-text strong {
  font-weight: 600;
}

.demo-credentials {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  flex-wrap: wrap;
}

.demo-credentials code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.separator {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 300;
}

.demo-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition: background 0.2s;
  flex-shrink: 0;
}

.demo-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .demo-banner {
    padding: 8px 12px;
  }

  .demo-content {
    flex-wrap: wrap;
    gap: 8px;
  }

  .demo-icon {
    font-size: 1.25rem;
  }
  
  .demo-credentials {
    display: block;
    margin-left: 0;
    margin-top: 4px;
    font-size: 0.75rem;
  }

  .demo-credentials code {
    font-size: 0.75rem;
    padding: 1px 4px;
  }

  .demo-credentials .separator {
    display: none;
  }

  .demo-credentials strong {
    display: block;
    margin-top: 4px;
  }
  
  .demo-text {
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .demo-text br {
    display: none;
  }

  .demo-text small {
    font-size: 0.7rem;
  }

  .demo-close {
    width: 24px;
    height: 24px;
    font-size: 1.25rem;
  }
}
</style>
