import { createI18n } from 'vue-i18n'
import es from './es.js'
import en from './en.js'
import pt from './pt.js'

const savedLocale = localStorage.getItem('alquilibres-locale') || 'es'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'es',
  messages: { es, en, pt }
})

export default i18n
