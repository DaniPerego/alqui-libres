<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">
            <span class="pdl-logo pdl-logo-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                <rect x="4" y="4" width="11" height="11" rx="2" fill="#e85d04" opacity="0.5"/>
                <rect x="17" y="4" width="11" height="11" rx="2" fill="#e85d04" opacity="0.35"/>
                <rect x="4" y="17" width="11" height="11" rx="2" fill="#e85d04" opacity="0.2"/>
                <rect x="17" y="17" width="11" height="11" rx="2" fill="#e85d04" opacity="0.1"/>
                <path d="M16 5L5 14h3v11h6v-7h4v7h6V14h3L16 5z" fill="#2563eb" stroke="#2563eb" stroke-width="0.5" stroke-linejoin="round"/>
              </svg>
            </span>
            AlquiLibres
          </h3>
          <p class="footer-text">
            {{ t('footer.description') }}
          </p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ t('footer.forOwners') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/registro">{{ t('footer.publishProperty') }}</router-link></li>
            <li><router-link to="/panel">{{ t('footer.controlPanel') }}</router-link></li>
            <li><a href="#planes">{{ t('footer.plans') }}</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ t('footer.forGuests') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/buscar">{{ t('footer.searchAccommodation') }}</router-link></li>
            <li><router-link to="/como-funciona">{{ t('footer.howItWorks') }}</router-link></li>
            <li><router-link to="/faq">{{ t('footer.faq') }}</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ t('footer.company') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/nosotros">{{ t('footer.aboutUs') }}</router-link></li>
            <li><router-link to="/contacto">{{ t('footer.contact') }}</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ t('footer.legal') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/terminos">{{ t('footer.terms') }}</router-link></li>
            <li><router-link to="/privacidad">{{ t('footer.privacy') }}</router-link></li>
            <li><router-link to="/contrato">{{ t('footer.contract') }}</router-link></li>
            <li><router-link to="/cookies">{{ t('footer.cookies') }}</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ t('footer.support') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/faq">{{ t('footer.helpCenter') }}</router-link></li>
            <li><router-link to="/faq">{{ t('footer.faq') }}</router-link></li>
            <li><router-link to="/contacto">{{ t('footer.contact') }}</router-link></li>
            <li><a href="mailto:soporte@alquilibres.com">{{ t('footer.email') }}</a></li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p>&copy; 2026 AlquiLibres. {{ t('footer.rights') }}</p>
          <p class="footer-brand">
            <span class="pdl-logo pdl-logo-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                <rect x="4" y="4" width="11" height="11" rx="2" fill="currentColor" opacity="1"/>
                <rect x="17" y="4" width="11" height="11" rx="2" fill="currentColor" opacity="0.7"/>
                <rect x="4" y="17" width="11" height="11" rx="2" fill="currentColor" opacity="0.5"/>
                <rect x="17" y="17" width="11" height="11" rx="2" fill="currentColor" opacity="0.3"/>
              </svg>
            </span>
            DesarrolloWeb-pdl
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.footer {
  position: relative;
  background-color: var(--gray-900);
  color: var(--gray-300);
  padding: var(--spacing-2xl) 0 var(--spacing-lg);
  margin-top: var(--spacing-2xl);
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-600), #764ba2, var(--primary-600));
}

.footer-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--gray-800);
}

.footer-section:first-child {
  border-top: none;
  padding-top: 0;
}

.footer-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.footer-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--gray-400);
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-links a {
  color: var(--gray-400);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color var(--transition-fast), transform var(--transition-fast);
  display: inline-block;
}

.footer-links a:hover {
  color: white;
  transform: translateX(4px);
}

.footer-bottom {
  border-top: 1px solid var(--gray-800);
  padding-top: var(--spacing-lg);
  font-size: 0.875rem;
  color: var(--gray-500);
}

.footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.footer-social {
  display: flex;
  gap: var(--spacing-md);
}

.footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--gray-800);
  color: var(--gray-400);
  border-radius: 50%;
  border: 1px solid var(--gray-700);
  transition: all var(--transition-fast);
}

.footer-social a:hover {
  background-color: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
  transform: translateY(-2px);
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--gray-500);
}

.footer-brand .pdl-logo {
  color: var(--gray-500);
}

.footer-brand .pdl-logo:hover {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .footer-links {
    align-items: center;
  }

  .footer-links a:hover {
    transform: none;
  }

  .footer-bottom-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-social {
    justify-content: center;
  }
}
</style>
