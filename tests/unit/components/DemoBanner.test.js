// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DemoBanner from '@/components/layout/DemoBanner.vue'

describe('DemoBanner.vue', () => {
  beforeEach(() => {
    localStorage.removeItem('demoBannerDismissed')
  })

  it('displays the demo credentials that match the auth store mock users', async () => {
    const wrapper = mount(DemoBanner)
    await nextTick()
    const text = wrapper.text()

    expect(text).toContain('usuario@alquilibres.com')
    expect(text).toContain('user123')
    expect(text).toContain('admin@alquilibres.com')
    expect(text).toContain('admin123')
  })
})
