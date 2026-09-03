import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SkeletonBlock from '../src/components/SkeletonBlock.vue'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SkeletonBlock', () => {
  it('renders an aria-hidden bar with the given geometry', () => {
    const wrapper = mount(SkeletonBlock, { props: { width: '55%', height: '24px' } })
    const bar = wrapper.find('.skeleton')
    expect(bar.attributes('aria-hidden')).toBe('true')
    expect(bar.element.style.width).toBe('55%')
    expect(bar.element.style.height).toBe('24px')
    expect(bar.classes()).not.toContain('no-shimmer')
  })

  it('disables the shimmer when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
    }))
    const wrapper = mount(SkeletonBlock)
    expect(wrapper.find('.skeleton').classes()).toContain('no-shimmer')
  })

  it('announces loading to screen readers only when asked', () => {
    const silent = mount(SkeletonBlock)
    expect(silent.find('[role="status"]').exists()).toBe(false)

    const announcing = mount(SkeletonBlock, { props: { announce: true } })
    expect(announcing.find('[role="status"]').text()).toBe('Lade Fairteiler …')
  })
})
