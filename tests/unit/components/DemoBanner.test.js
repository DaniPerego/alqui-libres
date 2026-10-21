// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DemoBanner from '@/components/layout/DemoBanner.vue'

describe('DemoBanner.vue', () => {
  beforeEach(() => {
    localStorage.removeItem('demoBannerDismissed')
  })

  it('advertises only the public demo credentials — never the admin account', async () => {
    const wrapper = mount(DemoBanner)
    await nextTick()
    const text = wrapper.text()

    expect(text).toContain('huesped@alquilibres.com')
    expect(text).toContain('guest123')
    expect(text).toContain('usuario@alquilibres.com')
    expect(text).toContain('user123')

    // The admin account belongs to the platform owner only: the published
    // app must not advertise it anywhere.
    expect(text).not.toContain('admin@alquilibres.com')
    expect(text).not.toContain('admin123')
  })
})
