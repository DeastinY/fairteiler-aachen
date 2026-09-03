import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ActivityBars from '../src/components/ActivityBars.vue'

describe('ActivityBars', () => {
  it('renders one bar per day', () => {
    const wrapper = mount(ActivityBars, { props: { days: [0, 1, 2, 3, 4, 5, 6] } })
    expect(wrapper.findAll('.bar')).toHaveLength(7)
  })

  it('scales bar heights proportionally to the data', () => {
    const wrapper = mount(ActivityBars, { props: { days: [0, 13, 26, 13, 26, 13, 26] } })
    const heights = wrapper.findAll('.bar').map((bar) => bar.element.style.height)
    expect(heights).toEqual(['4px', '13px', '26px', '13px', '26px', '13px', '26px'])
  })

  it('emphasizes the last bar (today)', () => {
    const wrapper = mount(ActivityBars, { props: { days: [1, 1, 1, 1, 1, 1, 1] } })
    const bars = wrapper.findAll('.bar')
    expect(bars[6]!.classes()).toContain('hi')
    for (const bar of bars.slice(0, 6)) {
      expect(bar.classes()).not.toContain('hi')
    }
  })

  it('renders minimum-height bars when there is no activity', () => {
    const wrapper = mount(ActivityBars, { props: { days: [0, 0, 0, 0, 0, 0, 0] } })
    for (const bar of wrapper.findAll('.bar')) {
      expect(bar.element.style.height).toBe('4px')
    }
  })
})
