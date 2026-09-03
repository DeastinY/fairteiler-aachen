import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { offlineBannerVisible, useOnline } from '../src/composables/useOnline'

describe('offlineBannerVisible', () => {
  it('is hidden while online', () => {
    expect(offlineBannerVisible(true, true, false)).toBe(false)
    expect(offlineBannerVisible(true, false, true)).toBe(false)
  })

  it('shows offline once data (possibly stale) is displayed', () => {
    expect(offlineBannerVisible(false, true, false)).toBe(true)
  })

  it('shows offline when the load failed', () => {
    expect(offlineBannerVisible(false, false, true)).toBe(true)
  })

  it('is hidden offline before any load attempt resolved', () => {
    expect(offlineBannerVisible(false, false, false)).toBe(false)
  })
})

describe('useOnline', () => {
  const Probe = defineComponent({
    setup() {
      const online = useOnline()
      return { online }
    },
    template: '<span>{{ online }}</span>',
  })

  it('tracks window online/offline events', async () => {
    const wrapper = mount(Probe)
    expect(wrapper.text()).toBe('true')

    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('false')

    window.dispatchEvent(new Event('online'))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('true')
  })
})
