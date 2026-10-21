// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import Login from '@/views/auth/Login.vue'
import es from '@/i18n/es.js'

vi.mock('@/config/firebase', () => ({ auth: null }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), currentRoute: { value: { query: {} } } })
}))

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es }
})

function mountLogin() {
  return mount(Login, {
    global: {
      plugins: [i18n, createPinia()]
    }
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Login.vue', () => {
  it('shows both credential fields empty on load', async () => {
    const wrapper = mountLogin()
    await sleep(400)

    expect(wrapper.find('input[type="email"]').element.value).toBe('')
    expect(wrapper.find('input[type="password"]').element.value).toBe('')
  })

  it('clears values the browser password manager injects right after load', async () => {
    const wrapper = mountLogin()

    // Simulate the browser dropping saved credentials into the fields.
    wrapper.find('input[type="email"]').element.value = 'dev@desarrolloweb-pdl.com'
    wrapper.find('input[type="password"]').element.value = 'guardada-en-el-navegador'

    await sleep(400)

    expect(wrapper.find('input[type="email"]').element.value).toBe('')
    expect(wrapper.find('input[type="password"]').element.value).toBe('')
  })

  it('never wipes what the user has already focused or typed', async () => {
    const wrapper = mountLogin()
    const email = wrapper.find('input[type="email"]')

    await email.trigger('focus')
    await email.setValue('persona@test.com')

    await sleep(400)

    expect(email.element.value).toBe('persona@test.com')
  })

  it('keeps the demo autofill buttons working', async () => {
    const wrapper = mountLogin()

    await wrapper.find('button.copy-btn').trigger('click')
    await sleep(400)

    expect(wrapper.find('input[type="email"]').element.value).toBe('huesped@alquilibres.com')
    expect(wrapper.find('input[type="password"]').element.value).toBe('guest123')
  })
})
